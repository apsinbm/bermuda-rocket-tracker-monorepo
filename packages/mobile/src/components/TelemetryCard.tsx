import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

interface TelemetryData {
  maxAltitude?: number;
  maxVelocity?: number;
  maxDownrange?: number;
}

interface TelemetryCardProps {
  telemetry?: TelemetryData;
}

const TelemetryCard: React.FC<TelemetryCardProps> = ({ telemetry }) => {
  if (!telemetry) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Trajectory data not available</Text>
      </View>
    );
  }

  const formatNumber = (num: number | undefined, unit: string) => {
    if (num === undefined) return 'N/A';
    return `${num.toLocaleString()} ${unit}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flight Trajectory Data</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🚀</Text>
          <Text style={styles.statValue}>
            {formatNumber(telemetry.maxAltitude, 'km')}
          </Text>
          <Text style={styles.statLabel}>Max Altitude</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statValue}>
            {formatNumber(telemetry.maxVelocity, 'm/s')}
          </Text>
          <Text style={styles.statLabel}>Max Velocity</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📏</Text>
          <Text style={styles.statValue}>
            {formatNumber(telemetry.maxDownrange, 'km')}
          </Text>
          <Text style={styles.statLabel}>Max Distance</Text>
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
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TelemetryCard;
