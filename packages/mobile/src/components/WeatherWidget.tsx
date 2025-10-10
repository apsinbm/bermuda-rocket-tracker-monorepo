import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WeatherService, LaunchWeatherAssessment } from '@bermuda/shared';
import { colors } from '../theme';
import { typography } from '../theme';

interface WeatherWidgetProps {
  launchTime: Date | string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ launchTime }) => {
  const [weatherAssessment, setWeatherAssessment] = useState<LaunchWeatherAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooFarOut, setTooFarOut] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);

        // Calculate days until launch
        const launchDate = typeof launchTime === 'string' ? new Date(launchTime) : launchTime;
        const now = new Date();
        const daysUntilLaunch = Math.ceil((launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Only show weather for launches within 14 days
        if (daysUntilLaunch > 14) {
          setTooFarOut(true);
          setLoading(false);
          return;
        }

        // Fetch real weather data from OpenMeteo for Bermuda
        const assessment = await WeatherService.getWeatherForLaunch(launchDate);
        setWeatherAssessment(assessment);
        setTooFarOut(false);
      } catch (error) {
        console.error('[WeatherWidget] Failed to fetch weather:', error);
        // Handle error silently - no weather data available
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

  // Show message for launches more than 14 days away
  if (tooFarOut) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📅</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Weather Forecast</Text>
          <Text style={styles.unavailableText}>
            Weather forecast unavailable for launches more than 2 weeks away
          </Text>
        </View>
      </View>
    );
  }

  if (!weatherAssessment) {
    return null;
  }

  // Map weather rating to icon and color
  const getRatingDisplay = (rating: string) => {
    switch (rating) {
      case 'excellent': return { icon: '🌟', color: colors.success };
      case 'good': return { icon: '☀️', color: colors.primary };
      case 'fair': return { icon: '⛅', color: colors.warning };
      case 'poor': return { icon: '☁️', color: colors.error };
      case 'very_poor': return { icon: '🌧️', color: colors.error };
      default: return { icon: '☀️', color: colors.textPrimary };
    }
  };

  const ratingDisplay = getRatingDisplay(weatherAssessment.overallRating);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{ratingDisplay.icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Weather for Launch (Bermuda)</Text>
        <Text style={[styles.conditions, { color: ratingDisplay.color }]}>
          {weatherAssessment.overallRating.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.recommendation} numberOfLines={2}>
          {weatherAssessment.recommendation}
        </Text>
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
  recommendation: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 11,
  },
  unavailableText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 13,
  },
});

export default WeatherWidget;
