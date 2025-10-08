import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  INotificationAdapter,
  NotificationPermission,
  NotificationOptions,
  ScheduledNotificationOptions
} from '@bermuda/shared';

const { SchedulableTriggerInputTypes } = Notifications;

export class MobileNotificationAdapter implements INotificationAdapter {
  constructor() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  async requestPermission(): Promise<NotificationPermission> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        return 'granted';
      } else if (finalStatus === 'denied') {
        return 'denied';
      } else {
        return 'default';
      }
    } catch (error) {
      console.error('[MobileNotificationAdapter] requestPermission error:', error);
      return 'denied';
    }
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === 'granted') {
        return 'granted';
      } else if (status === 'denied') {
        return 'denied';
      } else {
        return 'default';
      }
    } catch (error) {
      console.error('[MobileNotificationAdapter] getPermissionStatus error:', error);
      return 'denied';
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: options?.body || '',
          data: options?.data || {},
          sound: options?.sound === false ? undefined : (options?.sound || true),
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('[MobileNotificationAdapter] showNotification error:', error);
      throw error;
    }
  }

  async scheduleNotification(
    title: string,
    options: ScheduledNotificationOptions
  ): Promise<string> {
    try {
      const trigger = options.trigger;
      const triggerInput = trigger instanceof Date
        ? ({ type: SchedulableTriggerInputTypes.DATE, date: trigger } as const)
        : ({ type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: trigger.seconds } as const);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: options.body || '',
          data: options.data || {},
          sound: options.sound === false ? undefined : (options.sound || true),
        },
        trigger: triggerInput as any, // Type assertion needed due to Expo types complexity
      });

      return notificationId;
    } catch (error) {
      console.error('[MobileNotificationAdapter] scheduleNotification error:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('[MobileNotificationAdapter] cancelNotification error:', error);
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[MobileNotificationAdapter] cancelAllNotifications error:', error);
      throw error;
    }
  }

  onNotificationReceived(handler: (notification: any) => void): void {
    Notifications.addNotificationReceivedListener(handler);
  }

  onNotificationTapped(handler: (notification: any) => void): void {
    Notifications.addNotificationResponseReceivedListener((response) => {
      handler(response.notification);
    });
  }
}
