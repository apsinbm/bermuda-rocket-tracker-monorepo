import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { colors, typography } from '../theme';

// Optional import - magnetometer may not be available in all environments
let Magnetometer: any = null;
try {
  const sensors = require('expo-sensors');
  Magnetometer = sensors.Magnetometer;
} catch (error) {
  console.log('[SkyMapView] Magnetometer not available - compass rotation disabled');
}

interface SkyPosition {
  azimuth: number;
  elevation: number;
  distance?: number;
  time?: number;
}

interface SkyMapViewProps {
  skyPosition?: SkyPosition;
  trajectoryPath?: SkyPosition[];
  bermudaLocation?: { latitude: number; longitude: number };
}

interface StarData {
  name: string;
  azimuth: number;
  elevation: number;
  magnitude: number;
  constellation: string;
}

interface CompassDirection {
  label: string;
  angle: number;
  shortLabel: string;
}

const SkyMapView: React.FC<SkyMapViewProps> = ({
  skyPosition,
  trajectoryPath = [],
  bermudaLocation = { latitude: 32.3078, longitude: -64.7505 }
}) => {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  // Initialize magnetometer for compass rotation
  useEffect(() => {
    let subscription: any;

    const startMagnetometer = async () => {
      // Check if Magnetometer is available
      if (!Magnetometer) {
        console.log('[SkyMapView] Magnetometer module not loaded - compass rotation disabled');
        return;
      }

      try {
        const available = await Magnetometer.isAvailableAsync();
        if (available) {
          Magnetometer.setUpdateInterval(100); // Update every 100ms
          subscription = Magnetometer.addListener(magnetometerData => {
            // Calculate heading from magnetometer data
            const { x, y } = magnetometerData;
            let heading = Math.atan2(y, x) * (180 / Math.PI);
            heading = (heading + 360) % 360; // Normalize to 0-360
            setDeviceHeading(heading);
          });
        }
      } catch (error) {
        console.log('[SkyMapView] Magnetometer error:', error);
      }
    };

    startMagnetometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  if (!skyPosition && trajectoryPath.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Sky position data not available</Text>
      </View>
    );
  }

  const { azimuth, elevation } = skyPosition || trajectoryPath[0] || { azimuth: 0, elevation: 0 };

  // Calculate real-time star positions with seasonal adjustments
  const getRealTimeStarPositions = (): StarData[] => {
    const now = new Date();
    const month = now.getMonth();
    const hour = now.getHours();

    // Base positions with seasonal adjustments (approximation)
    const baseStars: StarData[] = [
      { name: 'Polaris', azimuth: 0, elevation: 32.3, magnitude: 2.0, constellation: 'Ursa Minor' },
      { name: 'Vega', azimuth: (280 + month * 15) % 360, elevation: Math.max(20, 60 - (month * 3) % 40), magnitude: 0.0, constellation: 'Lyra' },
      { name: 'Altair', azimuth: (250 + month * 12) % 360, elevation: Math.max(20, 45 - (month * 2) % 30), magnitude: 0.8, constellation: 'Aquila' },
      { name: 'Deneb', azimuth: (320 + month * 10) % 360, elevation: Math.max(15, 75 - (month * 2) % 25), magnitude: 1.3, constellation: 'Cygnus' },
      { name: 'Arcturus', azimuth: (225 + month * 20) % 360, elevation: Math.max(10, 40 + (month * 3) % 35), magnitude: -0.1, constellation: 'Boötes' },
      { name: 'Sirius', azimuth: (180 + month * 25) % 360, elevation: Math.max(5, 25 - Math.abs(month - 6) * 3), magnitude: -1.5, constellation: 'Canis Major' },
      { name: 'Betelgeuse', azimuth: (210 + month * 18) % 360, elevation: Math.max(10, 35 - Math.abs(month - 12) * 2), magnitude: 0.5, constellation: 'Orion' },
      { name: 'Rigel', azimuth: (200 + month * 18) % 360, elevation: Math.max(8, 30 - Math.abs(month - 12) * 2), magnitude: 0.1, constellation: 'Orion' }
    ];

    // Adjust for time of night (rough rotation)
    const timeAdjustment = hour >= 12 ? (hour - 20) * 15 : (hour + 4) * 15;
    return baseStars.map(star => ({
      ...star,
      azimuth: (star.azimuth + timeAdjustment + 360) % 360,
      elevation: Math.max(5, star.elevation)
    }));
  };

  const referenceStars = getRealTimeStarPositions();

  // Get star color based on constellation
  const getStarColor = (constellation: string): string => {
    const colorMap: { [key: string]: string } = {
      'Ursa Minor': '#ffffcc', // Pale yellow
      'Lyra': '#aaccff', // Blue-white
      'Aquila': '#ffffff', // White
      'Cygnus': '#ffeeaa', // Yellow-white
      'Boötes': '#ffaa66', // Orange
      'Canis Major': '#aaddff', // Blue-white (Sirius)
      'Orion': '#ff9966', // Orange-red (Betelgeuse/Rigel)
    };
    return colorMap[constellation] || '#ffffff';
  };

  // All compass directions (8 directions)
  const compassDirections: CompassDirection[] = [
    { label: 'North', angle: 0, shortLabel: 'N' },
    { label: 'Northeast', angle: 45, shortLabel: 'NE' },
    { label: 'East', angle: 90, shortLabel: 'E' },
    { label: 'Southeast', angle: 135, shortLabel: 'SE' },
    { label: 'South', angle: 180, shortLabel: 'S' },
    { label: 'Southwest', angle: 225, shortLabel: 'SW' },
    { label: 'West', angle: 270, shortLabel: 'W' },
    { label: 'Northwest', angle: 315, shortLabel: 'NW' }
  ];

  // Convert azimuth to direction label
  const getDirection = (azimuth: number) => {
    const index = Math.round(azimuth / 45) % 8;
    return compassDirections[index].shortLabel;
  };

  // Calculate position on circular sky map
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 115;

  const skyToCartesian = (az: number, el: number) => {
    // Apply compass rotation if available
    const adjustedAz = deviceHeading !== null ? (az - deviceHeading + 360) % 360 : az;

    // Elevation: 0° = horizon (radius maxRadius), 90° = zenith (radius 0)
    const r = maxRadius * (1 - el / 90);

    // Azimuth: 0° = North (top), clockwise
    const angleRad = ((adjustedAz - 90) * Math.PI) / 180;
    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);

    return { x, y };
  };

  const rocketPos = skyToCartesian(azimuth, elevation);

  // Generate trajectory path
  const pathData = trajectoryPath.length > 0
    ? trajectoryPath
        .filter(p => p.elevation >= 0)
        .map((p, i) => {
          const pos = skyToCartesian(p.azimuth, p.elevation);
          return `${i === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`;
        })
        .join(' ')
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where to Look in the Sky</Text>
      {deviceHeading !== null && (
        <Text style={styles.compassStatus}>📱 Compass active - rotate device to align</Text>
      )}

      <View style={styles.mapContainer}>
        <Svg height="300" width="300">
          {/* Gradient sky background */}
          <Defs>
            <RadialGradient id="skyGradient" cx="50%" cy="50%">
              <Stop offset="0%" stopColor="#1a1a4a" stopOpacity="1" />
              <Stop offset="50%" stopColor="#0f0f35" stopOpacity="1" />
              <Stop offset="100%" stopColor="#05051a" stopOpacity="1" />
            </RadialGradient>
          </Defs>

          {/* Sky background circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={maxRadius}
            fill="url(#skyGradient)"
          />

          {/* Horizon circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={maxRadius}
            stroke="#4a5568"
            strokeWidth="2"
            fill="none"
          />

          {/* Elevation circles with labels */}
          {[
            { elevation: 30, radius: maxRadius * 0.67, label: '30°' },
            { elevation: 60, radius: maxRadius * 0.33, label: '60°' }
          ].map((ring, idx) => (
            <G key={`ring-${idx}`}>
              <Circle
                cx={centerX}
                cy={centerY}
                r={ring.radius}
                stroke="#2d3748"
                strokeWidth="1"
                fill="none"
              />
              {/* Labels at N, E, S, W positions */}
              {[0, 90, 180, 270].map((angle, labelIdx) => {
                const adjustedAngle = deviceHeading !== null ? (angle - deviceHeading + 360) % 360 : angle;
                const labelX = centerX + Math.cos((adjustedAngle - 90) * Math.PI / 180) * ring.radius;
                const labelY = centerY + Math.sin((adjustedAngle - 90) * Math.PI / 180) * ring.radius;

                return (
                  <G key={`label-${idx}-${labelIdx}`}>
                    {/* Background for label */}
                    <SvgText
                      x={labelX}
                      y={labelY}
                      fontSize="9"
                      fill="#e2e8f0"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {ring.label}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          ))}

          {/* Zenith label */}
          <SvgText
            x={centerX}
            y={centerY + 4}
            fontSize="10"
            fill="#cbd5e0"
            textAnchor="middle"
            fontWeight="bold"
          >
            ⬆ Zenith
          </SvgText>

          {/* All 8 compass directions */}
          {compassDirections.map((dir, idx) => {
            const adjustedAngle = deviceHeading !== null ? (dir.angle - deviceHeading + 360) % 360 : dir.angle;
            const x = centerX + Math.cos((adjustedAngle - 90) * Math.PI / 180) * (maxRadius + 25);
            const y = centerY + Math.sin((adjustedAngle - 90) * Math.PI / 180) * (maxRadius + 25);

            const isPrimary = ['N', 'E', 'S', 'W'].includes(dir.shortLabel);
            const circleRadius = isPrimary ? 12 : 9;

            return (
              <G key={`compass-${idx}`}>
                <Circle
                  cx={x}
                  cy={y}
                  r={circleRadius}
                  fill={isPrimary ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)'}
                  stroke={isPrimary ? '#2d3748' : '#4a5568'}
                  strokeWidth={isPrimary ? 2 : 1}
                />
                <SvgText
                  x={x}
                  y={y + (isPrimary ? 4 : 3)}
                  fontSize={isPrimary ? 11 : 8}
                  fill="#1a202c"
                  textAnchor="middle"
                  fontWeight={isPrimary ? 'bold' : 'normal'}
                >
                  {dir.shortLabel}
                </SvgText>
              </G>
            );
          })}

          {/* Reference stars with glow effects */}
          {referenceStars.map((star, idx) => {
            const starPos = skyToCartesian(star.azimuth, star.elevation);
            if (starPos.y < centerY - maxRadius || starPos.y > centerY + maxRadius) return null;

            const starSize = Math.max(2, 5 - star.magnitude);
            const starColor = getStarColor(star.constellation);

            return (
              <G key={`star-${idx}`}>
                {/* Glow effect for bright stars */}
                {star.magnitude < 1 && (
                  <Circle
                    cx={starPos.x}
                    cy={starPos.y}
                    r={starSize * 2.5}
                    fill={starColor}
                    opacity={0.3}
                  />
                )}
                {/* Star */}
                <Circle
                  cx={starPos.x}
                  cy={starPos.y}
                  r={starSize}
                  fill={starColor}
                  opacity={0.9}
                />
                {/* Star name for bright stars */}
                {star.magnitude < 1.5 && (
                  <SvgText
                    x={starPos.x}
                    y={starPos.y - starSize - 4}
                    fontSize="8"
                    fill="#f7fafc"
                    textAnchor="middle"
                  >
                    {star.name}
                  </SvgText>
                )}
              </G>
            );
          })}

          {/* Trajectory path */}
          {pathData && (
            <Path
              d={pathData}
              stroke={colors.primary}
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              opacity={0.7}
            />
          )}

          {/* Rocket position */}
          <G>
            {/* Glow around rocket */}
            <Circle
              cx={rocketPos.x}
              cy={rocketPos.y}
              r="12"
              fill={colors.primary}
              opacity={0.3}
            />
            {/* Rocket marker */}
            <Circle
              cx={rocketPos.x}
              cy={rocketPos.y}
              r="8"
              fill={colors.primary}
            />
            <SvgText
              x={rocketPos.x}
              y={rocketPos.y + 4}
              fontSize="12"
              fill="white"
              textAnchor="middle"
            >
              🚀
            </SvgText>
          </G>

          {/* Line from center to rocket */}
          <Line
            x1={centerX}
            y1={centerY}
            x2={rocketPos.x}
            y2={rocketPos.y}
            stroke={colors.primary}
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity={0.5}
          />
        </Svg>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Direction:</Text>
          <Text style={styles.infoValue}>
            {getDirection(azimuth)} ({Math.round(azimuth)}°)
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Elevation:</Text>
          <Text style={styles.infoValue}>{Math.round(elevation)}° above horizon</Text>
        </View>
        {deviceHeading !== null && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Device heading:</Text>
            <Text style={styles.infoValue}>{Math.round(deviceHeading)}°</Text>
          </View>
        )}
      </View>

      <Text style={styles.helpText}>
        💡 Look {getDirection(azimuth)} and tilt your view {Math.round(elevation)}° above the horizon
      </Text>
      <Text style={styles.helpText}>
        ⭐ Reference stars shown with seasonal positions for current date
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 18,
  },
  compassStatus: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
  mapContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    fontSize: 11,
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SkyMapView;
