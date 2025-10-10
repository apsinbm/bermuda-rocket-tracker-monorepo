import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { FlightClubApiService, ProcessedSimulationData, validateTrajectoryData } from '@bermuda/shared';
import { colors } from '../theme';
import { typography } from '../theme';
import CountdownTimer from '../components/CountdownTimer';
import VisibilityBadge from '../components/VisibilityBadge';
import DirectionCompass from '../components/DirectionCompass';
import WeatherWidget from '../components/WeatherWidget';
import OptimalViewingCard from '../components/OptimalViewingCard';
import PlumeIlluminationCard from '../components/PlumeIlluminationCard';
import SkyMapView from '../components/SkyMapView';
import TelemetryGraphs from '../components/TelemetryGraphs';
import StageEventsTimeline from '../components/StageEventsTimeline';
import GeographicTrajectoryMap from '../components/GeographicTrajectoryMap';
import Trajectory3DStudio from '../components/Trajectory3DStudio';

type LaunchDetailRouteProp = RouteProp<RootStackParamList, 'LaunchDetail'>;

// Helper functions to extract data with proper fallbacks
const getRocketName = (launch: any): string => {
  // Try multiple sources in order of preference
  if (launch.rocket?.configuration?.full_name) return launch.rocket.configuration.full_name;
  if (launch.rocket?.configuration?.name) return launch.rocket.configuration.name;
  if (launch.rocket?.name) return launch.rocket.name;

  // Try parsing from launch name (e.g., "Falcon 9 Block 5 | Starlink Group...")
  if (launch.name) {
    const match = launch.name.match(/^([^|]+)/);
    if (match) {
      const rocketName = match[1].trim();
      // Only use if it looks like a rocket name (not mission name)
      if (rocketName.match(/(Falcon|Atlas|Delta|Ariane|Soyuz|Vulcan|Electron|LauncherOne|Antares)/i)) {
        return rocketName;
      }
    }
  }

  // Last resort: check launch service provider
  if (launch.launch_service_provider?.name) {
    return `${launch.launch_service_provider.name} Rocket`;
  }

  return 'Rocket information pending';
};

const getLaunchPadName = (launch: any): string => {
  if (launch.pad?.name) return launch.pad.name;
  if (launch.pad?.location?.name) return `Launch site in ${launch.pad.location.name}`;
  return 'Launch pad information pending';
};

const getLocationName = (launch: any): string => {
  if (launch.pad?.location?.name) return launch.pad.location.name;
  if (launch.pad?.location?.country_code) return launch.pad.location.country_code;
  if (launch.pad?.name) {
    // Try to extract location from pad name
    const match = launch.pad.name.match(/,\s*(.+)$/);
    if (match) return match[1];
  }
  return 'Location information pending';
};

const LaunchDetailScreen: React.FC = () => {
  const route = useRoute<LaunchDetailRouteProp>();
  const { launch } = route.params;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // FlightClub data state
  const [simulationData, setSimulationData] = useState<ProcessedSimulationData | null>(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [trajectoryValidation, setTrajectoryValidation] = useState<{ isValid: boolean; reason?: string } | null>(null);

  // Extract visibility data if available
  const visibility = (launch as any).visibility;
  const likelihood = visibility?.likelihood || 'none';

  // Use actual trajectory direction from visibility calculations (not hardcoded!)
  const trajectoryDirection = visibility?.trajectoryDirection || 'Northeast';

  // Calculate bearing: prefer simulation data bearing (most accurate), fall back to visibility bearing
  let calculatedBearing = visibility?.bearing || 45;

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

        // Validate trajectory data matches launch site
        const launchSiteCoords = launch.pad?.latitude && launch.pad?.longitude ? {
          latitude: launch.pad.latitude,
          longitude: launch.pad.longitude
        } : undefined;

        const validation = validateTrajectoryData(simData, launchSiteCoords);
        setTrajectoryValidation(validation);

        if (!validation.isValid) {
          console.warn('[LaunchDetail] Trajectory validation failed:', validation.reason);
        } else {
          console.log('[LaunchDetail] Trajectory validation passed');
        }

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
    velocity: frame.speed,
    latitude: frame.latitude,
    longitude: frame.longitude,
    elevationAngle: frame.elevationAngle,
    distanceFromBermuda: frame.distanceFromBermuda,
    aboveHorizon: frame.aboveHorizon,
  }));

  // Extract stage events from simulation data (simplified - would need actual event data)
  const stageEvents = simulationData ? [
    { name: 'Max-Q', time: 70, type: 'maxq' as const, altitude: 12, velocity: 350 },
    { name: 'MECO', time: 150, type: 'meco' as const, altitude: 68, velocity: 1800 },
    { name: 'Stage Separation', time: 153, type: 'other' as const, altitude: 70, velocity: 1800 },
    { name: 'SECO', time: 540, type: 'seco' as const, altitude: 200, velocity: 7800 },
  ] : [];

  const skyPosition = simulationData && simulationData.enhancedTelemetry.length > 0 ? {
    azimuth: simulationData.enhancedTelemetry[0].bearingFromBermuda,
    elevation: simulationData.enhancedTelemetry[0].elevationAngle,
    distance: simulationData.enhancedTelemetry[0].distanceFromBermuda,
  } : undefined;

  // Generate sky trajectory path
  const skyTrajectoryPath = simulationData?.enhancedTelemetry.map(frame => ({
    azimuth: frame.bearingFromBermuda,
    elevation: frame.elevationAngle,
    distance: frame.distanceFromBermuda,
    time: frame.time,
  }));

  // Use actual bearing from FlightClub data when available (closest approach point)
  if (simulationData && simulationData.enhancedTelemetry.length > 0) {
    // Find closest approach point for most accurate bearing
    const closestPoint = simulationData.enhancedTelemetry.reduce((closest, current) =>
      current.distanceFromBermuda < closest.distanceFromBermuda ? current : closest
    );
    calculatedBearing = Math.round(closestPoint.bearingFromBermuda);
  }

  // Extract launch site info
  const launchSite = launch.pad?.latitude && launch.pad?.longitude ? {
    latitude: launch.pad.latitude,
    longitude: launch.pad.longitude,
    name: launch.pad.name || 'Launch Site'
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

        {/* Optimal Viewing Time Analysis */}
        <View style={styles.section}>
          <OptimalViewingCard launchTime={launch.net} />
        </View>

        {/* Plume Illumination / Jellyfish Effect Prediction */}
        <PlumeIlluminationCard launch={launch} />

        {/* Direction */}
        {likelihood !== 'none' && (
          <View style={styles.section}>
            <DirectionCompass bearing={calculatedBearing} direction={trajectoryDirection} />
          </View>
        )}

        {/* Weather for Bermuda */}
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
                {/* 3D Trajectory Studio - DISABLED: Causes watchdog timeout due to heavy GL rendering */}
                {/* {trajectoryPoints && trajectoryPoints.length > 0 && (
                  <View style={styles.subsection}>
                    <Trajectory3DStudio
                      trajectoryPoints={trajectoryPoints}
                      currentTime={0}
                      isPlaying={false}
                    />
                  </View>
                )} */}

                {/* Mission Timeline */}
                {stageEvents.length > 0 && (
                  <View style={styles.subsection}>
                    <StageEventsTimeline events={stageEvents} />
                  </View>
                )}

                {/* Telemetry Graphs */}
                {trajectoryPoints && trajectoryPoints.length > 0 && (
                  <View style={styles.subsection}>
                    <TelemetryGraphs
                      trajectoryPoints={trajectoryPoints}
                      stageEvents={stageEvents}
                    />
                  </View>
                )}

                {/* Enhanced Sky Map */}
                {skyPosition && (
                  <View style={styles.subsection}>
                    <SkyMapView
                      skyPosition={skyPosition}
                      trajectoryPath={skyTrajectoryPath}
                    />
                  </View>
                )}

                {/* Geographic Trajectory Map */}
                {trajectoryPoints && trajectoryPoints.length > 0 && (
                  <View style={styles.subsection}>
                    {trajectoryValidation?.isValid ? (
                      <>
                        <GeographicTrajectoryMap
                          trajectoryPoints={trajectoryPoints}
                          launchSite={launchSite}
                        />
                        <View style={styles.dataSourceBadge}>
                          <Text style={styles.dataSourceText}>✓ FlightClub Data</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.validationWarning}>
                        <Text style={styles.validationWarningTitle}>Trajectory Data Unavailable</Text>
                        <Text style={styles.validationWarningText}>
                          {trajectoryValidation?.reason || 'No verified FlightClub trajectory data available for this launch'}
                        </Text>
                        <Text style={styles.validationWarningNote}>
                          We only display trajectory maps when accurate data from FlightClub is available and matches the launch site.
                        </Text>
                      </View>
                    )}
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
              value={getRocketName(launch)}
            />
            <DetailRow
              label="Launch Pad"
              value={getLaunchPadName(launch)}
            />
            <DetailRow
              label="Location"
              value={getLocationName(launch)}
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
  validationWarning: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  validationWarningTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  validationWarningText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  validationWarningNote: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  dataSourceBadge: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dataSourceText: {
    ...typography.caption,
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 11,
  },
});

export default LaunchDetailScreen;
