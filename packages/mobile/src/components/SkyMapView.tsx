import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Path } from 'react-native-svg';
import { colors, typography } from '../theme';

interface SkyPosition {
  azimuth: number;
  elevation: number;
  distance?: number;
}

interface SkyMapViewProps {
  skyPosition?: SkyPosition;
}

const SkyMapView: React.FC<SkyMapViewProps> = ({ skyPosition }) => {
  if (!skyPosition) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Sky position data not available</Text>
      </View>
    );
  }

  const { azimuth, elevation } = skyPosition;

  // Convert azimuth to direction label
  const getDirection = (azimuth: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(azimuth / 45) % 8;
    return directions[index];
  };

  // Calculate rocket position on circular sky map
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;

  // Elevation: 0° = horizon (radius 120), 90° = zenith (radius 0)
  const radius = maxRadius * (1 - elevation / 90);

  // Azimuth: 0° = North (top), clockwise
  const angleRad = ((azimuth - 90) * Math.PI) / 180;
  const rocketX = centerX + radius * Math.cos(angleRad);
  const rocketY = centerY + radius * Math.sin(angleRad);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where to Look in the Sky</Text>

      <View style={styles.mapContainer}>
        <Svg height="300" width="300">
          {/* Horizon circles */}
          <Circle
            cx={centerX}
            cy={centerY}
            r="120"
            stroke={colors.border}
            strokeWidth="2"
            fill="none"
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r="80"
            stroke={colors.border}
            strokeWidth="1"
            strokeDasharray="4,4"
            fill="none"
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r="40"
            stroke={colors.border}
            strokeWidth="1"
            strokeDasharray="4,4"
            fill="none"
          />

          {/* Cardinal directions */}
          <Line
            x1={centerX}
            y1={centerY - 120}
            x2={centerX}
            y2={centerY - 135}
            stroke={colors.textSecondary}
            strokeWidth="2"
          />
          <SvgText
            x={centerX}
            y={centerY - 140}
            fontSize="14"
            fill={colors.textPrimary}
            textAnchor="middle"
            fontWeight="bold"
          >
            N
          </SvgText>

          <SvgText
            x={centerX + 140}
            y={centerY + 5}
            fontSize="14"
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            E
          </SvgText>

          <SvgText
            x={centerX}
            y={centerY + 150}
            fontSize="14"
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            S
          </SvgText>

          <SvgText
            x={centerX - 140}
            y={centerY + 5}
            fontSize="14"
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            W
          </SvgText>

          {/* Rocket position */}
          <Circle
            cx={rocketX}
            cy={rocketY}
            r="8"
            fill={colors.primary}
          />
          <SvgText
            x={rocketX}
            y={rocketY + 4}
            fontSize="12"
            fill="white"
            textAnchor="middle"
          >
            🚀
          </SvgText>

          {/* Line from center to rocket */}
          <Line
            x1={centerX}
            y1={centerY}
            x2={rocketX}
            y2={rocketY}
            stroke={colors.primary}
            strokeWidth="2"
            strokeDasharray="4,4"
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
      </View>

      <Text style={styles.helpText}>
        💡 Look {getDirection(azimuth)} and tilt your view {Math.round(elevation)}° above the horizon
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
    marginBottom: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  },
  infoValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SkyMapView;
