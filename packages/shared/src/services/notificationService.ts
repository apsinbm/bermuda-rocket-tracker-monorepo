/**
 * Notification Service for Bermuda Rocket Tracker
 * Handles notifications for upcoming visible launches using platform adapters
 */

import { LaunchWithVisibility } from '../types';
import { PlatformContainer } from '../platform/PlatformContainer';
import { PLATFORM_TOKENS } from '../platform/PlatformContainer';
import type { IStorageAdapter } from '../adapters/storage';
import type { INotificationAdapter } from '../adapters/notifications';

export interface NotificationSettings {
  enabled: boolean;
  highVisibilityOnly: boolean;
  reminderTimes: number[]; // minutes before launch
  soundEnabled: boolean;
}

export interface NotificationStatus {
  permission: NotificationPermission;
  supported: boolean;
  settings: NotificationSettings;
}

export class NotificationService {
  private settings: NotificationSettings;
  private scheduledNotifications: Map<string, string[]> = new Map();
  private subscribers: Array<(status: NotificationStatus) => void> = [];
  private readonly SETTINGS_KEY = 'bermuda-rocket-notifications';

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettingsAsync();
  }

  private getStorage(): IStorageAdapter {
    return PlatformContainer.get<IStorageAdapter>(PLATFORM_TOKENS.STORAGE);
  }

  private getNotifications(): INotificationAdapter {
    return PlatformContainer.get<INotificationAdapter>(PLATFORM_TOKENS.NOTIFICATIONS);
  }

  /**
   * Load notification settings asynchronously
   */
  private async loadSettingsAsync(): Promise<void> {
    try {
      const storage = this.getStorage();
      const saved = await storage.getItem(this.SETTINGS_KEY);
      if (saved) {
        this.settings = { ...this.getDefaultSettings(), ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
    }
  }

  /**
   * Get default notification settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: false,
      highVisibilityOnly: true,
      reminderTimes: [60, 15, 5], // 1 hour, 15 minutes, 5 minutes before
      soundEnabled: true
    };
  }

  /**
   * Save notification settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      const storage = this.getStorage();
      await storage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return true; // Platform adapter will handle support
  }

  /**
   * Get current notification permission status
   */
  async getPermission(): Promise<NotificationPermission> {
    try {
      const notifications = this.getNotifications();
      return await notifications.getPermissionStatus();
    } catch (error) {
      console.error('Failed to get notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      const notifications = this.getNotifications();
      const permission = await notifications.requestPermission();
      this.notifySubscribers();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Get current notification status
   */
  async getStatus(): Promise<NotificationStatus> {
    return {
      permission: await this.getPermission(),
      supported: this.isSupported(),
      settings: { ...this.settings }
    };
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };

    // If enabling notifications, request permission
    const permission = await this.getPermission();
    if (newSettings.enabled && permission === 'default') {
      const newPermission = await this.requestPermission();
      if (newPermission !== 'granted') {
        this.settings.enabled = false;
      }
    }

    await this.saveSettings();
  }

  /**
   * Schedule notifications for launches
   */
  async scheduleNotifications(launches: LaunchWithVisibility[]): Promise<void> {
    // Clear existing notifications
    await this.clearAllNotifications();

    const permission = await this.getPermission();
    if (!this.settings.enabled || permission !== 'granted') {
      return;
    }

    const now = new Date().getTime();

    for (const launch of launches) {
      // Skip if not visible enough
      if (this.settings.highVisibilityOnly && launch.visibility.likelihood !== 'high' && launch.visibility.likelihood !== 'medium') {
        continue;
      }

      const launchTime = new Date(launch.net).getTime();
      const timeUntilLaunch = launchTime - now;

      // Skip past launches
      if (timeUntilLaunch <= 0) {
        continue;
      }

      const notificationIds: string[] = [];

      // Schedule reminder notifications
      for (const minutesBefore of this.settings.reminderTimes) {
        const reminderTime = launchTime - (minutesBefore * 60 * 1000);
        const timeUntilReminder = reminderTime - now;

        if (timeUntilReminder > 0) {
          const notificationId = await this.showNotification(launch, minutesBefore, timeUntilReminder);
          if (notificationId) {
            notificationIds.push(notificationId);
          }
        }
      }

      // Schedule launch notification
      if (timeUntilLaunch > 0 && timeUntilLaunch <= 2 * 60 * 1000) { // Within 2 minutes
        const notificationId = await this.showLaunchNotification(launch, timeUntilLaunch);
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }

      if (notificationIds.length > 0) {
        this.scheduledNotifications.set(launch.id, notificationIds);
      }
    }
  }

  /**
   * Show reminder notification
   */
  private async showNotification(launch: LaunchWithVisibility, minutesBefore: number, delayMs: number): Promise<string | null> {
    try {
      const permission = await this.getPermission();
      if (!this.settings.enabled || permission !== 'granted') {
        return null;
      }

      const timeText = minutesBefore >= 60
        ? `${Math.floor(minutesBefore / 60)} hour${Math.floor(minutesBefore / 60) > 1 ? 's' : ''}`
        : `${minutesBefore} minute${minutesBefore > 1 ? 's' : ''}`;

      const notifications = this.getNotifications();

      const notificationId = await notifications.scheduleNotification(
        `🚀 Launch Reminder`,
        {
          body: `${launch.name} launches in ${timeText} and is ${launch.visibility.likelihood === 'high' ? 'likely' : 'possibly'} visible from Bermuda!`,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: `launch-reminder-${launch.id}-${minutesBefore}`,
          requireInteraction: minutesBefore <= 15,
          sound: this.settings.soundEnabled,
          data: {
            launchId: launch.id,
            type: 'reminder',
            minutesBefore
          },
          trigger: { seconds: delayMs / 1000 }
        }
      );

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Show launch notification (at launch time)
   */
  private async showLaunchNotification(launch: LaunchWithVisibility, delayMs: number): Promise<string | null> {
    try {
      const permission = await this.getPermission();
      if (!this.settings.enabled || permission !== 'granted') {
        return null;
      }

      const notifications = this.getNotifications();

      const notificationId = await notifications.scheduleNotification(
        `🚀 Launch Now!`,
        {
          body: `${launch.name} is launching now! Look ${launch.visibility.bearing ? this.getBearingDirection(launch.visibility.bearing) : 'toward the sky'} for the best view.`,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: `launch-now-${launch.id}`,
          requireInteraction: true,
          sound: this.settings.soundEnabled,
          priority: 'high',
          data: {
            launchId: launch.id,
            type: 'launch',
            livestreamUrl: launch.livestream_url
          },
          trigger: { seconds: delayMs / 1000 }
        }
      );

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule launch notification:', error);
      return null;
    }
  }

  /**
   * Get bearing direction text
   */
  private getBearingDirection(bearing: number): string {
    const directions = [
      'North', 'NNE', 'NE', 'ENE', 'East', 'ESE', 'SE', 'SSE',
      'South', 'SSW', 'SW', 'WSW', 'West', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  }

  /**
   * Clear all scheduled notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      const notifications = this.getNotifications();
      await notifications.cancelAllNotifications();
      this.scheduledNotifications.clear();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  /**
   * Clear notifications for specific launch
   */
  async clearNotifications(launchId: string): Promise<void> {
    try {
      const notificationIds = this.scheduledNotifications.get(launchId);
      if (notificationIds) {
        const notifications = this.getNotifications();
        for (const id of notificationIds) {
          await notifications.cancelNotification(id);
        }
        this.scheduledNotifications.delete(launchId);
      }
    } catch (error) {
      console.error('Failed to clear notifications for launch:', error);
    }
  }

  /**
   * Subscribe to status changes
   */
  subscribe(callback: (status: NotificationStatus) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify subscribers of status changes
   */
  private async notifySubscribers(): Promise<void> {
    const status = await this.getStatus();
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });
  }

  /**
   * Test notification (for user to verify it works)
   */
  async testNotification(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Notifications not supported');
    }

    const permission = await this.getPermission();
    if (permission !== 'granted') {
      const newPermission = await this.requestPermission();
      if (newPermission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    try {
      const notifications = this.getNotifications();
      await notifications.showNotification('🚀 Test Notification', {
        body: 'Notifications are working! You\'ll be notified of upcoming visible launches.',
        icon: '/logo192.png',
        tag: 'test-notification',
        sound: this.settings.soundEnabled
      });

      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      throw error;
    }
  }

  /**
   * Get scheduled notification count
   */
  getScheduledCount(): number {
    return this.scheduledNotifications.size;
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.clearAllNotifications();
    this.subscribers = [];
  }
}

// Export singleton instance
export const notificationService = new NotificationService();