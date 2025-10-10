import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getLaunchTimingInfo, LaunchTimingInfo } from '@bermuda/shared';
import { colors, typography } from '../theme';

interface OptimalViewingCardProps {
  launchTime: Date | string;
}

const OptimalViewingCard: React.FC<OptimalViewingCardProps> = ({ launchTime }) => {
  const timingInfo = getLaunchTimingInfo(launchTime);

  // Map time context to display properties
  const getContextDisplay = (info: LaunchTimingInfo) => {
    switch (info.timeContext) {
      case 'golden_hour_evening':
        return {
          icon: '🌇',
          color: colors.warning,
          quality: 'EXCELLENT',
          title: 'Optimal Viewing - Golden Hour',
          description: 'Perfect twilight conditions for spectacular exhaust plume illumination'
        };
      case 'pre_dawn_ideal':
        return {
          icon: '🌅',
          color: colors.success,
          quality: 'EXCELLENT',
          title: 'Optimal Viewing - Pre-Dawn',
          description: 'Ideal sunrise timing for maximum exhaust plume visibility'
        };
      case 'post_sunset_fading':
        return {
          icon: '🌆',
          color: colors.primary,
          quality: 'GOOD',
          title: 'Good Viewing - Post-Sunset',
          description: 'Darkening sky provides good viewing conditions'
        };
      case 'pre_dawn_possible':
        return {
          icon: '🌄',
          color: colors.primary,
          quality: 'GOOD',
          title: 'Good Viewing - Early Morning',
          description: 'Pre-dawn conditions allow good visibility'
        };
      case 'deep_night':
        return {
          icon: '🌙',
          color: colors.primary,
          quality: 'FAIR',
          title: 'Night Launch',
          description: 'Dark sky allows exhaust plume visibility'
        };
      case 'daylight':
        return {
          icon: '☀️',
          color: colors.textSecondary,
          quality: 'LIMITED',
          title: 'Daytime Launch',
          description: 'Challenging viewing conditions - look for bright dot or contrail'
        };
      default:
        return {
          icon: '🔭',
          color: colors.textPrimary,
          quality: 'UNKNOWN',
          title: 'Viewing Conditions',
          description: info.description
        };
    }
  };

  const display = getContextDisplay(timingInfo);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{display.icon}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>{display.title}</Text>
          <Text style={[styles.quality, { color: display.color }]}>
            {display.quality} VISIBILITY
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.description}>{display.description}</Text>

        {timingInfo.trackingAdvice && (
          <View style={styles.adviceContainer}>
            <Text style={styles.adviceLabel}>Viewing Advice:</Text>
            <Text style={styles.adviceText}>{timingInfo.trackingAdvice}</Text>
          </View>
        )}

        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Bermuda Time:</Text>
          <Text style={styles.timeValue}>
            {timingInfo.bermudaTime.toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Atlantic/Bermuda'
            })} {timingInfo.timeZone}
          </Text>
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
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  quality: {
    ...typography.caption,
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  body: {
    gap: 12,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  adviceContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  adviceLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  adviceText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  timeValue: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default OptimalViewingCard;
