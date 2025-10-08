/**
 * Dependency Injection Container for Platform Services
 *
 * This container allows platform-specific implementations to be injected
 * at runtime, enabling the same business logic to run on web and mobile.
 *
 * Usage:
 * 1. Register implementations at app startup:
 *    PlatformContainer.register(PLATFORM_TOKENS.STORAGE, new WebStorageAdapter());
 *
 * 2. Retrieve implementations in services:
 *    const storage = PlatformContainer.get<IStorageAdapter>(PLATFORM_TOKENS.STORAGE);
 */

export class PlatformContainer {
  private static services = new Map<string, any>();
  private static initialized = false;

  /**
   * Register a platform service implementation
   */
  static register<T>(token: string, implementation: T): void {
    if (this.services.has(token)) {
      console.warn(`[PlatformContainer] Overwriting existing service: ${token}`);
    }
    this.services.set(token, implementation);
  }

  /**
   * Retrieve a platform service implementation
   * Throws error if service not registered
   */
  static get<T>(token: string): T {
    if (!this.services.has(token)) {
      throw new Error(
        `[PlatformContainer] Service not registered: ${token}. ` +
        `Did you forget to call PlatformContainer.register('${token}', implementation) at app startup?`
      );
    }
    return this.services.get(token) as T;
  }

  /**
   * Check if a service is registered
   */
  static has(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Clear all registered services (useful for testing)
   */
  static clear(): void {
    this.services.clear();
    this.initialized = false;
  }

  /**
   * Mark container as initialized (prevents accidental re-registration)
   */
  static markInitialized(): void {
    this.initialized = true;
  }

  /**
   * Check if container is initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get all registered service tokens (useful for debugging)
   */
  static getRegisteredTokens(): string[] {
    return Array.from(this.services.keys());
  }
}

/**
 * Platform Service Tokens
 *
 * These tokens are used to register and retrieve platform implementations
 */
export const PLATFORM_TOKENS = {
  /** Storage adapter (localStorage on web, AsyncStorage on mobile) */
  STORAGE: 'platform:storage',

  /** Cache adapter (IndexedDB on web, SQLite/Realm on mobile) */
  CACHE: 'platform:cache',

  /** Notification adapter (Web Push on web, Expo Notifications on mobile) */
  NOTIFICATIONS: 'platform:notifications',

  /** Network adapter (fetch with offline queue) */
  NETWORK: 'platform:network',

  /** Background task adapter (Service Worker on web, BackgroundFetch on mobile) */
  BACKGROUND_TASKS: 'platform:backgroundTasks',

  /** Location adapter (Geolocation API on web, expo-location on mobile) */
  LOCATION: 'platform:location',

  /** Device info adapter (navigator on web, expo-device on mobile) */
  DEVICE_INFO: 'platform:deviceInfo',
} as const;

/**
 * Type-safe token type
 */
export type PlatformToken = typeof PLATFORM_TOKENS[keyof typeof PLATFORM_TOKENS];
