/**
 * Web Platform Initialization
 *
 * This file initializes platform-specific adapters for the web application.
 * Must be called before any services are used.
 */

import { PlatformContainer, PLATFORM_TOKENS } from '@bermuda/shared';
import { WebStorageAdapter } from './adapters/WebStorageAdapter';
import { WebNotificationAdapter } from './adapters/WebNotificationAdapter';

let initialized = false;

export function initializePlatform(): void {
  if (initialized) {
    console.warn('[Platform Init] Already initialized, skipping');
    return;
  }

  console.log('[Platform Init] Initializing web platform adapters...');

  try {
    // Register storage adapter
    PlatformContainer.register(
      PLATFORM_TOKENS.STORAGE,
      new WebStorageAdapter()
    );

    // Register notification adapter
    PlatformContainer.register(
      PLATFORM_TOKENS.NOTIFICATIONS,
      new WebNotificationAdapter()
    );

    // Mark as initialized
    PlatformContainer.markInitialized();
    initialized = true;

    console.log('[Platform Init] ✅ Web platform initialized successfully');
    console.log('[Platform Init] Registered services:', PlatformContainer.getRegisteredTokens());
  } catch (error) {
    console.error('[Platform Init] ❌ Failed to initialize platform:', error);
    throw error;
  }
}

/**
 * Check if platform is initialized
 */
export function isPlatformInitialized(): boolean {
  return initialized;
}
