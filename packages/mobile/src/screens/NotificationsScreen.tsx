import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors } from '../theme';
import { typography } from '../theme';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const NotificationsScreen: React.FC = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'delay_alerts',
      label: 'Launch Delay Alerts',
      description: 'Get notified when a launch is delayed',
      enabled: true,
    },
    {
      id: '2h_before',
      label: '2 Hours Before Launch',
      description: 'Reminder 2 hours before scheduled launch',
      enabled: true,
    },
    {
      id: '1h_before',
      label: '1 Hour Before Launch',
      description: 'Reminder 1 hour before scheduled launch',
      enabled: true,
    },
    {
      id: '30m_before',
      label: '30 Minutes Before Launch',
      description: 'Final reminder 30 minutes before launch',
      enabled: true,
    },
  ]);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    // In production, use notificationService from @bermuda/shared
    // For now, simulate permission check
    setPermissionGranted(true);
  };

  const requestPermission = async () => {
    Alert.alert(
      'Enable Notifications',
      'Allow Bermuda Rocket Tracker to send you notifications about upcoming launches?',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Allow',
          onPress: () => {
            setPermissionGranted(true);
            Alert.alert('Success', 'Notifications enabled successfully!');
          },
        },
      ]
    );
  };

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const sendTestNotification = () => {
    if (!permissionGranted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications first',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Test Notification',
      '🚀 Launch in 30 minutes!\nFalcon 9 • Starlink Mission\nLook Northeast for best visibility',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Permission Status */}
        <View style={styles.section}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionEmoji}>
                {permissionGranted ? '✅' : '🔕'}
              </Text>
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionTitle}>
                  {permissionGranted
                    ? 'Notifications Enabled'
                    : 'Notifications Disabled'}
                </Text>
                <Text style={styles.permissionDescription}>
                  {permissionGranted
                    ? 'You will receive launch alerts'
                    : 'Enable to receive launch alerts'}
                </Text>
              </View>
            </View>
            {!permissionGranted && (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={requestPermission}
              >
                <Text style={styles.enableButtonText}>Enable Notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notification Settings */}
        {permissionGranted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
            <View style={styles.settingsCard}>
              {settings.map((setting, index) => (
                <View
                  key={setting.id}
                  style={[
                    styles.settingRow,
                    index === settings.length - 1 && styles.settingRowLast,
                  ]}
                >
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>{setting.label}</Text>
                    <Text style={styles.settingDescription}>
                      {setting.description}
                    </Text>
                  </View>
                  <Switch
                    value={setting.enabled}
                    onValueChange={() => toggleSetting(setting.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.textPrimary}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Test Notification */}
        {permissionGranted && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={sendTestNotification}
            >
              <Text style={styles.testButtonIcon}>🧪</Text>
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Notifications are sent based on your device's local time. Make sure
              your timezone is set correctly for accurate alerts.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  permissionDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  enableButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  enableButtonText: {
    ...typography.subtitle,
    color: colors.background,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  testButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  testButtonText: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});

export default NotificationsScreen;
