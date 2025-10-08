import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { colors, typography } from '../theme';

interface TrajectoryPoint {
  time: number;
  altitude: number;
  downrange: number;
}

interface TrajectoryChartProps {
  trajectoryPoints?: TrajectoryPoint[];
}

const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ trajectoryPoints }) => {
  if (!trajectoryPoints || trajectoryPoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Trajectory visualization not available</Text>
      </View>
    );
  }

  // Chart dimensions
  const width = 320;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find max values for scaling
  const maxDownrange = Math.max(...trajectoryPoints.map(p => p.downrange));
  const maxAltitude = Math.max(...trajectoryPoints.map(p => p.altitude));

  // Scale functions
  const scaleX = (downrange: number) => padding + (downrange / maxDownrange) * chartWidth;
  const scaleY = (altitude: number) => height - padding - (altitude / maxAltitude) * chartHeight;

  // Generate path for trajectory
  const pathData = trajectoryPoints.map((point, index) => {
    const x = scaleX(point.downrange);
    const y = scaleY(point.altitude);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Sample every 10th point for performance
  const samplePoints = trajectoryPoints.filter((_, i) => i % 10 === 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rocket Trajectory</Text>

      <Svg height={height} width={width}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <Line
            key={`h-${i}`}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={width - padding}
            y2={padding + chartHeight * ratio}
            stroke={colors.border}
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity={0.3}
          />
        ))}

        {/* Ground line */}
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={colors.textSecondary}
          strokeWidth="2"
        />

        {/* Trajectory path */}
        <Path
          d={pathData}
          stroke={colors.primary}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Launch point */}
        <Circle
          cx={scaleX(0)}
          cy={scaleY(0)}
          r="5"
          fill={colors.success}
        />

        {/* Landing/final point */}
        {trajectoryPoints.length > 0 && (
          <Circle
            cx={scaleX(trajectoryPoints[trajectoryPoints.length - 1].downrange)}
            cy={scaleY(trajectoryPoints[trajectoryPoints.length - 1].altitude)}
            r="5"
            fill={colors.warning}
          />
        )}

        {/* Axis labels */}
        <SvgText
          x={width / 2}
          y={height - 10}
          fontSize="12"
          fill={colors.textSecondary}
          textAnchor="middle"
        >
          Distance (km)
        </SvgText>

        <SvgText
          x={15}
          y={height / 2}
          fontSize="12"
          fill={colors.textSecondary}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          Altitude (km)
        </SvgText>

        {/* Max altitude marker */}
        <SvgText
          x={padding - 35}
          y={padding + 5}
          fontSize="10"
          fill={colors.textSecondary}
        >
          {Math.round(maxAltitude)} km
        </SvgText>

        {/* Max downrange marker */}
        <SvgText
          x={width - padding - 20}
          y={height - padding + 20}
          fontSize="10"
          fill={colors.textSecondary}
        >
          {Math.round(maxDownrange)} km
        </SvgText>
      </Svg>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Launch</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Final Position</Text>
        </View>
      </View>
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TrajectoryChart;
