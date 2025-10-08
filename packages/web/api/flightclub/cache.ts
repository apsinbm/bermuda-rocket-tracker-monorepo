import { Redis } from '@upstash/redis';
import type { ProcessedSimulationData } from './simulation/[missionId]';
import type { FlightClubMission } from './missions';

export interface MissionCacheEntry {
  missions: FlightClubMission[];
  cachedAt: number;
  warning?: string;
}

export interface SimulationCacheEntry {
  data: ProcessedSimulationData;
  cachedAt: number;
  version?: number; // Cache version for invalidation
}

export interface LaunchCacheMetadata {
  launchId: string;
  missionId: string;
  simulationId?: string;
  launchName: string;
  launchTime: string;
  stage?: string;
  lastRefreshedAt?: number;
  lastResult?: 'success' | 'failed';
}

const redis = (() => {
  try {
    return Redis.fromEnv();
  } catch (error) {
    console.warn('[FlightClubCache] Redis not configured, falling back to in-memory cache');
    return null;
  }
})();

const memoryCache = {
  missions: null as MissionCacheEntry | null,
  simulations: new Map<string, SimulationCacheEntry>(),
  meta: new Map<string, LaunchCacheMetadata>()
};

const MISSION_CACHE_KEY = 'flightclub:missions';
const SIMULATION_CACHE_PREFIX = 'flightclub:simulation:';
const METADATA_CACHE_PREFIX = 'flightclub:launchmeta:';

const SIX_HOURS_SECONDS = 6 * 60 * 60;
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

// Cache version - increment this when data processing logic changes
// This ensures old cached data gets invalidated automatically
export const CACHE_VERSION = 2; // v2: Added stage 1 ascent data to displayInGraphs

export const isRedisEnabled = Boolean(redis);

export async function getCachedMissions(): Promise<MissionCacheEntry | null> {
  if (redis) {
    try {
      const cached = await redis.get<MissionCacheEntry>(MISSION_CACHE_KEY);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('[FlightClubCache] Redis get failed, using memory cache:', error);
    }
  }

  return memoryCache.missions;
}

export async function setCachedMissions(entry: MissionCacheEntry): Promise<void> {
  if (redis) {
    try {
      await redis.set(MISSION_CACHE_KEY, entry, { ex: SIX_HOURS_SECONDS });
    } catch (error) {
      console.warn('[FlightClubCache] Redis set failed, using memory cache only:', error);
    }
  }

  memoryCache.missions = entry;
}

export async function getCachedSimulation(missionId: string): Promise<SimulationCacheEntry | null> {
  if (redis) {
    try {
      const cached = await redis.get<SimulationCacheEntry>(SIMULATION_CACHE_PREFIX + missionId);
      if (cached) {
        // Invalidate cache if version mismatch
        if (cached.version !== CACHE_VERSION) {
          console.log(`[FlightClubCache] Cache version mismatch for ${missionId} (cached: ${cached.version}, current: ${CACHE_VERSION}). Invalidating.`);
          await redis.del(SIMULATION_CACHE_PREFIX + missionId);
          return null;
        }
        return cached;
      }
    } catch (error) {
      console.warn('[FlightClubCache] Redis get failed for simulation, using memory cache:', error);
    }
  }

  const memCached = memoryCache.simulations.get(missionId);
  if (memCached && memCached.version !== CACHE_VERSION) {
    console.log(`[FlightClubCache] Memory cache version mismatch for ${missionId}. Invalidating.`);
    memoryCache.simulations.delete(missionId);
    return null;
  }

  return memCached ?? null;
}

export async function setCachedSimulation(missionId: string, entry: SimulationCacheEntry, ttlSeconds: number = THIRTY_DAYS_SECONDS): Promise<void> {
  if (redis) {
    try {
      await redis.set(SIMULATION_CACHE_PREFIX + missionId, entry, { ex: ttlSeconds });
    } catch (error) {
      console.warn('[FlightClubCache] Redis set failed for simulation, using memory cache only:', error);
    }
  }

  memoryCache.simulations.set(missionId, entry);
}

export async function getLaunchMetadata(launchId: string): Promise<LaunchCacheMetadata | null> {
  if (redis) {
    try {
      const cached = await redis.get<LaunchCacheMetadata>(METADATA_CACHE_PREFIX + launchId);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('[FlightClubCache] Redis get failed for metadata, using memory cache:', error);
    }
  }

  return memoryCache.meta.get(launchId) ?? null;
}

export async function setLaunchMetadata(meta: LaunchCacheMetadata): Promise<void> {
  if (redis) {
    try {
      await redis.set(METADATA_CACHE_PREFIX + meta.launchId, meta, { ex: THIRTY_DAYS_SECONDS });
    } catch (error) {
      console.warn('[FlightClubCache] Redis set failed for metadata, using memory cache only:', error);
    }
  }

  memoryCache.meta.set(meta.launchId, meta);
}

export async function removeLaunchMetadata(launchId: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(METADATA_CACHE_PREFIX + launchId);
    } catch (error) {
      console.warn('[FlightClubCache] Redis delete failed for metadata, using memory cache only:', error);
    }
  }

  memoryCache.meta.delete(launchId);
}

export async function listCachedLaunchMetadata(): Promise<LaunchCacheMetadata[]> {
  if (redis) {
    try {
      const keys = await redis.keys(METADATA_CACHE_PREFIX + '*');
      if (Array.isArray(keys) && keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.get<LaunchCacheMetadata>(key as string));
        const results = await pipeline.exec();

        // pipeline.exec() returns Array<[Error | null, T | null]>
        if (!results || !Array.isArray(results)) {
          return Array.from(memoryCache.meta.values());
        }

        return results
          .map((result: [Error | null, LaunchCacheMetadata | null]) => result[1])
          .filter((entry): entry is LaunchCacheMetadata => entry !== null);
      }
    } catch (error) {
      console.warn('[FlightClubCache] Unable to list Redis metadata keys:', error);
    }
  }

  return Array.from(memoryCache.meta.values());
}
