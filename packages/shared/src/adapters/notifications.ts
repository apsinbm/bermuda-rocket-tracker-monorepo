/**
 * Notification Adapter Interface
 *
 * Provides a platform-agnostic interface for push notifications.
 * - Web: Implemented using Web Notification API
 * - Mobile: Implemented using Expo Notifications
 */

export type NotificationPermission = 'granted' | 'denied' | 'default';

export interface NotificationOptions {
  /** Notification body text */
  body: string;

  /** Notification icon URL */
  icon?: string;

  /** Notification badge (mobile) */
  badge?: string;

  /** Unique tag to prevent duplicates */
  tag?: string;

  /** Data payload to attach to notification */
  data?: any;

  /** Require user interaction to dismiss (mobile) */
  requireInteraction?: boolean;

  /** Sound to play (mobile) */
  sound?: boolean | string;

  /** Vibration pattern (mobile) */
  vibrate?: number[];

  /** Priority level */
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
}

export interface ScheduledNotificationOptions extends NotificationOptions {
  /** Time to trigger notification */
  trigger: Date | { seconds: number };
}

export interface INotificationAdapter {
  /**
   * Request permission to show notifications
   * @returns Permission status after request
   */
  requestPermission(): Promise<NotificationPermission>;

  /**
   * Get current permission status
   */
  getPermissionStatus(): Promise<NotificationPermission>;

  /**
   * Show an immediate notification
   * @param title Notification title
   * @param options Notification options
   * @returns Notification ID
   */
  showNotification(title: string, options?: NotificationOptions): Promise<string>;

  /**
   * Schedule a notification for later
   * @param title Notification title
   * @param options Notification options with trigger time
   * @returns Notification ID
   */
  scheduleNotification(
    title: string,
    options: ScheduledNotificationOptions
  ): Promise<string>;

  /**
   * Cancel a scheduled notification
   * @param notificationId ID returned from scheduleNotification
   */
  cancelNotification(notificationId: string): Promise<void>;

  /**
   * Cancel all scheduled notifications
   */
  cancelAllNotifications(): Promise<void>;

  /**
   * Get all scheduled notifications
   */
  getAllScheduledNotifications?(): Promise<Array<{
    id: string;
    title: string;
    body: string;
    trigger: Date;
  }>>;

  /**
   * Set up notification received handler
   * @param handler Function to call when notification is received
   */
  onNotificationReceived?(handler: (notification: any) => void): void;

  /**
   * Set up notification tapped handler
   * @param handler Function to call when notification is tapped
   */
  onNotificationTapped?(handler: (notification: any) => void): void;
}

/**
 * Helper functions for notification operations
 */
export class NotificationHelper {
  /**
   * Format time remaining for notification message
   */
  static formatTimeRemaining(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }

  /**
   * Calculate trigger time for notification
   */
  static calculateTriggerTime(targetTime: Date, minutesBefore: number): Date {
    const triggerTime = new Date(targetTime);
    triggerTime.setMinutes(triggerTime.getMinutes() - minutesBefore);
    return triggerTime;
  }

  /**
   * Check if notification time has passed
   */
  static isPastTriggerTime(targetTime: Date, minutesBefore: number): boolean {
    const trigger = this.calculateTriggerTime(targetTime, minutesBefore);
    return trigger.getTime() < Date.now();
  }

  /**
   * Get default notification tag for a launch
   */
  static getLaunchNotificationTag(launchId: string, minutesBefore: number): string {
    return `launch-${launchId}-${minutesBefore}m`;
  }
}
