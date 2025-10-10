import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { plumeIlluminationService } from '@bermuda/shared';
import type { PlumeIlluminationPrediction } from '@bermuda/shared';
import { colors, typography } from '../theme';

interface PlumeIlluminationCardProps {
  launch: any; // Full launch object with visibility data
}

const PlumeIlluminationCard: React.FC<PlumeIlluminationCardProps> = ({ launch }) => {
  const [prediction, setPrediction] = useState<PlumeIlluminationPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const result = await plumeIlluminationService.PlumeIlluminationService.predictPlumeIllumination(launch);
        setPrediction(result);
      } catch (error) {
        console.error('[PlumeIllumination] Failed to generate prediction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [launch]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Don't show card if no plume illumination predicted
  if (!prediction || !prediction.hasPlumeIllumination || prediction.overallQuality === 'none') {
    return null;
  }

  // Map quality to display properties
  const getQualityDisplay = (quality: string) => {
    switch (quality) {
      case 'spectacular':
        return { icon: '✨', color: '#FFD700', label: 'SPECTACULAR' };
      case 'excellent':
        return { icon: '🌟', color: colors.success, label: 'EXCELLENT' };
      case 'good':
        return { icon: '💫', color: colors.primary, label: 'GOOD' };
      case 'fair':
        return { icon: '⭐', color: colors.warning, label: 'FAIR' };
      default:
        return { icon: '🔭', color: colors.textSecondary, label: 'POSSIBLE' };
    }
  };

  const qualityDisplay = getQualityDisplay(prediction.overallQuality);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{qualityDisplay.icon}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>Jellyfish Effect Predicted!</Text>
          <Text style={[styles.quality, { color: qualityDisplay.color }]}>
            {qualityDisplay.label} CONDITIONS
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.body}>
        <Text style={styles.description}>
          This twilight launch may produce a spectacular "jellyfish effect" - the rocket's
          exhaust plume will be illuminated by sunlight against a dark sky, creating a
          stunning visual display visible from Bermuda.
        </Text>

        {/* Best Viewing Moments */}
        {prediction.bestViewingMoments && prediction.bestViewingMoments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Best Viewing Moments</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.momentsScroll}
            >
              {prediction.bestViewingMoments.map((moment, idx) => (
                <View key={idx} style={styles.momentCard}>
                  <Text style={styles.momentTime}>
                    {moment.time.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Atlantic/Bermuda'
                    })}
                  </Text>
                  <Text style={styles.momentDescription}>{moment.description}</Text>
                  <Text style={styles.momentDetail}>
                    Altitude: {Math.round(moment.rocketAltitude)} km
                  </Text>
                  <Text style={styles.momentDetail}>
                    Plume: {Math.round(moment.plumeSize)} km wide
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Photography Tips */}
        {prediction.photographyRecommendations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Photography Tips</Text>
            <View style={styles.photographyCard}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>ISO:</Text>
                <Text style={styles.settingValue}>
                  {prediction.photographyRecommendations.cameraSettings.iso}
                </Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Aperture:</Text>
                <Text style={styles.settingValue}>
                  f/{prediction.photographyRecommendations.cameraSettings.aperture}
                </Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Shutter:</Text>
                <Text style={styles.settingValue}>
                  {prediction.photographyRecommendations.cameraSettings.shutterSpeed}
                </Text>
              </View>
              {prediction.photographyRecommendations.timing.startRecording && (
                <View style={styles.timingContainer}>
                  <Text style={styles.timingText}>
                    Start recording: {prediction.photographyRecommendations.timing.startRecording}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
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
    borderWidth: 2,
    borderColor: '#FFD700',
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
    fontWeight: '700',
    fontSize: 17,
  },
  quality: {
    ...typography.caption,
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  body: {
    gap: 16,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  momentsScroll: {
    marginTop: 8,
  },
  momentCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 160,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  momentTime: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  momentDescription: {
    ...typography.caption,
    color: colors.textPrimary,
    marginBottom: 6,
    fontSize: 12,
  },
  momentDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  photographyCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  settingValue: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  timingContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default PlumeIlluminationCard;
