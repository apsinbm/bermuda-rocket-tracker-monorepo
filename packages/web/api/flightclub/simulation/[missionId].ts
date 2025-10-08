/**
 * Vercel Serverless Function: Flight Club Simulation Data Proxy
 * 
 * Securely proxies requests to Flight Club API for mission telemetry data
 * Implements caching, processing, and Bermuda-specific calculations
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCachedSimulation, setCachedSimulation, CACHE_VERSION } from '../cache';
import { withRateLimit } from '../../utils/rateLimit';

/**
 * Validate mission ID format to prevent SSRF and injection attacks
 * FlightClub mission IDs are either:
 * - GUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * - Sim ID format: sim_xxxxxxxxx (alphanumeric + underscore)
 */
function isValidMissionId(id: unknown): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Length check (prevent DoS with huge strings)
  if (id.length > 256) {
    return false;
  }

  // GUID pattern: 8-4-4-4-12 hex chars
  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Sim ID pattern: sim_ followed by alphanumeric/underscore
  const simIdPattern = /^sim_[a-z0-9_]{1,50}$/i;

  return guidPattern.test(id) || simIdPattern.test(id);
}

// Types for Flight Club telemetry
interface FlightClubTelemetryFrame {
  time: number; // seconds from liftoff
  latitude: number;
  longitude: number;
  altitude: number; // meters
  speed: number; // m/s
}

interface FlightClubStage {
  stageNumber: number;
  telemetry: FlightClubTelemetryFrame[];
}

interface FlightClubSimulationResponse {
  missionId: string;
  simulationId: string;
  launchLibraryId?: string;
  description: string;
  company: string;
  vehicle: string;
  stages: FlightClubStage[];
}

// Enhanced telemetry with Bermuda calculations
interface EnhancedTelemetryFrame extends FlightClubTelemetryFrame {
  // Distance and bearing from Bermuda
  distanceFromBermuda: number; // km
  bearingFromBermuda: number; // degrees
  // Line of sight visibility
  aboveHorizon: boolean;
  elevationAngle: number; // degrees above horizon
  // Stage information
  stageNumber: number;
  // Derived data
  velocityVector?: {
    magnitude: number; // km/s
    direction: number; // degrees
  };
}

export interface ProcessedSimulationData {
  missionId: string;
  rawData: FlightClubSimulationResponse;
  enhancedTelemetry: EnhancedTelemetryFrame[];
  visibilitySummary: {
    firstVisible: number | null; // T+ seconds
    lastVisible: number | null; // T+ seconds  
    peakVisibility: number | null; // T+ seconds (closest approach)
    totalDuration: number; // seconds
    closestApproach: {
      distance: number; // km
      bearing: number; // degrees
      time: number; // T+ seconds
    };
    visibleFrameCount: number;
  };
  stageEvents: Array<{
    time: number; // T+ seconds
    event: string; // 'MECO', 'Stage Sep', 'SECO', etc.
    stageNumber: number;
  }>;
  lastUpdated: string;
  cached: boolean;
  warning?: string;
}

// Bermuda coordinates
const BERMUDA_LAT = 32.3078;
const BERMUDA_LNG = -64.7505;
const EARTH_RADIUS_KM = 6371;

// Haversine distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = EARTH_RADIUS_KM;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Initial bearing calculation
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

// Line of sight visibility calculation
function calculateVisibility(distance: number, altitude: number): { aboveHorizon: boolean; elevationAngle: number } {
  const altitudeKm = altitude / 1000;
  const horizonDistance = Math.sqrt(2 * EARTH_RADIUS_KM * altitudeKm + altitudeKm * altitudeKm);
  
  const aboveHorizon = distance <= horizonDistance;
  
  let elevationAngle = 0;
  if (aboveHorizon && distance > 0) {
    const earthCenterAngle = Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeKm));
    const observerAngle = Math.asin(distance / (EARTH_RADIUS_KM + altitudeKm));
    elevationAngle = Math.max(0, (earthCenterAngle - observerAngle) * (180 / Math.PI));
  }
  
  return { aboveHorizon, elevationAngle };
}

// Detect stage events from velocity changes
function detectStageEvents(telemetry: EnhancedTelemetryFrame[]): Array<{ time: number; event: string; stageNumber: number; description?: string; engineType?: 'Merlin' | 'MVac' | 'Unknown' }> {
  const events: Array<{ time: number; event: string; stageNumber: number; description?: string; engineType?: 'Merlin' | 'MVac' | 'Unknown' }> = [];

  // Track detected events to prevent duplicates
  // Map of event type -> last time detected
  const detectedEvents = new Map<string, number>();
  const MIN_EVENT_GAP = 30; // Minimum 30 seconds between events of same type

  let stageTransitionTime = 0; // Track when stage separation occurs

  // Check if we have stage 1 data at all
  const hasStage1Data = telemetry.some(f => f.stageNumber === 1);
  const firstStage2Frame = telemetry.find(f => f.stageNumber === 2);

  // If FlightClub only provides stage 2 data, infer stage 1 events from stage 2 start time
  if (!hasStage1Data && firstStage2Frame) {
    const stage2StartTime = firstStage2Frame.time;

    // Typical Falcon 9 timeline:
    // Max-Q at T+70-80s
    // MECO at T+150-162s
    // Stage Sep at T+153-165s (3 seconds after MECO)
    if (stage2StartTime > 100) {
      // Infer Max-Q happened at typical T+75s (if we have enough timeline)
      if (stage2StartTime > 140) {
        events.push({
          time: 75,
          event: 'Max-Q',
          stageNumber: 1,
          description: 'Maximum aerodynamic pressure (inferred)'
        });
        detectedEvents.set('Max-Q', 75);
      }

      // Infer MECO happened ~3 seconds before stage 2 start (MUST BE BEFORE STAGE SEP)
      const inferredMecoTime = Math.max(0, stage2StartTime - 3);
      events.push({
        time: inferredMecoTime,
        event: 'MECO',
        stageNumber: 1,
        description: 'Main Engine Cutoff (inferred from stage 2 start)',
        engineType: 'Merlin'
      });
      detectedEvents.set('MECO', inferredMecoTime);

      // Stage separation at stage 2 start (MUST BE AFTER MECO)
      events.push({
        time: stage2StartTime,
        event: 'Stage Separation',
        stageNumber: 1,
        description: 'First stage separation from second stage'
      });
      detectedEvents.set('Stage Separation', stage2StartTime);
      stageTransitionTime = stage2StartTime;
    }
  }

  for (let i = 1; i < telemetry.length; i++) {
    const current = telemetry[i];
    const previous = telemetry[i - 1];

    const speedChange = (current.speed - previous.speed) / previous.speed;
    const timeGap = current.time - previous.time;

    // Max-Q detection (Maximum dynamic pressure) - Stage 1 only
    // Occurs at T+70-90s when rocket is moving fast but still in thick atmosphere
    // Look for velocity peak in the transonic/supersonic region with moderate altitude
    if (current.stageNumber === 1 &&
        !detectedEvents.has('Max-Q') &&
        current.time > 60 && current.time < 95 &&
        current.altitude > 10000 && current.altitude < 20000 &&
        current.speed > 400) {

      // Find the point where speed is high and acceleration starts to increase after throttle-down
      // Max-Q is when dynamic pressure (0.5 * density * velocity^2) peaks
      const nextFrame = i < telemetry.length - 1 ? telemetry[i + 1] : null;

      if (nextFrame) {
        const futureSpeedChange = (nextFrame.speed - current.speed) / current.speed;
        const currentAccelerating = speedChange > 0;
        const willAccelerate = futureSpeedChange > speedChange; // Acceleration increasing

        // Max-Q is typically when throttle increases again after brief reduction
        if (currentAccelerating && willAccelerate) {
          events.push({
            time: current.time,
            event: 'Max-Q',
            stageNumber: 1,
            description: 'Maximum aerodynamic pressure'
          });
          detectedEvents.set('Max-Q', current.time);
        }
      }
    }

    // Stage separation detection MUST come BEFORE MECO detection in the loop
    // But we check for stage changes first to get the proper transition time
    if (current.stageNumber !== previous.stageNumber &&
        !detectedEvents.has('Stage Separation') &&
        hasStage1Data &&
        current.time > 100) { // Must be after 100 seconds to be real separation
      stageTransitionTime = current.time;

      // IMPORTANT: Stage separation happens ~3 seconds AFTER MECO
      // So when we detect stage separation, we should retroactively add MECO
      const mecoTime = current.time - 3;

      if (!detectedEvents.has('MECO')) {
        events.push({
          time: mecoTime,
          event: 'MECO',
          stageNumber: 1,
          description: 'Main Engine Cutoff (Merlin engines)',
          engineType: 'Merlin'
        });
        detectedEvents.set('MECO', mecoTime);
      }

      events.push({
        time: current.time,
        event: 'Stage Separation',
        stageNumber: previous.stageNumber,
        description: 'First stage separation from second stage'
      });
      detectedEvents.set('Stage Separation', current.time);
    }

    // MECO detection (Merlin engines - first stage)
    // Only detect if we haven't already detected it from stage separation
    const lastMecoTime = detectedEvents.get('MECO') ?? -Infinity;
    if (!detectedEvents.has('MECO') &&
        speedChange < -0.1 &&
        current.time > 100 &&
        current.time < 200 &&
        current.stageNumber === 1 &&
        (current.time - lastMecoTime) > MIN_EVENT_GAP) {
      events.push({
        time: current.time,
        event: 'MECO',
        stageNumber: 1,
        description: 'Main Engine Cutoff (Merlin engines)',
        engineType: 'Merlin'
      });
      detectedEvents.set('MECO', current.time);
    }

    // SECO detection (MVac engine - second stage)
    // Detect ONLY ONE SECO - the final engine cutoff when reaching orbit
    // Look for velocity plateau or end of burn after stage separation
    if (current.stageNumber === 2 &&
        stageTransitionTime > 0 &&
        current.time > stageTransitionTime + 60 &&
        !detectedEvents.has('SECO')) {

      // Detect orbital velocity plateau (speed stabilizes near 7500-7800 m/s)
      const orbitalVelocity = current.speed > 7000 && current.speed < 8500;
      const velocityStable = Math.abs(speedChange) < 0.01;

      // OR detect significant speed drop (engine cutoff)
      const engineCutoff = speedChange < -0.05;

      // OR approaching end of telemetry data (likely final SECO)
      const nearEndOfData = i >= telemetry.length - 15;
      const reasonableSpeed = current.speed > 5000; // Must have reached reasonable orbital speed

      if ((orbitalVelocity && velocityStable) || engineCutoff || (nearEndOfData && reasonableSpeed)) {
        events.push({
          time: current.time,
          event: 'SECO',
          stageNumber: 2,
          description: 'Second Engine Cutoff - Orbital insertion complete',
          engineType: 'MVac'
        });
        detectedEvents.set('SECO', current.time);
      }
    }
  }

  // Sort events chronologically (MECO → Stage Sep → SECO)
  return events.sort((a, b) => a.time - b.time);
}

// Validate FlightClub telemetry data for realism
function validateTelemetryData(rawData: FlightClubSimulationResponse): { isValid: boolean; maxAltitude: number; reason: string } {
  const allFrames: any[] = [];
  
  rawData.stages.forEach(stage => {
    stage.telemetry.forEach(frame => {
      allFrames.push(frame);
    });
  });
  
  if (allFrames.length === 0) {
    return { isValid: false, maxAltitude: 0, reason: 'No telemetry data' };
  }
  
  const maxAltitude = Math.max(...allFrames.map(f => f.altitude));
  const maxTime = Math.max(...allFrames.map(f => f.time));
  const maxSpeed = Math.max(...allFrames.map(f => f.speed || 0));
  
  // For orbital missions (ISS, etc), expect >150km altitude and >7km/s velocity
  const isOrbitalMission = rawData.description?.toLowerCase().includes('cygnus') ||
                          rawData.description?.toLowerCase().includes('dragon') ||
                          rawData.description?.toLowerCase().includes('iss') ||
                          rawData.description?.toLowerCase().includes('crew');
  
  if (isOrbitalMission) {
    if (maxAltitude < 100000) { // Less than 100km for orbital mission = suspicious
      return { 
        isValid: false, 
        maxAltitude: maxAltitude / 1000, 
        reason: `Orbital mission with max altitude ${(maxAltitude/1000).toFixed(1)}km is unrealistic (expected >150km)` 
      };
    }
    if (maxSpeed < 5000) { // Less than 5km/s for orbital mission = suspicious
      return { 
        isValid: false, 
        maxAltitude: maxAltitude / 1000, 
        reason: `Orbital mission with max speed ${(maxSpeed/1000).toFixed(1)}km/s is unrealistic (expected >7km/s)` 
      };
    }
  }
  
  console.log(`[FlightClub] Telemetry validation: maxAlt=${(maxAltitude/1000).toFixed(1)}km, maxSpeed=${(maxSpeed/1000).toFixed(1)}km/s, maxTime=${maxTime}s`);
  return { isValid: true, maxAltitude: maxAltitude / 1000, reason: 'Data appears realistic' };
}

// Generate realistic ISS mission telemetry when FlightClub data is invalid
function generateRealisticISSTelemetry(missionId: string, description: string): ProcessedSimulationData {
  console.log(`[FlightClub] Generating realistic ISS telemetry for ${description}`);
  
  const enhancedTelemetry: EnhancedTelemetryFrame[] = [];
  const CAPE_CANAVERAL_LAT = 28.5618;
  const CAPE_CANAVERAL_LNG = -80.5772;
  const ISS_INCLINATION = 51.6; // degrees
  
  // Generate 600 seconds of realistic Falcon 9 ISS trajectory
  for (let t = 0; t <= 600; t += 30) {
    // Realistic altitude profile for ISS missions
    let altitude: number;
    let speed: number;
    let stageNumber: number;
    
    if (t <= 162) {
      // First stage: 0-80km altitude, 0-2.4km/s
      altitude = Math.pow(t / 162, 1.8) * 80000;
      speed = (t / 162) * 2400;
      stageNumber = 1;
    } else if (t <= 165) {
      // Stage separation
      altitude = 80000 + (t - 162) * 1000;
      speed = 2400;
      stageNumber = 1;
    } else if (t <= 540) {
      // Second stage: 80-200km altitude, 2.4-7.8km/s
      const progress = (t - 165) / (540 - 165);
      altitude = 80000 + Math.pow(progress, 1.2) * 120000;
      speed = 2400 + progress * 5400;
      stageNumber = 2;
    } else {
      // Coasting
      altitude = 200000 + (t - 540) * 100;
      speed = 7800;
      stageNumber = 2;
    }
    
    // Calculate realistic trajectory position (northeast for ISS)
    const azimuthRad = ISS_INCLINATION * Math.PI / 180;
    const distanceKm = t <= 30 ? t * 0.3 : 
                      t <= 162 ? Math.pow(t / 162, 2) * 194 :
                      194 + (t - 162) * 7;
    
    const angularDistance = distanceKm / 6371;
    const lat1Rad = CAPE_CANAVERAL_LAT * Math.PI / 180;
    const lng1Rad = CAPE_CANAVERAL_LNG * Math.PI / 180;
    
    const lat2Rad = Math.asin(
      Math.sin(lat1Rad) * Math.cos(angularDistance) +
      Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(azimuthRad)
    );
    
    const lng2Rad = lng1Rad + Math.atan2(
      Math.sin(azimuthRad) * Math.sin(angularDistance) * Math.cos(lat1Rad),
      Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
    );
    
    const latitude = lat2Rad * 180 / Math.PI;
    const longitude = lng2Rad * 180 / Math.PI;
    
    // Calculate distance and visibility from Bermuda
    const distance = calculateDistance(BERMUDA_LAT, BERMUDA_LNG, latitude, longitude);
    const bearing = calculateBearing(BERMUDA_LAT, BERMUDA_LNG, latitude, longitude);
    const visibility = calculateVisibility(distance, altitude);
    
    enhancedTelemetry.push({
      time: t,
      latitude,
      longitude,
      altitude,
      speed,
      distanceFromBermuda: distance,
      bearingFromBermuda: bearing,
      aboveHorizon: visibility.aboveHorizon,
      elevationAngle: visibility.elevationAngle,
      stageNumber,
      velocityVector: {
        magnitude: speed / 1000,
        direction: ISS_INCLINATION
      }
    });
  }
  
  return {
    missionId,
    rawData: {
      missionId,
      simulationId: 'generated',
      description: `${description} (Generated - FlightClub data invalid)`,
      company: 'SpaceX',
      vehicle: 'Falcon 9',
      stages: [
        {
          stageNumber: 1,
          telemetry: enhancedTelemetry.filter(f => f.stageNumber === 1).map(f => ({
            time: f.time,
            latitude: f.latitude,
            longitude: f.longitude,
            altitude: f.altitude,
            speed: f.speed
          }))
        },
        {
          stageNumber: 2,
          telemetry: enhancedTelemetry.filter(f => f.stageNumber === 2).map(f => ({
            time: f.time,
            latitude: f.latitude,
            longitude: f.longitude,
            altitude: f.altitude,
            speed: f.speed
          }))
        }
      ]
    },
    enhancedTelemetry,
    visibilitySummary: {
      firstVisible: 180,
      lastVisible: 480,
      peakVisibility: 330,
      totalDuration: 300,
      closestApproach: {
        distance: Math.min(...enhancedTelemetry.map(f => f.distanceFromBermuda)),
        bearing: 247,
        time: 330
      },
      visibleFrameCount: enhancedTelemetry.filter(f => f.aboveHorizon).length
    },
    stageEvents: [
      { time: 75, event: 'Max-Q', stageNumber: 1 },
      { time: 162, event: 'MECO', stageNumber: 1 },
      { time: 165, event: 'Stage Separation', stageNumber: 1 },
      { time: 540, event: 'SECO', stageNumber: 2 }
    ],
    lastUpdated: new Date().toISOString(),
    cached: false
  };
}

// Process raw telemetry data
export function processSimulationData(rawData: FlightClubSimulationResponse): ProcessedSimulationData {
  // First, validate the telemetry data for realism
  const validation = validateTelemetryData(rawData);
  
  if (!validation.isValid) {
    console.log(`[FlightClub] Invalid telemetry detected: ${validation.reason} - Using realistic fallback`);
    return generateRealisticISSTelemetry(rawData.missionId, rawData.description);
  }
  
  // Flatten all telemetry frames with stage info
  // Process ALL stages for complete event detection, but mark which should be displayed
  const allFrames: EnhancedTelemetryFrame[] = [];

  // Find stage separation time to mark displayable frames
  let stageSeparationTime = Infinity;
  if (rawData.stages.length > 1) {
    const stage2Start = rawData.stages.find(s => s.stageNumber === 2);
    if (stage2Start && stage2Start.telemetry.length > 0) {
      stageSeparationTime = stage2Start.telemetry[0].time;
    }
  }

  rawData.stages.forEach(stage => {
    stage.telemetry.forEach(frame => {
      const distance = calculateDistance(BERMUDA_LAT, BERMUDA_LNG, frame.latitude, frame.longitude);
      const bearing = calculateBearing(BERMUDA_LAT, BERMUDA_LNG, frame.latitude, frame.longitude);
      const visibility = calculateVisibility(distance, frame.altitude);

      // Mark frames for display: stage 1 ascent + all of stage 2
      // Stage 1 BEFORE separation (ascent): INCLUDE (shows Liftoff, Max-Q, MECO)
      // Stage 1 AFTER separation (booster return): EXCLUDE (user doesn't want booster landing)
      // Stage 2 (to orbit): INCLUDE (shows Stage Sep, SECO)
      const isStage1Ascent = stage.stageNumber === 1 && frame.time <= stageSeparationTime;
      const isStage2 = stage.stageNumber === 2;
      const shouldDisplay = isStage1Ascent || isStage2;

      allFrames.push({
        ...frame,
        distanceFromBermuda: distance,
        bearingFromBermuda: bearing,
        aboveHorizon: visibility.aboveHorizon,
        elevationAngle: visibility.elevationAngle,
        stageNumber: stage.stageNumber,
        displayInGraphs: shouldDisplay
      });
    });
  });

  // Sort by time
  allFrames.sort((a, b) => a.time - b.time);
  
  // Calculate velocity vectors
  for (let i = 1; i < allFrames.length; i++) {
    const current = allFrames[i];
    const previous = allFrames[i - 1];
    const deltaTime = current.time - previous.time;
    
    if (deltaTime > 0) {
      const deltaLat = current.latitude - previous.latitude;
      const deltaLng = current.longitude - previous.longitude;
      const deltaAlt = (current.altitude - previous.altitude) / 1000; // convert to km
      
      const groundDistance = calculateDistance(previous.latitude, previous.longitude, current.latitude, current.longitude);
      const totalDistance = Math.sqrt(groundDistance * groundDistance + deltaAlt * deltaAlt);
      
      const velocityMagnitude = totalDistance / deltaTime; // km per second

      current.velocityVector = {
        magnitude: velocityMagnitude,
        direction: calculateBearing(previous.latitude, previous.longitude, current.latitude, current.longitude)
      };
    }
  }
  
  // Calculate visibility summary
  const visibleFrames = allFrames.filter(f => f.aboveHorizon);
  const closestFrame = allFrames.reduce((closest, frame) => 
    frame.distanceFromBermuda < closest.distanceFromBermuda ? frame : closest
  );
  
  const visibilitySummary = {
    firstVisible: visibleFrames.length > 0 ? visibleFrames[0].time : null,
    lastVisible: visibleFrames.length > 0 ? visibleFrames[visibleFrames.length - 1].time : null,
    peakVisibility: closestFrame.time,
    totalDuration: visibleFrames.length > 0 ? 
      visibleFrames[visibleFrames.length - 1].time - visibleFrames[0].time : 0,
    closestApproach: {
      distance: closestFrame.distanceFromBermuda,
      bearing: closestFrame.bearingFromBermuda,
      time: closestFrame.time
    },
    visibleFrameCount: visibleFrames.length
  };
  
  // Detect stage events
  const stageEvents = detectStageEvents(allFrames);
  
  return {
    missionId: rawData.missionId,
    rawData,
    enhancedTelemetry: allFrames,
    visibilitySummary,
    stageEvents,
    lastUpdated: new Date().toISOString(),
    cached: false
  };
}

async function fetchSimulationFromFlightClub(missionId: string): Promise<FlightClubSimulationResponse> {
  const apiKey = process.env.FLIGHTCLUB_API_KEY;
  
  if (!apiKey) {
    throw new Error('Flight Club API key not configured');
  }
  
  const attempts: Array<{ param: string; value: string }> = [];

  const baseId = missionId.trim();
  if (!baseId) {
    throw new Error('Mission identifier is required');
  }

  const normalizedId = baseId.replace(/^\/+|\/+$/g, '');

  // Attempt order: specific parameter inferred from id prefix, then generic fallbacks
  if (normalizedId.startsWith('sim_')) {
    attempts.push({ param: 'simulationId', value: normalizedId });
  }

  if (normalizedId.startsWith('mis_') || normalizedId.startsWith('mission_')) {
    attempts.push({ param: 'missionId', value: normalizedId });
  }

  // Generic fallbacks
  attempts.push({ param: 'missionId', value: normalizedId });
  attempts.push({ param: 'simulationId', value: normalizedId });
  attempts.push({ param: 'id', value: normalizedId });

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const url = `https://api.flightclub.io/v3/simulation/lite?${attempt.param}=${encodeURIComponent(attempt.value)}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'Bermuda-Rocket-Tracker/1.0'
        },
        // Add timeout for upstream request protection
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        lastError = new Error(`Flight Club API error: ${response.status} ${response.statusText} (attempt ${attempt.param})`);
        continue;
      }

      // Validate Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        lastError = new Error(`Unexpected content type: ${contentType}. Expected application/json (attempt ${attempt.param})`);
        continue;
      }

      // Check Content-Length to prevent large responses
      const contentLength = response.headers.get('content-length');
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (contentLength && parseInt(contentLength) > maxSize) {
        lastError = new Error(`Response too large: ${contentLength} bytes. Maximum allowed: ${maxSize} bytes (attempt ${attempt.param})`);
        continue;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Unable to fetch Flight Club simulation data');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers with origin allowlist for security
  const allowedOrigins = [
    'https://bermuda-rocket-tracker.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ];

  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract and validate missionId
  const { missionId } = req.query as { missionId: string };

  if (!isValidMissionId(missionId)) {
    return res.status(400).json({
      error: 'Invalid mission ID format',
      message: 'Mission ID must be a valid GUID or sim_* identifier'
    });
  }

  // Apply rate limiting
  return withRateLimit(req, res, async () => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh) {
      const cachedEntry = await getCachedSimulation(missionId);
      if (cachedEntry) {
        console.log(`[FlightClub] Serving cached simulation ${missionId}`);
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({
          ...cachedEntry.data,
          cached: true
        });
      }
    }

    console.log(`[FlightClub] Fetching simulation ${missionId} from Flight Club API`);
    const rawSimulation = await fetchSimulationFromFlightClub(missionId);
    const processedData = processSimulationData(rawSimulation);

    await setCachedSimulation(missionId, {
      data: processedData,
      cachedAt: Date.now(),
      version: CACHE_VERSION
    });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      ...processedData,
      cached: false
    });

  } catch (error) {
    console.error(`Flight Club simulation API error for ${missionId}:`, error);

    const cachedEntry = await getCachedSimulation(missionId);
    if (cachedEntry) {
      console.log(`[FlightClub] Serving cached simulation ${missionId} due to API error`);
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      return res.status(200).json({
        ...cachedEntry.data,
        cached: true,
        warning: 'Serving cached data due to FlightClub API error'
      });
    }

    try {
      console.log(`[FlightClub] Falling back to generated telemetry for ${missionId}`);
      const fallback = generateRealisticISSTelemetry(missionId, `${missionId} (Generated Fallback)`);

      const fallbackWithWarning: ProcessedSimulationData = {
        ...fallback,
        warning: 'Generated fallback telemetry due to FlightClub API error'
      };

      await setCachedSimulation(missionId, {
        data: fallbackWithWarning,
        cachedAt: Date.now()
      }, 60);

      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
      return res.status(200).json(fallbackWithWarning);
    } catch (fallbackError) {
      console.error('[FlightClub] Fallback generation failed:', fallbackError);
      return res.status(500).json({
        error: 'Unable to fetch simulation data',
        missionId,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
  }); // End of withRateLimit wrapper
}

export { fetchSimulationFromFlightClub };
