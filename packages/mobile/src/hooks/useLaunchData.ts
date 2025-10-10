import { useState, useEffect, useCallback } from 'react';
import { launchDataService, Launch, visibilityService, TelemetryService } from '@bermuda/shared';

interface UseLaunchDataResult {
  launches: Launch[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useLaunchData = (): UseLaunchDataResult => {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLaunches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch launches from the data service
      const data = await launchDataService.getLaunches();

      // Enrich each launch with visibility data
      console.log('[useLaunchData] Enriching', data.length, 'launches with visibility data');
      const enrichedLaunches = await Promise.all(
        data.map(async (launch) => {
          try {
            // Track data quality issues
            const missingFields: string[] = [];
            if (!launch.pad?.location?.name) missingFields.push('pad.location.name');
            if (!launch.pad?.name) missingFields.push('pad.name');
            if (!launch.mission?.name) missingFields.push('mission.name');
            if (!launch.mission?.orbit?.name) missingFields.push('mission.orbit.name');

            if (missingFields.length > 0) {
              TelemetryService.trackDataQualityIssue(
                launch.id,
                launch.name || 'Unknown Launch',
                missingFields
              );
            }

            const visibilityData = await visibilityService.calculateVisibility(launch);
            return {
              ...launch,
              visibility: visibilityData,
            };
          } catch (error) {
            console.warn('[useLaunchData] Failed to calculate visibility for launch:', launch.id, error);

            // Track visibility calculation failure
            TelemetryService.trackVisibilityCalculationFailure(
              launch.id,
              launch.name || 'Unknown Launch',
              error as Error,
              false // No fallback used in this context
            );

            // Return launch without visibility data rather than failing completely
            return launch;
          }
        })
      );

      setLaunches(enrichedLaunches);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch launches'));
      setLaunches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaunches();
  }, [fetchLaunches]);

  return {
    launches,
    loading,
    error,
    refetch: fetchLaunches,
  };
};
