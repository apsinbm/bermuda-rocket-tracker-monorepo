// Export platform abstraction
export * from './platform/PlatformContainer';
export * from './adapters/storage';
export * from './adapters/notifications';

// Export all services
// Note: Some services have overlapping type definitions, so we export the whole module
// to avoid conflicts. Users can import specific items as needed.
export * as bermudaTimeService from './services/bermudaTimeService';
export * as cacheInitializerNamespace from './services/cacheInitializer';
export { cacheInitializer } from './services/cacheInitializer';
export * as delayImpactAnalyzer from './services/delayImpactAnalyzer';
export { DelayImpactAnalyzer } from './services/delayImpactAnalyzer';
export * as delayNotificationService from './services/delayNotificationService';
export { DelayNotificationService } from './services/delayNotificationService';
export * as dynamicPollingService from './services/dynamicPollingService';
export { DynamicPollingService } from './services/dynamicPollingService';
export * as errorHandlingService from './services/errorHandlingService';
export * as exhaustPlumeVisibilityCalculator from './services/ExhaustPlumeVisibilityCalculator';
export * as flightClubApiService from './services/flightClubApiService';
export * as flightClubDataProcessor from './services/flightClubDataProcessor';
export * as flightClubService from './services/flightClubService';
export * as geometricVisibilityService from './services/geometricVisibilityService';
export * as governmentSolarService from './services/governmentSolarService';
export { GovernmentSolarService } from './services/governmentSolarService';
export * as imageAnalysisService from './services/imageAnalysisService';
export * as indexedDBCacheNamespace from './services/indexedDBCache';
export { indexedDBCache } from './services/indexedDBCache';
export type { CacheStats, CachedFlightClubData, CachedLaunchMatch, CachedVisibilityData } from './services/indexedDBCache';
export * as launchDatabaseNamespace from './services/launchDatabase';
export { launchDatabase } from './services/launchDatabase';
export * as launchDataServiceNamespace from './services/launchDataService';
export { launchDataService } from './services/launchDataService';
export * as launchDelayDetectionServiceNamespace from './services/launchDelayDetectionService';
export { launchDelayDetectionService } from './services/launchDelayDetectionService';
export type { LaunchScheduleChange } from './services/launchDelayDetectionService';
export * as launchMatchingService from './services/launchMatchingService';
export * as launchService from './services/launchService';
export * as launchUpdateScheduler from './services/launchUpdateScheduler';
export { getRefreshInterval, formatRefreshStatus } from './services/launchUpdateScheduler';
export * as notificationServiceNamespace from './services/notificationService';
export { notificationService } from './services/notificationService';
export type { NotificationStatus, NotificationSettings } from './services/notificationService';
export * as plumeIlluminationService from './services/plumeIlluminationService';
export * as productionHealthService from './services/productionHealthService';
export * as productionMonitoringService from './services/productionMonitoringService';
export * as scheduleChangeDetectionService from './services/scheduleChangeDetectionService';
export { ScheduleChangeDetectionService } from './services/scheduleChangeDetectionService';
export * as solarPositionCalculator from './services/solarPositionCalculator';
export * as spaceLaunchScheduleService from './services/spaceLaunchScheduleService';
export * as trajectoryMappingService from './services/trajectoryMappingService';
export * as trajectoryService from './services/trajectoryService';
export { clearProjectKuiperCache, getTrajectoryData } from './services/trajectoryService';
export * as visibilityService from './services/visibilityService';
export { getBearingDirection } from './services/visibilityService';
export * as weatherService from './services/weatherService';
export { WeatherService } from './services/weatherService';
export type { WeatherData, LaunchWeatherAssessment } from './services/weatherService';

// Export all utils
export * from './utils/accurateSunTimes';
export * from './utils/astronomicalCalculations';
export * from './utils/bermudaTimeZone';
export * from './utils/coordinateUtils';
export * from './utils/delayScenarioTesting';
export * from './utils/environmentUtils';
export * from './utils/imageParser';
export * from './utils/launchCoordinates';
export * from './utils/launchPadInfo';
export * from './utils/launchTimingUtils';
export * from './utils/platformUtils';
export * from './utils/sunCalcTimes';
export * from './utils/telemetryUtils';
export * from './utils/temperatureUtils';
export * from './utils/timeUtils';
export * from './utils/trackingExplanation';
export * from './utils/visibilityFormatter';

// Export types
export * from './types';

// Export additional service types and classes
export type {
  ProcessedSimulationData,
  EnhancedTelemetryFrame,
  VisibilitySummary,
  StageEvent,
  MissionsResponse,
  FlightClubMission
} from './services/flightClubApiService';

export { FlightClubApiService } from './services/flightClubApiService';

export type {
  ErrorInput,
  ErrorDetails,
  RetryConfig,
  ErrorHandlingMetrics
} from './services/errorHandlingService';

export { ErrorType, EnhancedError } from './services/errorHandlingService';

export type {
  TrajectoryData
} from './services/trajectoryService';

export type {
  PlumeIlluminationPrediction,
  IlluminationPeriod,
  ViewingMoment
} from './services/plumeIlluminationService';
