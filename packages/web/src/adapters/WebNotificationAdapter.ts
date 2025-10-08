import {
  INotificationAdapter,
  NotificationOptions,
  NotificationPermission,
  ScheduledNotificationOptions,
} from '@bermuda/shared';

/**
 * Web Notification Adapter
 *
 * Implements INotificationAdapter using browser Notification API.
 * Note: Browser notifications have limited scheduling capabilities compared to native mobile.
 */
export class WebNotificationAdapter implements INotificationAdapter {
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();
  private notificationId = 0;

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[WebNotificationAdapter] Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    return Notification.permission as NotificationPermission;
  }

  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<string> {
    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      throw new Error('[WebNotificationAdapter] Permission not granted');
    }

    const notificationId = `web-notif-${++this.notificationId}`;

    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon,
      badge: options?.badge,
      tag: options?.tag || notificationId,
      data: options?.data,
      requireInteraction: options?.requireInteraction,
    });

    // Auto-close after 10 seconds unless requireInteraction is true
    if (!options?.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }

    return notificationId;
  }

  async scheduleNotification(
    title: string,
    options: ScheduledNotificationOptions
  ): Promise<string> {
    const notificationId = `web-scheduled-${++this.notificationId}`;

    // Calculate delay
    const triggerTime =
      options.trigger instanceof Date
        ? options.trigger.getTime()
        : Date.now() + options.trigger.seconds * 1000;

    const delay = triggerTime - Date.now();

    if (delay < 0) {
      console.warn('[WebNotificationAdapter] Trigger time is in the past');
      return notificationId;
    }

    // Schedule notification using setTimeout
    const timeout = setTimeout(() => {
      this.showNotification(title, options).catch(error => {
        console.error('[WebNotificationAdapter] Failed to show scheduled notification:', error);
      });
      this.scheduledNotifications.delete(notificationId);
    }, delay);

    this.scheduledNotifications.set(notificationId, timeout);

    return notificationId;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    const timeout = this.scheduledNotifications.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledNotifications.delete(notificationId);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    this.scheduledNotifications.forEach(timeout => clearTimeout(timeout));
    this.scheduledNotifications.clear();
  }

  async getAllScheduledNotifications(): Promise<Array<{
    id: string;
    title: string;
    body: string;
    trigger: Date;
  }>> {
    // Web API doesn't provide a way to list scheduled notifications
    // This would require keeping additional metadata
    console.warn('[WebNotificationAdapter] getAllScheduledNotifications not fully implemented');
    return [];
  }

  onNotificationReceived(handler: (notification: any) => void): void {
    // Web API doesn't have a global received handler
    // This would need Service Worker implementation
    console.warn('[WebNotificationAdapter] onNotificationReceived requires Service Worker');
  }

  onNotificationTapped(handler: (notification: any) => void): void {
    // This would need Service Worker implementation for reliable handling
    console.warn('[WebNotificationAdapter] onNotificationTapped requires Service Worker');
  }
}
