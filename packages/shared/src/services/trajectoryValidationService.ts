/**
 * Trajectory Validation Service
 *
 * Validates that trajectory data is accurate and matches the launch site.
 * Prevents displaying incorrect or fabricated trajectory data.
 */

interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

interface LaunchSite {
  latitude: number;
  longitude: number;
}

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  distanceKm?: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validates that trajectory data matches the launch site location.
 *
 * The first trajectory point should be very close to the launch site.
 * We allow a tolerance of 50km to account for data resolution and
 * the fact that the trajectory might start slightly after liftoff.
 *
 * @param trajectoryPoints Array of trajectory coordinates
 * @param launchSite Launch site coordinates
 * @param toleranceKm Maximum allowed distance in km (default: 50)
 * @returns Validation result with status and reason
 */
export function validateTrajectoryMatchesLaunchSite(
  trajectoryPoints: TrajectoryPoint[],
  launchSite: LaunchSite,
  toleranceKm: number = 50
): ValidationResult {
  // Must have trajectory data
  if (!trajectoryPoints || trajectoryPoints.length === 0) {
    return {
      isValid: false,
      reason: 'No trajectory data available'
    };
  }

  // Must have launch site coordinates
  if (!launchSite || launchSite.latitude === undefined || launchSite.longitude === undefined) {
    return {
      isValid: false,
      reason: 'No launch site coordinates available'
    };
  }

  // Get first trajectory point (should be near launch site)
  const firstPoint = trajectoryPoints[0];

  if (!firstPoint || firstPoint.latitude === undefined || firstPoint.longitude === undefined) {
    return {
      isValid: false,
      reason: 'Invalid trajectory point data'
    };
  }

  // Calculate distance between first trajectory point and launch site
  const distanceKm = calculateDistance(
    launchSite.latitude,
    launchSite.longitude,
    firstPoint.latitude,
    firstPoint.longitude
  );

  // Check if distance is within tolerance
  if (distanceKm > toleranceKm) {
    return {
      isValid: false,
      reason: `Trajectory starts ${distanceKm.toFixed(0)}km from launch site (tolerance: ${toleranceKm}km)`,
      distanceKm
    };
  }

  return {
    isValid: true,
    distanceKm
  };
}

/**
 * Validates that trajectory data has necessary FlightClub metadata
 */
export function validateFlightClubDataSource(
  simulationData: any
): ValidationResult {
  if (!simulationData) {
    return {
      isValid: false,
      reason: 'No simulation data available'
    };
  }

  // Check if data source is explicitly marked as FlightClub
  if (simulationData.source && simulationData.source !== 'flightclub') {
    return {
      isValid: false,
      reason: `Data source is ${simulationData.source}, not FlightClub`
    };
  }

  // Check if we have enhanced telemetry (FlightClub data)
  if (!simulationData.enhancedTelemetry || simulationData.enhancedTelemetry.length === 0) {
    return {
      isValid: false,
      reason: 'No FlightClub telemetry data available'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Comprehensive validation of trajectory data.
 * Ensures data is from FlightClub and matches launch site.
 */
export function validateTrajectoryData(
  simulationData: any,
  launchSite: LaunchSite | undefined,
  toleranceKm: number = 50
): ValidationResult {
  // First, validate data source
  const sourceValidation = validateFlightClubDataSource(simulationData);
  if (!sourceValidation.isValid) {
    return sourceValidation;
  }

  // If no launch site provided, we can't validate trajectory match
  if (!launchSite) {
    console.warn('[TrajectoryValidation] No launch site provided, skipping location validation');
    return {
      isValid: true // Allow it if source is valid, even without location validation
    };
  }

  // Extract trajectory points from simulation data
  const trajectoryPoints = simulationData.enhancedTelemetry.map((frame: any) => ({
    latitude: frame.latitude,
    longitude: frame.longitude,
    altitude: frame.altitude
  }));

  // Validate trajectory matches launch site
  const locationValidation = validateTrajectoryMatchesLaunchSite(
    trajectoryPoints,
    launchSite,
    toleranceKm
  );

  if (!locationValidation.isValid) {
    console.warn('[TrajectoryValidation]', locationValidation.reason);
  }

  return locationValidation;
}
