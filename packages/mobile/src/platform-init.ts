import { PlatformContainer, PLATFORM_TOKENS } from '@bermuda/shared';
import { MobileStorageAdapter } from './adapters/MobileStorageAdapter';
import { MobileNotificationAdapter } from './adapters/MobileNotificationAdapter';

export function initializePlatform(): void {
  console.log('[Platform Init] Initializing mobile platform adapters...');

  PlatformContainer.register(PLATFORM_TOKENS.STORAGE, new MobileStorageAdapter());
  PlatformContainer.register(PLATFORM_TOKENS.NOTIFICATIONS, new MobileNotificationAdapter());

  PlatformContainer.markInitialized();

  console.log('[Platform Init] ✅ Mobile platform initialized successfully');
}
