/**
 * Launch Data Service with Dynamic Updates
 * Handles fetching and caching launch data with automatic refresh scheduling
 */

import { Launch } from '../types';
import { LaunchUpdateManager, getRefreshInterval, getUrgencyLevel } from './launchUpdateScheduler';
import { launchDatabase } from './launchDatabase';
import { fetchAllFloridaLaunches, clearLaunchCache } from './launchService';
import { launchMatchingService } from './launchMatchingService';
import { launchDelayDetectionService } from './launchDelayDetectionService';

interface LaunchCache {
  data: Launch[];
  lastFetch: number;
  nextScheduledUpdate: number;
}

interface LaunchStatus {
  id: string;
  name: string;
  launchTime: string;
  timeUntilLaunch: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  refreshPhase: string;
  nextUpdate: number;
  lastUpdated: number;
}

export class LaunchDataService {
  private cache: LaunchCache = {
    data: [],
    lastFetch: 0,
    nextScheduledUpdate: 0
  };
  
  private updateManager: LaunchUpdateManager;
  private isUpdating: boolean = false;
  private subscribers: Array<(launches: Launch[]) => void> = [];
  
  constructor() {
    this.updateManager = new LaunchUpdateManager(this.updateLaunchData.bind(this));
    this.clearStaleDataOnStartup();
    this.startPeriodicUpdates();
  }
  
  /**
   * Clear stale data on startup if all cached launches are in the past
   */
  private clearStaleDataOnStartup(): void {
    const cachedLaunches = launchDatabase.getAllLaunches();
    const now = new Date();
    
    if (cachedLaunches.length > 0) {
      // Check if all launches are in the past
      const allPast = cachedLaunches.every(launch => new Date(launch.net) < now);
      
      if (allPast) {
        launchDatabase.clear();
      }
    }
  }
  
  /**
   * Subscribe to launch data updates
   */
  subscribe(callback: (launches: Launch[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all subscribers of data changes
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.cache.data));
  }
  
  /**
   * Get current launch data - database first approach
   */
  async getLaunches(): Promise<Launch[]> {
    // Always return cached data if available and not stale
    if (this.cache.data.length > 0) {
      const now = new Date();
      const futureLaunches = this.cache.data.filter(launch => new Date(launch.net) > now);
      
      if (futureLaunches.length > 0) {
        return futureLaunches;
      } else {
        this.cache.data = [];
      }
    }
    
    // If no cache, try database
    const cachedLaunches = launchDatabase.getAllLaunches();
    if (cachedLaunches.length > 0) {
      this.cache.data = cachedLaunches;
      this.cache.lastFetch = Date.now();
      const now = new Date();
      const futureLaunches = this.cache.data.filter(launch => new Date(launch.net) > now);
      return futureLaunches;
    }
    
    // Fetch from API when no valid cached data
    await this.fetchLaunches();
    
    // Return only future launches
    const now = new Date();
    const futureLaunches = this.cache.data.filter(launch => new Date(launch.net) > now);
    
    return futureLaunches;
  }
  
  /**
   * Check if cache should be refreshed based on proximity to launches
   */
  private shouldRefreshCache(): boolean {
    const now = new Date().getTime();
    const cacheAge = now - this.cache.lastFetch;
    
    // Find the next upcoming launch to determine refresh frequency
    const nextLaunch = this.cache.data
      .filter(launch => new Date(launch.net).getTime() > now)
      .sort((a, b) => new Date(a.net).getTime() - new Date(b.net).getTime())[0];
    
    if (!nextLaunch) {
      // No upcoming launches, use default 5-minute refresh
      return cacheAge > 5 * 60 * 1000;
    }
    
    const timeUntilLaunch = new Date(nextLaunch.net).getTime() - now;
    const minutesUntilLaunch = Math.floor(timeUntilLaunch / (1000 * 60));
    
    // Aggressive refresh intervals based on time until launch
    let maxCacheAge;
    if (minutesUntilLaunch <= 15) {
      maxCacheAge = 30 * 1000; // 30 seconds for final 15 minutes
    } else if (minutesUntilLaunch <= 60) {
      maxCacheAge = 2 * 60 * 1000; // 2 minutes for final hour
    } else if (minutesUntilLaunch <= 360) { // 6 hours
      maxCacheAge = 5 * 60 * 1000; // 5 minutes for final 6 hours
    } else {
      maxCacheAge = 30 * 60 * 1000; // 30 minutes otherwise
    }
    
    return cacheAge > maxCacheAge;
  }

  /**
   * Force clear all caches and reload fresh data
   */
  async forceClearCache(): Promise<void> {
    console.log('[LaunchDataService] Force clearing all caches');
    
    // Clear in-memory cache
    this.cache = {
      data: [],
      lastFetch: 0,
      nextScheduledUpdate: 0
    };
    
    // Clear database cache
    launchDatabase.clearCache();
    clearLaunchCache();
    
    // Force fresh API fetch
    await this.fetchLaunches();
    
    console.log('[LaunchDataService] Cache cleared and fresh data loaded');
  }
  
  /**
   * Fetch launches from Launch Library API with fallback to SpaceLaunchSchedule.com
   */
  private async fetchLaunches(): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    try {
      // Use our enhanced launch service that supports all Florida providers
      const launches = await fetchAllFloridaLaunches(30);
      
      // Enrich launches with FlightClub matching data
      const enrichedLaunches = await launchMatchingService.enrichLaunchesWithFlightClub(launches);

      // Detect schedule changes before storing new data
      const scheduleChanges = launchDelayDetectionService.detectScheduleChanges(enrichedLaunches);
      if (scheduleChanges.length > 0) {
        console.log(`[LaunchDataService] Detected ${scheduleChanges.length} schedule changes`);
      }
      
      // Store in database
      enrichedLaunches.forEach(launch => {
        launchDatabase.saveLaunch(launch, 'FlightClub Enhanced Service');
      });
      
      // Clean up old launches
      launchDatabase.cleanup();
      
      // Update cache
      this.cache = {
        data: enrichedLaunches,
        lastFetch: new Date().getTime(),
        nextScheduledUpdate: new Date().getTime() + (12 * 60 * 60 * 1000) // 12 hours default
      };
      
      // Notify subscribers
      this.notifySubscribers();
      
    } catch (error) {
      console.error('[LaunchDataService] Error fetching launches:', error);
      
      // Try to use database data if available
      const dbLaunches = launchDatabase.getAllLaunches();
      if (dbLaunches.length > 0) {
        this.cache.data = dbLaunches;
        this.notifySubscribers();
      } else {
        this.useEmergencyMockData();
      }
    } finally {
      this.isUpdating = false;
    }
  }
  
  
  /**
   * Use emergency mock data when API fails completely
   */
  private useEmergencyMockData(): void {
    // Create basic mock data for testing
    const mockLaunches: Launch[] = [
      {
        id: 'mock-starlink-1',
        name: 'Falcon 9 Block 5 | Starlink Group 10-50',
        rocket: {
          name: 'Falcon 9 Block 5',
          configuration: {
            launch_service_provider: {
              name: 'SpaceX'
            }
          }
        },
        launch_service_provider: {
          name: 'SpaceX'
        },
        mission: {
          name: 'Starlink Group 10-50',
          description: 'SpaceX Starlink internet satellites',
          orbit: {
            name: 'Low Earth Orbit'
          }
        },
        pad: {
          name: 'Launch Complex 39A',
          latitude: '28.608389',
          longitude: '-80.604333',
          location: {
            name: 'Kennedy Space Center, FL, USA',
            latitude: 28.608389,
            longitude: -80.604333
          }
        },
        net: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        window_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        window_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        status: {
          name: 'Go',
          abbrev: 'Go'
        },
        webcast_live: false
      }
    ];

    this.cache = {
      data: mockLaunches,
      lastFetch: Date.now(),
      nextScheduledUpdate: Date.now() + (12 * 60 * 60 * 1000)
    };

    this.notifySubscribers();
  }
  
  /**
   * Schedule dynamic updates for all launches
   */
  private scheduleLaunchUpdates(): void {
    const launchSchedule = this.cache.data.map(launch => ({
      id: launch.id,
      net: launch.net
    }));
    
    this.updateManager.scheduleAllLaunches(launchSchedule);
  }
  
  /**
   * Update specific launch data (called by scheduler)
   */
  private async updateLaunchData(launchId: string): Promise<void> {
    try {
      const response = await fetch(
        `https://ll.thespacedevs.com/2.2.0/launch/${launchId}/?format=json`
      );
      
      if (!response.ok) {
        throw new Error(`Launch Library API error: ${response.status}`);
      }
      
      const launchData = await response.json();
      
      // Update the specific launch in cache
      const launchIndex = this.cache.data.findIndex(l => l.id === launchId);
      if (launchIndex !== -1) {
        const updatedLaunch: Launch = {
          id: launchData.id,
          name: launchData.name,
          mission: {
            name: launchData.mission?.name || launchData.name,
            description: launchData.mission?.description || 'No description available',
            orbit: {
              name: launchData.mission?.orbit?.name || 'Unknown'
            }
          },
          rocket: {
            name: launchData.rocket?.configuration?.name || 'Unknown Rocket'
          },
          pad: {
            name: launchData.pad?.name || 'Unknown Pad',
            location: {
              name: launchData.pad?.location?.name || 'Unknown Location'
            }
          },
          net: launchData.net,
          window_start: launchData.window_start,
          window_end: launchData.window_end,
          status: {
            name: launchData.status?.name || 'Unknown',
            abbrev: launchData.status?.abbrev || 'UNK'
          },
          image: launchData.image,
          webcast_live: launchData.webcast_live
        };
        
        this.cache.data[launchIndex] = updatedLaunch;
        
        // Notify subscribers
        this.notifySubscribers();
      }
      
    } catch (error) {
      console.error(`Failed to update launch ${launchId}:`, error);
    }
  }
  
  /**
   * Start periodic background updates - DISABLED to prevent rate limiting
   * Only refresh when user manually requests or database indicates stale data
   */
  private startPeriodicUpdates(): void {
    // Load from database first, only fetch from API if database is empty
    this.loadFromDatabaseFirst();
  }
  
  /**
   * Load data from database first, only fetch from API when necessary
   */
  private async loadFromDatabaseFirst(): Promise<void> {
    const cachedLaunches = launchDatabase.getAllLaunches();
    
    if (cachedLaunches.length > 0) {
      this.cache.data = cachedLaunches;
      this.cache.lastFetch = Date.now();
      this.notifySubscribers();
      
      // Check if any launches need updating based on smart schedule
      const launchesNeedingUpdate = launchDatabase.getLaunchesNeedingUpdate();
      if (launchesNeedingUpdate.length > 0) {
        // Only update if user hasn't disabled auto-refresh
        await this.fetchLaunches();
      }
    } else {
      await this.fetchLaunches();
    }
  }
  
  /**
   * Get launch status information for monitoring
   */
  getLaunchStatuses(): LaunchStatus[] {
    const now = new Date().getTime();
    
    return this.cache.data.map(launch => {
      const launchTime = new Date(launch.net).getTime();
      const timeUntilLaunch = launchTime - now;
      const schedule = getRefreshInterval(timeUntilLaunch);
      const nextUpdate = this.updateManager.getTimeUntilNextUpdate(launch.id, launch.net);
      
      return {
        id: launch.id,
        name: launch.name,
        launchTime: launch.net,
        timeUntilLaunch,
        urgency: getUrgencyLevel(timeUntilLaunch),
        refreshPhase: schedule.phase,
        nextUpdate,
        lastUpdated: this.cache.lastFetch
      };
    });
  }
  
  /**
   * Force immediate update of all launches
   */
  async forceRefresh(): Promise<void> {
    // Clear the database to ensure fresh data
    launchDatabase.clear();
    
    // Clear in-memory cache
    this.cache = {
      data: [],
      lastFetch: 0,
      nextScheduledUpdate: 0
    };

    clearLaunchCache();
    
    // Fetch fresh data from API
    await this.fetchLaunches();
    
    // Notify all subscribers
    this.notifySubscribers();
  }
  
  /**
   * Force immediate update of specific launch
   */
  async forceUpdateLaunch(launchId: string): Promise<void> {
    await this.updateManager.forceUpdate(launchId);
  }
  
  // Duplicate function removed - using the simpler version above

  /**
   * Generate mission description based on mission name
   */
  private generateMissionDescription(missionName: string): string {
    if (missionName.includes('Starlink')) {
      return 'SpaceX Starlink satellite deployment to low Earth orbit for global internet coverage';
    }
    if (missionName.includes('Europa Clipper')) {
      return 'NASA mission to study Jupiter\'s moon Europa and its subsurface ocean';
    }
    if (missionName.includes('USSF')) {
      return 'US Space Force military satellite deployment mission';
    }
    if (missionName.includes('Dragon') || missionName.includes('CRS')) {
      return 'SpaceX Dragon cargo resupply mission to the International Space Station';
    }
    if (missionName.includes('Dream Chaser')) {
      return 'Sierra Space Dream Chaser cargo spacecraft mission to ISS';
    }
    return `${missionName} mission launching from Florida`;
  }

  /**
   * Get orbit type based on mission name
   */
  private getOrbitType(missionName: string): string {
    if (missionName.includes('Starlink')) return 'LEO';
    if (missionName.includes('Europa')) return 'Interplanetary';
    if (missionName.includes('USSF')) return 'GTO';
    if (missionName.includes('Dragon') || missionName.includes('CRS')) return 'LEO';
    if (missionName.includes('Dream Chaser')) return 'LEO';
    return 'LEO';
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.updateManager.clearAllSchedules();
    this.subscribers = [];
  }
}

// Export singleton instance
export const launchDataService = new LaunchDataService();
