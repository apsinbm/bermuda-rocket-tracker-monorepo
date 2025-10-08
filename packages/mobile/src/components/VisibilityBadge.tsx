import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { typography } from '../theme';

interface VisibilityBadgeProps {
  likelihood: 'high' | 'medium' | 'low' | 'none';
  size?: 'small' | 'large';
}

const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({ likelihood, size = 'small' }) => {
  const getConfig = () => {
    switch (likelihood) {
      case 'high':
        return {
          color: colors.visibility.high,
          label: 'High Visibility',
          emoji: '👁️',
        };
      case 'medium':
        return {
          color: colors.visibility.medium,
          label: 'Medium Visibility',
          emoji: '👀',
        };
      case 'low':
        return {
          color: colors.visibility.low,
          label: 'Low Visibility',
          emoji: '🔍',
        };
      case 'none':
      default:
        return {
          color: colors.visibility.none,
          label: 'Not Visible',
          emoji: '🌑',
        };
    }
  };

  const config = getConfig();
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, { backgroundColor: config.color }]}>
      <Text style={[styles.emoji, isLarge && styles.emojiLarge]}>
        {config.emoji}
      </Text>
      <Text style={[styles.label, isLarge && styles.labelLarge]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emoji: {
    fontSize: 12,
    marginRight: 4,
  },
  emojiLarge: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    ...typography.bodySmall,
    color: colors.background,
    fontSize: 11,
    fontWeight: '600',
  },
  labelLarge: {
    fontSize: 14,
  },
});

export default VisibilityBadge;
