import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { typography } from '../theme';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: Date | string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const countdown = useCountdown(targetDate);

  if (countdown.isExpired) {
    return (
      <View style={styles.container}>
        <Text style={styles.expiredText}>🚀 Launch Time!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Launch in</Text>
      <View style={styles.timeContainer}>
        {countdown.days > 0 && (
          <>
            <TimeUnit value={countdown.days} unit="d" />
            <Separator />
          </>
        )}
        {(countdown.days > 0 || countdown.hours > 0) && (
          <>
            <TimeUnit value={countdown.hours} unit="h" />
            <Separator />
          </>
        )}
        <TimeUnit value={countdown.minutes} unit="m" />
        <Separator />
        <TimeUnit value={countdown.seconds} unit="s" />
      </View>
    </View>
  );
};

const TimeUnit: React.FC<{ value: number; unit: string }> = ({ value, unit }) => (
  <View style={styles.timeUnit}>
    <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.timeLabel}>{unit}</Text>
  </View>
);

const Separator: React.FC = () => (
  <Text style={styles.separator}>:</Text>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  label: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 56,
  },
  timeLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
  separator: {
    fontSize: 40,
    fontWeight: '300',
    color: colors.textSecondary,
    lineHeight: 56,
  },
  expiredText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default CountdownTimer;
