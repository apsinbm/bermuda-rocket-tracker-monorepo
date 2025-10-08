import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { FlightClubApiService, ProcessedSimulationData } from '@bermuda/shared';
import { colors } from '../theme';
import { typography } from '../theme';
import CountdownTimer from '../components/CountdownTimer';
import VisibilityBadge from '../components/VisibilityBadge';
import DirectionCompass from '../components/DirectionCompass';
import WeatherWidget from '../components/WeatherWidget';
import TelemetryCard from '../components/TelemetryCard';
import SkyMapView from '../components/SkyMapView';
import TrajectoryChart from '../components/TrajectoryChart';

type LaunchDetailRouteProp = RouteProp<RootStackParamList, 'LaunchDetail'>;

const LaunchDetailScreen: React.FC = () => {
  const route = useRoute<LaunchDetailRouteProp>();
  const { launch } = route.params;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // FlightClub data state
  const [simulationData, setSimulationData] = useState<ProcessedSimulationData | null>(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Extract visibility data if available
  const visibility = (launch as any).visibility;
  const likelihood = visibility?.likelihood || 'none';
  const direction = visibility?.direction || 'Northeast';
  const bearing = visibility?.bearing || 45;

  // Extract FlightClub match data
  const flightClubMatch = (launch as any).flightClubMatch;
  const hasFlightClubMatch = !!(launch as any).hasFlightClubData;

  // Fetch FlightClub simulation data when component mounts
  useEffect(() => {
    const fetchSimulationData = async () => {
      if (!hasFlightClubMatch || !flightClubMatch) {
        return;
      }

      setLoadingSimulation(true);
      setSimulationError(null);

      try {
        const missionId = flightClubMatch.flightClubMission?.flightClubSimId ||
                         flightClubMatch.flightClubMission?.id;

        if (!missionId) {
          throw new Error('No mission ID available');
        }

        // Calculate fallback ID to try if primary fails (mirrors web implementation)
        const primaryId = missionId;
        const fallbackId = flightClubMatch.flightClubMission?.id !== primaryId
          ? flightClubMatch.flightClubMission?.id
          : undefined;

        console.log('[LaunchDetail] Using mission id:', missionId, 'fallback id:', fallbackId);

        const simData = await FlightClubApiService.getSimulationData(
          missionId,
          launch.id,
          fallbackId ? { fallbackMissionId: fallbackId } : undefined
        );

        setSimulationData(simData);
      } catch (error) {
        console.error('[LaunchDetail] Failed to fetch FlightClub data:', error);
        setSimulationError(error instanceof Error ? error.message : 'Failed to load trajectory data');
      } finally {
        setLoadingSimulation(false);
      }
    };

    fetchSimulationData();
  }, [launch.id, hasFlightClubMatch, flightClubMatch]);

  // Transform simulation data to component-friendly formats
  const trajectoryPoints = simulationData?.enhancedTelemetry.map(frame => ({
    time: frame.time,
    altitude: frame.altitude / 1000, // Convert meters to km
    downrange: frame.distanceFromBermuda,
  }));

  const telemetry = simulationData ? {
    maxAltitude: Math.max(...simulationData.enhancedTelemetry.map(f => f.altitude)) / 1000,
    maxVelocity: Math.max(...simulationData.enhancedTelemetry.map(f => f.speed)),
    maxDownrange: Math.max(...simulationData.enhancedTelemetry.map(f => f.distanceFromBermuda)),
  } : undefined;

  const skyPosition = simulationData && simulationData.enhancedTelemetry.length > 0 ? {
    azimuth: simulationData.enhancedTelemetry[0].bearingFromBermuda,
    elevation: simulationData.enhancedTelemetry[0].elevationAngle,
    distance: simulationData.enhancedTelemetry[0].distanceFromBermuda,
  } : undefined;

  const handleNotificationToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    Alert.alert(
      notificationsEnabled ? 'Notifications Disabled' : 'Notifications Enabled',
      notificationsEnabled
        ? 'You will no longer receive alerts for this launch'
        : 'You will receive alerts 30 minutes before launch'
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroEmoji}>🚀</Text>
          </View>
          <Text style={styles.missionName}>{launch.name}</Text>
        </View>

        {/* Countdown Timer */}
        <View style={styles.section}>
          <CountdownTimer targetDate={launch.net} />
        </View>

        {/* Visibility Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility from Bermuda</Text>
          <View style={styles.visibilityContainer}>
            <VisibilityBadge likelihood={likelihood} size="large" />
          </View>
        </View>

        {/* Direction */}
        {likelihood !== 'none' && (
          <View style={styles.section}>
            <DirectionCompass bearing={bearing} direction={direction} />
          </View>
        )}

        {/* Weather */}
        <View style={styles.section}>
          <WeatherWidget launchTime={launch.net} />
        </View>

        {/* FlightClub Visualizations */}
        {hasFlightClubMatch && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FlightClub Trajectory Data</Text>

            {loadingSimulation && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading trajectory data...</Text>
              </View>
            )}

            {simulationError && !loadingSimulation && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {simulationError}</Text>
              </View>
            )}

            {!loadingSimulation && !simulationError && simulationData && (
              <>
                {/* Trajectory Visualization */}
                {trajectoryPoints && trajectoryPoints.length > 0 && (
                  <View style={styles.subsection}>
                    <TrajectoryChart trajectoryPoints={trajectoryPoints} />
                  </View>
                )}

                {/* Telemetry Data */}
                {telemetry && (
                  <View style={styles.subsection}>
                    <TelemetryCard telemetry={telemetry} />
                  </View>
                )}

                {/* Sky Map */}
                {skyPosition && (
                  <View style={styles.subsection}>
                    <SkyMapView skyPosition={skyPosition} />
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Mission Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mission Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow
              label="Rocket"
              value={launch.rocket?.name || 'Unknown'}
            />
            <DetailRow
              label="Launch Pad"
              value={launch.pad?.name || 'Unknown'}
            />
            <DetailRow
              label="Location"
              value={launch.pad?.location?.name || 'Unknown'}
            />
            <DetailRow
              label="Launch Time"
              value={formatDate(launch.net)}
            />
            {launch.mission?.description && (
              <DetailRow
                label="Mission"
                value={launch.mission.description}
                multiline
              />
            )}
          </View>
        </View>

        {/* Notification Toggle */}
        <TouchableOpacity
          style={[
            styles.notificationButton,
            notificationsEnabled && styles.notificationButtonActive,
          ]}
          onPress={handleNotificationToggle}
        >
          <Text style={styles.notificationButtonIcon}>
            {notificationsEnabled ? '🔔' : '🔕'}
          </Text>
          <Text style={styles.notificationButtonText}>
            {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
  multiline?: boolean;
}> = ({ label, value, multiline = false }) => (
  <View style={[styles.detailRow, multiline && styles.detailRowColumn]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, multiline && styles.detailValueMultiline]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
  },
  heroPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 64,
  },
  missionName: {
    ...typography.title,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  subsection: {
    marginTop: 16,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  visibilityContainer: {
    alignItems: 'flex-start',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  detailValueMultiline: {
    textAlign: 'left',
    marginTop: 8,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  notificationButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  notificationButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationButtonText: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

export default LaunchDetailScreen;
