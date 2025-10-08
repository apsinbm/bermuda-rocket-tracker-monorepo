import { useState, useEffect, useCallback } from 'react';
import { launchDataService, Launch } from '@bermuda/shared';

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
      const data = await launchDataService.getLaunches();
      setLaunches(data);
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
