/**
 * Trajectory Visualization Component
 * Shows rocket trajectory visualization using core trajectory service
 */

import React, { useState, useEffect, useRef } from 'react';
import { LaunchWithVisibility, TrajectoryPoint } from '@bermuda/shared';
import { getTrajectoryData, TrajectoryData } from '@bermuda/shared';


interface TrajectoryVisualizationProps {
  launch: LaunchWithVisibility;
  width?: number;
  height?: number;
}

export default function TrajectoryVisualization({ 
  launch, 
  width = 800, 
  height = 600 
}: TrajectoryVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVisibilityOnly, setShowVisibilityOnly] = useState(false);

  // Load trajectory data
  useEffect(() => {
    const loadTrajectoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getTrajectoryData(launch);
        setTrajectoryData(data);
        
      } catch (error) {
        console.error('Failed to load trajectory data:', error);
        setError('Failed to load trajectory data');
      } finally {
        setLoading(false);
      }
    };

    loadTrajectoryData();
  }, [launch.id, launch]);

  // Draw trajectory on canvas
  useEffect(() => {
    if (!canvasRef.current || !trajectoryData || !trajectoryData.points) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#111827'; // gray-900
    ctx.fillRect(0, 0, width, height);

    // Calculate dynamic bounds based on trajectory direction
    const calculateDynamicBounds = () => {
      let minLat = 23.0;  // South Florida Keys (default)
      let maxLat = 37.0;  // North Carolina / Virginia border (default)
      let minLon = -82.0; // West Florida / Gulf Coast (default)
      let maxLon = -62.0; // East of Bermuda (default)
      
      if (trajectoryData.points && trajectoryData.points.length > 0) {
        // Determine trajectory direction from first few points
        const initialPoints = trajectoryData.points.slice(0, Math.min(10, trajectoryData.points.length));
        const startPoint = initialPoints[0];
        const endPoint = initialPoints[initialPoints.length - 1];
        
        if (startPoint && endPoint && startPoint.latitude && startPoint.longitude && endPoint.latitude && endPoint.longitude) {
          const deltaLat = endPoint.latitude - startPoint.latitude;
          const deltaLon = endPoint.longitude - startPoint.longitude;
          const angle = Math.atan2(deltaLat, deltaLon) * 180 / Math.PI;
          const normalizedAngle = (angle + 360) % 360;
          
          console.log(`[TrajectoryViz] Trajectory direction: ${normalizedAngle.toFixed(1)}°`);
          
          // Get actual trajectory bounds
          const trajLats = trajectoryData.points.map(p => p.latitude).filter(Boolean);
          const trajLons = trajectoryData.points.map(p => p.longitude).filter(Boolean);
          
          if (trajLats.length > 0 && trajLons.length > 0) {
            const trajMinLat = Math.min(...trajLats);
            const trajMaxLat = Math.max(...trajLats);
            const trajMinLon = Math.min(...trajLons);
            const trajMaxLon = Math.max(...trajLons);
            
            // Adjust bounds based on trajectory direction
            if (normalizedAngle >= 315 || normalizedAngle <= 45) {
              // North trajectory - extend north significantly
              maxLat = Math.max(45.0, trajMaxLat + 3); // Up to Maritime Canada
              console.log(`[TrajectoryViz] North trajectory detected, extending to ${maxLat}°N`);
            } else if (normalizedAngle >= 135 && normalizedAngle <= 225) {
              // South trajectory - extend south and east
              minLat = Math.min(18.0, trajMinLat - 2); // Down to Caribbean
              maxLon = Math.max(-55.0, trajMaxLon + 3); // Further east
              console.log(`[TrajectoryViz] South trajectory detected, extending to ${minLat}°N, ${maxLon}°W`);
            } else if (normalizedAngle >= 90 && normalizedAngle <= 180) {
              // Southeast trajectory - extend south and east more
              minLat = Math.min(20.0, trajMinLat - 2);
              maxLon = Math.max(-58.0, trajMaxLon + 2);
              console.log(`[TrajectoryViz] Southeast trajectory detected, extending to ${minLat}°N, ${maxLon}°W`);
            }
            
            // Always include launch pad and Bermuda with some padding
            minLat = Math.min(minLat, 25.0); // Ensure Florida Keys included
            maxLat = Math.max(maxLat, 45.0); // Extend to Maine for full East Coast coverage
            minLon = Math.min(minLon, -82.0); // Ensure Florida included
            maxLon = Math.max(maxLon, -62.0); // Ensure Bermuda included
          }
        }
      }
      
      return { minLat, maxLat, minLon, maxLon };
    };

    const { minLat, maxLat, minLon, maxLon } = calculateDynamicBounds();

    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;

    // Key coordinates
    const bermudaLat = 32.30;
    const bermudaLon = -64.78;
    const launchPadLat = 28.60; // Cape Canaveral approximate
    const launchPadLon = -80.60;

    // Convert lat/lon to canvas coordinates
    const latToY = (lat: number) => height - ((lat - minLat) / latRange) * height;
    const lonToX = (lon: number) => ((lon - minLon) / lonRange) * width;

    // Draw detailed coastlines and geographic features
    ctx.strokeStyle = '#6b7280'; // gray-500 for better visibility on dark
    ctx.lineWidth = 2;
    
    // Florida coastline (corrected to show proper east coast)
    ctx.beginPath();
    // West coast of Florida (Gulf side)
    ctx.moveTo(lonToX(-87.63), latToY(30.39)); // Florida-Alabama border
    ctx.lineTo(lonToX(-85.10), latToY(29.50)); // Apalachicola Bay
    ctx.lineTo(lonToX(-84.27), latToY(30.44)); // Tallahassee area
    ctx.lineTo(lonToX(-83.14), latToY(29.92)); // Cross City
    ctx.lineTo(lonToX(-82.76), latToY(28.95)); // Crystal River
    ctx.lineTo(lonToX(-82.79), latToY(27.76)); // Tampa Bay
    ctx.lineTo(lonToX(-82.55), latToY(27.34)); // Sarasota
    ctx.lineTo(lonToX(-81.87), latToY(26.64)); // Fort Myers
    ctx.lineTo(lonToX(-81.81), latToY(25.30)); // Naples
    ctx.lineTo(lonToX(-81.12), latToY(25.85)); // Everglades
    ctx.stroke();
    
    // Florida Keys
    ctx.beginPath();
    ctx.moveTo(lonToX(-81.12), latToY(25.85)); // Everglades
    ctx.lineTo(lonToX(-81.35), latToY(25.13)); // Key Largo
    ctx.lineTo(lonToX(-81.12), latToY(24.72)); // Islamorada  
    ctx.lineTo(lonToX(-80.92), latToY(24.56)); // Key West area
    ctx.stroke();
    
    // East coast of Florida (Atlantic side) - CORRECTED
    ctx.beginPath();
    ctx.moveTo(lonToX(-80.92), latToY(24.56)); // Key West area
    ctx.lineTo(lonToX(-80.28), latToY(25.52)); // South of Miami Beach
    ctx.lineTo(lonToX(-80.13), latToY(25.79)); // Miami Beach - EAST of Miami city
    ctx.lineTo(lonToX(-80.10), latToY(26.12)); // Fort Lauderdale
    ctx.lineTo(lonToX(-80.03), latToY(26.71)); // West Palm Beach coast
    ctx.lineTo(lonToX(-80.07), latToY(27.20)); // Jupiter
    ctx.lineTo(lonToX(-80.19), latToY(27.76)); // Stuart coast
    ctx.lineTo(lonToX(-80.41), latToY(28.41)); // Fort Pierce
    ctx.lineTo(lonToX(-80.48), latToY(28.61)); // Cape Canaveral - EAST coast
    ctx.lineTo(lonToX(-80.84), latToY(29.20)); // New Smyrna Beach
    ctx.lineTo(lonToX(-81.02), latToY(29.29)); // Daytona Beach
    ctx.lineTo(lonToX(-81.31), latToY(29.90)); // St. Augustine
    ctx.lineTo(lonToX(-81.43), latToY(30.42)); // Jacksonville Beach - EAST of Jacksonville
    ctx.stroke();
    
    // Georgia coastline
    ctx.beginPath();
    ctx.moveTo(lonToX(-81.43), latToY(30.42)); // Jacksonville Beach area
    ctx.lineTo(lonToX(-81.47), latToY(30.70)); // Fernandina Beach
    ctx.lineTo(lonToX(-81.49), latToY(31.13)); // St. Marys
    ctx.lineTo(lonToX(-81.39), latToY(31.15)); // Cumberland Island
    ctx.lineTo(lonToX(-81.29), latToY(31.59)); // Brunswick, GA
    ctx.lineTo(lonToX(-81.09), latToY(32.03)); // Savannah area coast
    ctx.stroke();
    
    // South Carolina coastline
    ctx.beginPath();
    ctx.moveTo(lonToX(-81.09), latToY(32.03)); // Savannah area coast
    ctx.lineTo(lonToX(-80.90), latToY(32.22)); // Hilton Head
    ctx.lineTo(lonToX(-79.93), latToY(32.78)); // Charleston
    ctx.lineTo(lonToX(-79.29), latToY(33.24)); // Myrtle Beach
    ctx.stroke();
    
    // North Carolina Outer Banks and Virginia
    ctx.beginPath();
    ctx.moveTo(lonToX(-79.29), latToY(33.24)); // Myrtle Beach area
    ctx.lineTo(lonToX(-77.79), latToY(33.92)); // Wilmington, NC
    ctx.lineTo(lonToX(-76.68), latToY(34.72)); // Cape Lookout
    ctx.lineTo(lonToX(-75.63), latToY(35.23)); // Cape Hatteras
    ctx.lineTo(lonToX(-75.97), latToY(36.85)); // Virginia Beach
    ctx.lineTo(lonToX(-76.02), latToY(37.25)); // Norfolk area
    ctx.lineTo(lonToX(-76.48), latToY(37.54)); // Hampton Roads
    ctx.stroke();
    
    // Maryland and Delaware
    ctx.beginPath();
    ctx.moveTo(lonToX(-76.48), latToY(37.54)); // Hampton Roads
    ctx.lineTo(lonToX(-76.34), latToY(38.29)); // Chesapeake Bay mouth
    ctx.lineTo(lonToX(-75.05), latToY(38.78)); // Ocean City, MD / Delaware Bay
    ctx.lineTo(lonToX(-75.09), latToY(39.76)); // Delaware coast
    ctx.stroke();
    
    // New Jersey
    ctx.beginPath();
    ctx.moveTo(lonToX(-75.09), latToY(39.76)); // Delaware coast
    ctx.lineTo(lonToX(-74.42), latToY(39.36)); // Atlantic City
    ctx.lineTo(lonToX(-74.01), latToY(40.13)); // Asbury Park
    ctx.lineTo(lonToX(-74.04), latToY(40.71)); // Sandy Hook
    ctx.stroke();
    
    // New York
    ctx.beginPath();
    ctx.moveTo(lonToX(-74.04), latToY(40.71)); // Sandy Hook
    ctx.lineTo(lonToX(-73.59), latToY(40.64)); // Coney Island / Brooklyn
    ctx.lineTo(lonToX(-72.40), latToY(40.96)); // Long Island
    ctx.lineTo(lonToX(-71.86), latToY(41.18)); // Montauk Point
    ctx.stroke();
    
    // Connecticut and Rhode Island
    ctx.beginPath();
    ctx.moveTo(lonToX(-71.86), latToY(41.18)); // Montauk Point
    ctx.lineTo(lonToX(-72.35), latToY(41.31)); // New London, CT
    ctx.lineTo(lonToX(-71.40), latToY(41.49)); // Newport, RI
    ctx.lineTo(lonToX(-71.14), latToY(41.80)); // Point Judith, RI
    ctx.stroke();
    
    // Massachusetts
    ctx.beginPath();
    ctx.moveTo(lonToX(-71.14), latToY(41.80)); // Point Judith, RI
    ctx.lineTo(lonToX(-70.61), latToY(41.68)); // Cape Cod
    ctx.lineTo(lonToX(-70.05), latToY(42.04)); // Provincetown
    ctx.lineTo(lonToX(-70.67), latToY(42.34)); // Boston area
    ctx.lineTo(lonToX(-70.82), latToY(42.97)); // Newburyport
    ctx.stroke();
    
    // New Hampshire and Maine
    ctx.beginPath();
    ctx.moveTo(lonToX(-70.82), latToY(42.97)); // Newburyport
    ctx.lineTo(lonToX(-70.74), latToY(43.08)); // Portsmouth, NH
    ctx.lineTo(lonToX(-70.25), latToY(43.66)); // Portland, ME
    ctx.lineTo(lonToX(-69.77), latToY(44.41)); // Bar Harbor, ME
    ctx.lineTo(lonToX(-67.60), latToY(44.81)); // Machias, ME
    ctx.lineTo(lonToX(-67.07), latToY(45.13)); // Eastport, ME (US-Canada border)
    ctx.stroke();
    
    // Bahamas (simplified)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#9ca3af'; // lighter gray for international waters
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lonToX(-79.27), latToY(26.53)); // Nassau area
    ctx.lineTo(lonToX(-77.35), latToY(25.08)); // Eleuthera
    ctx.lineTo(lonToX(-76.84), latToY(24.70)); // Cat Island
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add geographic labels
    ctx.fillStyle = '#d1d5db';
    ctx.font = '11px sans-serif';
    ctx.fillText('Florida', lonToX(-82.5), latToY(27.8));
    ctx.fillText('Georgia', lonToX(-81.6), latToY(31.5));
    ctx.fillText('S. Carolina', lonToX(-80.2), latToY(32.5));
    ctx.fillText('N. Carolina', lonToX(-77.5), latToY(34.5));
    ctx.fillText('Virginia', lonToX(-76.5), latToY(37.2));
    ctx.fillText('Maryland', lonToX(-75.5), latToY(38.5));
    ctx.fillText('New Jersey', lonToX(-74.2), latToY(39.8));
    ctx.fillText('New York', lonToX(-73.0), latToY(40.8));
    ctx.fillText('Connecticut', lonToX(-72.2), latToY(41.3));
    ctx.fillText('Massachusetts', lonToX(-70.8), latToY(42.2));
    ctx.fillText('Maine', lonToX(-69.2), latToY(44.8));
    ctx.fillText('Bahamas', lonToX(-77.8), latToY(25.5));
    
    // Mark major cities
    ctx.fillStyle = '#fbbf24'; // amber-400 for cities
    ctx.beginPath();
    ctx.arc(lonToX(-80.19), latToY(25.76), 3, 0, 2 * Math.PI); // Miami
    ctx.fill();
    ctx.fillStyle = '#d1d5db';
    ctx.font = '9px sans-serif';
    ctx.fillText('Miami', lonToX(-80.19) + 5, latToY(25.76) - 5);
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(lonToX(-81.38), latToY(30.34), 3, 0, 2 * Math.PI); // Jacksonville
    ctx.fill();
    ctx.fillStyle = '#d1d5db';
    ctx.fillText('Jacksonville', lonToX(-81.38) + 5, latToY(30.34) - 5);
    
    // Add more major cities along the extended coastline
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(lonToX(-76.29), latToY(36.85), 3, 0, 2 * Math.PI); // Virginia Beach
    ctx.fill();
    ctx.fillStyle = '#d1d5db';
    ctx.fillText('Virginia Beach', lonToX(-76.29) + 5, latToY(36.85) - 5);
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(lonToX(-74.01), latToY(40.71), 3, 0, 2 * Math.PI); // New York City
    ctx.fill();
    ctx.fillStyle = '#d1d5db';
    ctx.fillText('NYC', lonToX(-74.01) + 5, latToY(40.71) - 5);
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(lonToX(-71.06), latToY(42.36), 3, 0, 2 * Math.PI); // Boston
    ctx.fill();
    ctx.fillStyle = '#d1d5db';
    ctx.fillText('Boston', lonToX(-71.06) + 5, latToY(42.36) - 5);

    // Draw launch pad (purple to distinguish from visibility indicators)
    ctx.fillStyle = '#a855f7'; // purple-500
    ctx.beginPath();
    ctx.arc(lonToX(launchPadLon), latToY(launchPadLat), 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add purple border for better visibility
    ctx.strokeStyle = '#9333ea'; // purple-600
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#f3f4f6'; // gray-100 for better text visibility on dark
    ctx.font = '12px sans-serif';
    ctx.fillText('Launch Pad', lonToX(launchPadLon) + 12, latToY(launchPadLat) - 12);

    // Draw Bermuda (cyan to distinguish from visibility indicators)  
    ctx.fillStyle = '#06b6d4'; // cyan-500
    ctx.beginPath();
    ctx.arc(lonToX(bermudaLon), latToY(bermudaLat), 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add cyan border for better visibility
    ctx.strokeStyle = '#0891b2'; // cyan-600
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#f3f4f6'; // gray-100 for better text visibility on dark
    ctx.fillText('Bermuda', lonToX(bermudaLon) + 12, latToY(bermudaLat) - 12);

    // Draw trajectory if available
    if (trajectoryData.points && trajectoryData.points.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();

      trajectoryData.points.forEach((point: TrajectoryPoint, index: number) => {
        if (point.latitude && point.longitude) {
          const x = lonToX(point.longitude);
          const y = latToY(point.latitude);

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      });

      ctx.stroke();

      // Draw visibility indicators along trajectory (more frequent and visible)
      trajectoryData.points.forEach((point: TrajectoryPoint, index: number) => {
        if (point.latitude && point.longitude && index % 3 === 0) { // Show every 3rd point instead of every 10th
          // Skip non-visible points if showVisibilityOnly is enabled
          if (showVisibilityOnly && !point.visible) {
            return;
          }
          
          const x = lonToX(point.longitude);
          const y = latToY(point.latitude);
          
          // Color based on visibility from Bermuda
          let color = point.visible ? '#22c55e' : '#ef4444'; // Green for visible, red for not visible
          let strokeColor = '#ffffff';
          let radius = 4;
          
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Add contrasting border for better visibility
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }

    // Draw grid
    ctx.strokeStyle = '#374151'; // gray-700 for subtle grid lines on dark
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Latitude lines
    for (let lat = Math.ceil(minLat); lat <= Math.floor(maxLat); lat++) {
      const y = latToY(lat);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      ctx.fillStyle = '#d1d5db'; // gray-300 for better text visibility on dark
      ctx.font = '10px sans-serif';
      ctx.fillText(`${lat}°N`, 5, y - 2);
    }
    
    // Longitude lines
    for (let lon = Math.ceil(minLon); lon <= Math.floor(maxLon); lon++) {
      const x = lonToX(lon);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      ctx.fillStyle = '#d1d5db'; // gray-300 for better text visibility on dark
      ctx.fillText(`${Math.abs(lon)}°W`, x + 2, height - 5);
    }
    
    ctx.setLineDash([]);

  }, [trajectoryData, width, height, launch, showVisibilityOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading trajectory data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-white p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white">
          Trajectory Visualization
        </h3>
        <p className="text-sm text-gray-300 mt-1">
          Launch trajectory from {launch.pad.name} - Visibility from Bermuda: {launch.visibility.likelihood}
        </p>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border border-gray-600 rounded-lg bg-gray-900"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {/* Interactive Controls */}
        <div className="absolute top-4 left-4 bg-gray-700 rounded-lg p-3 border border-gray-600">
          <label className="flex items-center space-x-2 text-xs text-gray-300" title="Hide trajectory points that are not visible from Bermuda">
            <input
              type="checkbox"
              checked={showVisibilityOnly}
              onChange={(e) => setShowVisibilityOnly(e.target.checked)}
              className="rounded"
            />
            <span>Show visible segments only</span>
          </label>
        </div>
        
        {/* Enhanced Legend with Stage Information */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 rounded-full mr-2 border-2 border-purple-600"></div>
              <span>Launch Pad</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-cyan-500 rounded-full mr-2 border-2 border-cyan-600"></div>
              <span>Bermuda</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-1 bg-blue-600 mr-2"></div>
              <span>Trajectory Path</span>
            </div>
          </div>
          
          <div className="border-t border-gray-600 pt-2">
            <div className="text-xs font-semibold text-gray-400 mb-2">VISIBILITY FROM BERMUDA:</div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-300">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Visible Above Horizon</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Below Horizon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced trajectory info */}
      {trajectoryData && (
        <div className="mt-6 bg-gray-700 rounded-lg p-4 text-sm border border-gray-600">
          <h4 className="font-semibold text-white mb-3 text-base">Trajectory Analysis</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-300">Look Direction from Bermuda:</span>
              <span className="ml-1 font-medium text-white">{launch.visibility.bearing}° (WSW)</span>
            </div>
            <div>
              <span className="text-gray-300">Rocket Flight Path:</span>
              <span className="ml-1 font-medium text-white">{launch.visibility.trajectoryDirection}</span>
            </div>
            <div>
              <span className="text-gray-300">Visibility Window:</span>
              <span className="ml-1 font-medium text-white">{launch.visibility.estimatedTimeVisible}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-300">Assessment:</span>
              <span className="ml-1 font-medium text-white">{launch.visibility.reason}</span>
            </div>
          </div>
          
          {/* Additional trajectory data if available */}
          {trajectoryData.source && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Data Source:</span>
                <span className="font-medium text-white capitalize">
                  {trajectoryData.source === 'none' ? 'Simulated' : trajectoryData.source}
                  {trajectoryData.realTelemetry && (
                    <span className="ml-1 text-xs bg-green-600 px-2 py-1 rounded text-white">
                      Real Telemetry
                    </span>
                  )}
                  {trajectoryData.source === 'none' && (
                    <span className="ml-1 text-xs bg-orange-600 px-2 py-1 rounded text-white">
                      Generated
                    </span>
                  )}
                </span>
              </div>
              {trajectoryData.confidence && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-300">Confidence:</span>
                  <span className={`font-medium capitalize ${
                    trajectoryData.confidence === 'confirmed' ? 'text-green-400' :
                    trajectoryData.confidence === 'projected' ? 'text-yellow-400' : 'text-orange-400'
                  }`}>
                    {trajectoryData.confidence}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}