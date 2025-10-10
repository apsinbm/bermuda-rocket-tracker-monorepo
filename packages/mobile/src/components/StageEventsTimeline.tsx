import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography } from '../theme';

interface StageEvent {
  name: string;
  time: number;
  type: 'maxq' | 'meco' | 'seco' | 'fairing' | 'other';
  altitude?: number;
  velocity?: number;
}

interface StageEventsTimelineProps {
  events?: StageEvent[];
}

const StageEventsTimeline: React.FC<StageEventsTimelineProps> = ({ events = [] }) => {
  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Stage events not available</Text>
      </View>
    );
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'maxq': return '#FF6B6B';
      case 'meco': return '#4ECDC4';
      case 'seco': return '#45B7D1';
      case 'fairing': return '#FFA07A';
      default: return colors.warning;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'maxq': return '💨';
      case 'meco': return '🔥';
      case 'seco': return '✨';
      case 'fairing': return '🛡️';
      default: return '⚡';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `T+${mins}m ${secs}s`;
    }
    return `T+${secs}s`;
  };

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => a.time - b.time);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mission Timeline</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.timelineContainer}>
          {/* Timeline line */}
          <View style={styles.timelineLine} />

          {/* Events */}
          {sortedEvents.map((event, index) => (
            <View key={index} style={styles.eventContainer}>
              {/* Connector dot */}
              <View
                style={[
                  styles.eventDot,
                  { backgroundColor: getEventColor(event.type) }
                ]}
              />

              {/* Event card */}
              <View
                style={[
                  styles.eventCard,
                  { borderLeftColor: getEventColor(event.type) }
                ]}
              >
                <View style={styles.eventHeader}>
                  <Text style={styles.eventIcon}>{getEventIcon(event.type)}</Text>
                  <Text style={styles.eventName}>{event.name}</Text>
                </View>

                <Text style={styles.eventTime}>{formatTime(event.time)}</Text>

                {event.altitude !== undefined && (
                  <Text style={styles.eventDetail}>
                    Altitude: {Math.round(event.altitude)} km
                  </Text>
                )}

                {event.velocity !== undefined && (
                  <Text style={styles.eventDetail}>
                    Velocity: {Math.round(event.velocity)} m/s
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Key Events:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>💨</Text>
            <Text style={styles.legendText}>Max-Q</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🔥</Text>
            <Text style={styles.legendText}>MECO</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>✨</Text>
            <Text style={styles.legendText}>SECO</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🛡️</Text>
            <Text style={styles.legendText}>Fairing</Text>
          </View>
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
    marginBottom: 16,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timelineContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 35,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.border,
  },
  eventContainer: {
    width: 200,
    marginRight: 20,
    alignItems: 'center',
  },
  eventDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.surface,
    zIndex: 2,
    marginBottom: 8,
  },
  eventCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  eventName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  eventTime: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  legend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 4,
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

export default StageEventsTimeline;
