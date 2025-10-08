import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import { typography } from '../theme';

interface WeatherWidgetProps {
  launchTime: Date | string;
}

interface WeatherData {
  temperature: number;
  conditions: string;
  icon: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ launchTime }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate weather data fetch
    // In production, this would use weatherService from @bermuda/shared
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock weather data
        setWeather({
          temperature: 72,
          conditions: 'Clear Skies',
          icon: '☀️',
        });
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [launchTime]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{weather.icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Expected Weather</Text>
        <Text style={styles.conditions}>{weather.conditions}</Text>
        <Text style={styles.temperature}>{weather.temperature}°F</Text>
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
    minHeight: 80,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 32,
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
  conditions: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  temperature: {
    ...typography.bodyLarge,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default WeatherWidget;
