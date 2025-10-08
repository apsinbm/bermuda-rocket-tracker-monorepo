import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Launch } from '@bermuda/shared';
import { colors } from '../theme';
import { typography } from '../theme';
import { useCountdown } from '../hooks/useCountdown';
import VisibilityBadge from './VisibilityBadge';

interface LaunchCardProps {
  launch: Launch;
  onPress: () => void;
}

const LaunchCard: React.FC<LaunchCardProps> = ({ launch, onPress }) => {
  const countdown = useCountdown(launch.net);

  // Extract visibility data if available
  const visibility = (launch as any).visibility;
  const likelihood = visibility?.likelihood || 'none';
  const direction = visibility?.direction || 'Unknown';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.missionName} numberOfLines={2}>
            {launch.name}
          </Text>
          <VisibilityBadge likelihood={likelihood} />
        </View>

        <Text style={styles.rocketType} numberOfLines={1}>
          {launch.rocket?.name || 'Rocket'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>T-</Text>
            <Text style={styles.countdown}>{countdown.formatted}</Text>
          </View>

          {direction !== 'Unknown' && (
            <View style={styles.directionContainer}>
              <Text style={styles.directionIcon}>🧭</Text>
              <Text style={styles.direction}>{direction}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  missionName: {
    ...typography.title,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  rocketType: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countdownLabel: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginRight: 4,
  },
  countdown: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '600',
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  directionIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  direction: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default LaunchCard;
