import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { typography } from '../theme';

interface DirectionCompassProps {
  bearing: number;
  direction: string;
}

const DirectionCompass: React.FC<DirectionCompassProps> = ({ bearing, direction }) => {
  return (
    <View style={styles.container}>
      <View style={styles.compassCircle}>
        <Text style={styles.compassEmoji}>🧭</Text>
        <View style={styles.bearingContainer}>
          <Text style={styles.bearing}>{Math.round(bearing)}°</Text>
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Launch Direction</Text>
        <Text style={styles.direction}>{direction}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  compassCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  compassEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  bearingContainer: {
    position: 'absolute',
    bottom: 8,
  },
  bearing: {
    ...typography.bodySmall,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  direction: {
    ...typography.title,
    color: colors.textPrimary,
    fontSize: 20,
  },
});

export default DirectionCompass;
