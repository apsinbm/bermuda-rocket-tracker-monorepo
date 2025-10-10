import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Svg, { Line, Path, Text as SvgText, Circle, Rect, G } from 'react-native-svg';
import { colors, typography } from '../theme';

interface TrajectoryPoint {
  time: number;
  altitude: number;
  velocity: number;
  downrange: number;
  latitude?: number;
  longitude?: number;
  elevationAngle?: number;
  distanceFromBermuda?: number;
  aboveHorizon?: boolean;
}

interface StageEvent {
  name: string;
  time: number;
  type: 'maxq' | 'meco' | 'seco' | 'fairing' | 'other';
}

interface TelemetryGraphsProps {
  trajectoryPoints?: TrajectoryPoint[];
  stageEvents?: StageEvent[];
  bermudaLocation?: { latitude: number; longitude: number };
  playbackTime?: number;
  onTimeSelect?: (time: number) => void;
}

interface GraphDataset {
  name: string;
  data: { x: number; y: number }[];
  color: string;
  unit: string;
  yAxisLabel: string;
}

const TelemetryGraphs: React.FC<TelemetryGraphsProps> = ({
  trajectoryPoints,
  stageEvents = [],
  bermudaLocation = { latitude: 32.3078, longitude: -64.7505 },
  playbackTime = 0,
  onTimeSelect
}) => {
  const [hoveredGraph, setHoveredGraph] = useState<string | null>(null);

  // Calculate distance from Bermuda for each point
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Process telemetry data into graph datasets
  const datasets = useMemo(() => {
    if (!trajectoryPoints || trajectoryPoints.length === 0) return null;

    const altitudeData = trajectoryPoints.map(p => ({
      x: p.time,
      y: p.altitude
    }));

    const velocityData = trajectoryPoints.map(p => ({
      x: p.time,
      y: p.velocity / 1000 // Convert to km/s
    }));

    const distanceData = trajectoryPoints.map(p => {
      if (p.distanceFromBermuda !== undefined) {
        return { x: p.time, y: p.distanceFromBermuda };
      }
      if (p.latitude !== undefined && p.longitude !== undefined) {
        return {
          x: p.time,
          y: calculateDistance(bermudaLocation.latitude, bermudaLocation.longitude, p.latitude, p.longitude)
        };
      }
      return { x: p.time, y: p.downrange };
    });

    const elevationData = trajectoryPoints
      .filter(p => p.elevationAngle !== undefined && (p.aboveHorizon || p.elevationAngle > 0))
      .map(p => ({
        x: p.time,
        y: p.elevationAngle!
      }));

    return {
      altitude: {
        name: 'Altitude',
        data: altitudeData,
        color: '#00ff88',
        unit: 'km',
        yAxisLabel: 'Altitude (km)'
      },
      velocity: {
        name: 'Velocity',
        data: velocityData,
        color: '#ff6b6b',
        unit: 'km/s',
        yAxisLabel: 'Speed (km/s)'
      },
      distance: {
        name: 'Distance from Bermuda',
        data: distanceData,
        color: '#4a90e2',
        unit: 'km',
        yAxisLabel: 'Distance (km)'
      },
      elevation: {
        name: 'Elevation Angle',
        data: elevationData,
        color: '#ffd700',
        unit: '°',
        yAxisLabel: 'Elevation (degrees)'
      }
    };
  }, [trajectoryPoints, bermudaLocation]);

  if (!trajectoryPoints || trajectoryPoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Telemetry data not available</Text>
      </View>
    );
  }

  if (!datasets) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Unable to process telemetry data</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;
  const chartHeight = 250;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Telemetry Graphs</Text>
      <Text style={styles.subtitle}>Launch to Orbit Tracking</Text>
      <Text style={styles.description}>Tap any graph to jump to that time</Text>

      {/* Altitude Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{datasets.altitude.name}</Text>
        <Graph
          dataset={datasets.altitude}
          stageEvents={stageEvents}
          playbackTime={playbackTime}
          width={chartWidth}
          height={chartHeight}
          onTimeSelect={onTimeSelect}
          graphId="altitude"
        />
        <Text style={styles.chartInfo}>
          Maximum: {Math.max(...datasets.altitude.data.map(d => d.y)).toFixed(1)} km
        </Text>
      </View>

      {/* Velocity Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{datasets.velocity.name}</Text>
        <Graph
          dataset={datasets.velocity}
          stageEvents={stageEvents}
          playbackTime={playbackTime}
          width={chartWidth}
          height={chartHeight}
          onTimeSelect={onTimeSelect}
          graphId="velocity"
        />
        <Text style={styles.chartInfo}>
          Maximum: {Math.max(...datasets.velocity.data.map(d => d.y)).toFixed(2)} km/s
        </Text>
      </View>

      {/* Distance Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{datasets.distance.name}</Text>
        <Graph
          dataset={datasets.distance}
          stageEvents={stageEvents}
          playbackTime={playbackTime}
          width={chartWidth}
          height={chartHeight}
          onTimeSelect={onTimeSelect}
          graphId="distance"
        />
        <Text style={styles.chartInfo}>
          Closest approach: {Math.min(...datasets.distance.data.map(d => d.y)).toFixed(1)} km
        </Text>
      </View>

      {/* Elevation Chart */}
      {datasets.elevation.data.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{datasets.elevation.name}</Text>
          <Graph
            dataset={datasets.elevation}
            stageEvents={stageEvents}
            playbackTime={playbackTime}
            width={chartWidth}
            height={chartHeight}
            onTimeSelect={onTimeSelect}
            graphId="elevation"
          />
          <Text style={styles.chartInfo}>
            Peak elevation: {Math.max(...datasets.elevation.data.map(d => d.y)).toFixed(1)}°
          </Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Current Time</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDashedLine, { borderColor: '#ffd700' }]} />
          <Text style={styles.legendText}>Stage Events</Text>
        </View>
        {datasets.elevation.data.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendArea, { backgroundColor: '#00ff88' }]} />
            <Text style={styles.legendText}>Visible</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

interface GraphProps {
  dataset: GraphDataset;
  stageEvents: StageEvent[];
  playbackTime: number;
  width: number;
  height: number;
  onTimeSelect?: (time: number) => void;
  graphId: string;
}

const Graph: React.FC<GraphProps> = ({
  dataset,
  stageEvents,
  playbackTime,
  width,
  height,
  onTimeSelect,
  graphId
}) => {
  const padding = { top: 30, right: 40, bottom: 50, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calculate data ranges
  const maxTime = Math.max(...dataset.data.map(d => d.x));
  const minTime = Math.min(...dataset.data.map(d => d.x));
  const maxValue = Math.max(...dataset.data.map(d => d.y));
  const minValue = Math.min(...dataset.data.map(d => d.y), 0);
  const valueRange = maxValue - minValue || 1; // Prevent division by zero

  // Helper functions
  const timeToX = (time: number) => padding.left + ((time - minTime) / (maxTime - minTime)) * graphWidth;
  const valueToY = (value: number) => padding.top + graphHeight - ((value - minValue) / valueRange) * graphHeight;

  // Generate path for the data line
  const linePath = useMemo(() => {
    if (dataset.data.length === 0) return '';

    const pathCommands = dataset.data.map((point, index) => {
      const x = timeToX(point.x);
      const y = valueToY(point.y);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    });

    return pathCommands.join(' ');
  }, [dataset.data, maxTime, minTime, maxValue, minValue]);

  // Generate visibility area path for elevation graph
  const visibilityPath = useMemo(() => {
    if (graphId !== 'elevation' || dataset.data.length === 0) return '';

    const paths: string[] = [];
    let currentPath: string[] = [];

    dataset.data.forEach((point, index) => {
      const x = timeToX(point.x);
      const y = valueToY(point.y);
      const bottomY = padding.top + graphHeight;

      if (point.y > 0) {
        if (currentPath.length === 0) {
          // Start new visibility zone
          currentPath.push(`M ${x} ${bottomY}`);
          currentPath.push(`L ${x} ${y}`);
        } else {
          currentPath.push(`L ${x} ${y}`);
        }

        // Close path at end of data or before non-visible point
        if (index === dataset.data.length - 1 || dataset.data[index + 1].y <= 0) {
          currentPath.push(`L ${x} ${bottomY}`);
          currentPath.push('Z');
          paths.push(currentPath.join(' '));
          currentPath = [];
        }
      }
    });

    return paths.join(' ');
  }, [dataset.data, graphId, maxTime, minTime, maxValue, minValue]);

  // Filter stage events to show only Max-Q, MECO, SECO
  const displayedEvents = stageEvents.filter(event => {
    const eventLower = event.name.toLowerCase();
    return eventLower.includes('max-q') ||
           eventLower.includes('meco') ||
           eventLower.includes('seco');
  });

  // Handle touch on graph
  const handlePress = (event: any) => {
    if (!onTimeSelect) return;

    const { locationX } = event.nativeEvent;

    if (locationX >= padding.left && locationX <= width - padding.right) {
      const relativeX = locationX - padding.left;
      const time = minTime + (relativeX / graphWidth) * (maxTime - minTime);
      onTimeSelect(Math.max(0, Math.min(time, maxTime)));
    }
  };

  const getEventColor = (eventName: string) => {
    const eventLower = eventName.toLowerCase();
    if (eventLower.includes('seco')) return '#ff6b6b';
    if (eventLower.includes('meco')) return '#ff9f40';
    return '#ffd700'; // Max-Q
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View>
        <Svg width={width} height={height}>
          {/* Background */}
          <Rect x={0} y={0} width={width} height={height} fill={colors.surface} />

          {/* Axes */}
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke={colors.border}
            strokeWidth={2}
          />
          <Line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke={colors.border}
            strokeWidth={2}
          />

          {/* Y-axis ticks and labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const value = minValue + (valueRange * (i / 4));
            const y = valueToY(value);
            const formattedValue = value < 1000 ? value.toFixed(1) : (value / 1000).toFixed(1) + 'k';

            return (
              <G key={`y-tick-${i}`}>
                <SvgText
                  x={padding.left - 10}
                  y={y + 4}
                  fill={colors.textSecondary}
                  fontSize={10}
                  textAnchor="end"
                >
                  {formattedValue}
                </SvgText>
              </G>
            );
          })}

          {/* X-axis ticks and labels */}
          {[0, 1, 2, 3, 4, 5].map(i => {
            const time = minTime + ((maxTime - minTime) * (i / 5));
            const x = timeToX(time);

            return (
              <G key={`x-tick-${i}`}>
                <SvgText
                  x={x}
                  y={height - padding.bottom + 20}
                  fill={colors.textSecondary}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {Math.round(time)}
                </SvgText>
              </G>
            );
          })}

          {/* Axis labels */}
          <SvgText
            x={width / 2}
            y={height - 10}
            fill={colors.textPrimary}
            fontSize={12}
            textAnchor="middle"
          >
            Time (T+ seconds)
          </SvgText>

          {/* Visibility area (elevation graph only) */}
          {visibilityPath && (
            <Path
              d={visibilityPath}
              fill="#00ff88"
              fillOpacity={0.2}
            />
          )}

          {/* Data line */}
          <Path
            d={linePath}
            stroke={dataset.color}
            strokeWidth={2}
            fill="none"
          />

          {/* Stage event markers */}
          {displayedEvents.map((event, idx) => {
            const x = timeToX(event.time);
            if (x < padding.left || x > width - padding.right) return null;

            const eventColor = getEventColor(event.name);

            return (
              <G key={`event-${idx}`}>
                <Line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={eventColor}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
                <Rect
                  x={x - 22}
                  y={padding.top + 5}
                  width={44}
                  height={16}
                  fill={colors.surface}
                  stroke={eventColor}
                  strokeWidth={1.5}
                  rx={2}
                />
                <SvgText
                  x={x}
                  y={padding.top + 16}
                  fill={eventColor}
                  fontSize={10}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {event.name}
                </SvgText>
              </G>
            );
          })}

          {/* Playback time indicator */}
          {playbackTime > 0 && (() => {
            const x = timeToX(playbackTime);
            if (x < padding.left || x > width - padding.right) return null;

            const currentPoint = dataset.data.find(p => Math.abs(p.x - playbackTime) < 5) ||
                                dataset.data[Math.floor(playbackTime / 10)] ||
                                dataset.data[0];

            if (!currentPoint) return null;

            const y = valueToY(currentPoint.y);
            const label = `${currentPoint.y.toFixed(1)} ${dataset.unit}`;

            return (
              <G>
                <Line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={colors.error}
                  strokeWidth={3}
                />
                <Circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill={colors.error}
                />
                <Rect
                  x={x + 10}
                  y={y - 20}
                  width={60}
                  height={20}
                  fill={colors.surface}
                  stroke={colors.error}
                  strokeWidth={2}
                  rx={2}
                />
                <SvgText
                  x={x + 40}
                  y={y - 8}
                  fill={colors.textPrimary}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </G>
            );
          })()}
        </Svg>
      </View>
    </TouchableWithoutFeedback>
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
    marginBottom: 4,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 20,
  },
  subtitle: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 12,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  chartInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 11,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendDashedLine: {
    width: 16,
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  legendArea: {
    width: 16,
    height: 12,
    opacity: 0.3,
    borderRadius: 2,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TelemetryGraphs;
