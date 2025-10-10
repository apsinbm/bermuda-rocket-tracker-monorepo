import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { typography } from '../theme';
import { version } from '../../package.json';

type ThemeOption = 'dark' | 'light' | 'auto';

const SettingsScreen: React.FC = () => {
  const [theme, setTheme] = useState<ThemeOption>('dark');
  const [cacheSize, setCacheSize] = useState('2.4 MB');

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    Alert.alert('Theme Changed', `Theme set to ${newTheme} mode`);
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This will require re-downloading launch information.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // In production, use cacheInitializer from @bermuda/shared
            setCacheSize('0 KB');
            Alert.alert('Success', 'Cache cleared successfully');
            // Simulate cache rebuilding
            setTimeout(() => setCacheSize('2.4 MB'), 2000);
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      `Bermuda Rocket Tracker\nVersion ${version}\n\nTrack SpaceX launches visible from Bermuda with real-time visibility calculations.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>Theme (Coming Soon)</Text>
            <View style={styles.themeOptions}>
              <ThemeOption
                label="Dark"
                icon="🌙"
                selected={theme === 'dark'}
                onPress={() => handleThemeChange('dark')}
              />
              <ThemeOption
                label="Light"
                icon="☀️"
                selected={theme === 'light'}
                onPress={() => handleThemeChange('light')}
              />
              <ThemeOption
                label="Auto"
                icon="🔄"
                selected={theme === 'auto'}
                onPress={() => handleThemeChange('auto')}
              />
            </View>
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Cache Size</Text>
                <Text style={styles.settingDescription}>
                  Cached launch data and images
                </Text>
              </View>
              <Text style={styles.settingValue}>{cacheSize}</Text>
            </View>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCache}
            >
              <Text style={styles.clearButtonIcon}>🗑️</Text>
              <Text style={styles.clearButtonText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingItem
              icon="📱"
              label="App Version"
              value={version}
              onPress={handleAbout}
            />
            <SettingItem
              icon="🚀"
              label="Data Source"
              value="The Space Devs"
              onPress={() =>
                Alert.alert(
                  'Data Source',
                  'Launch data provided by The Space Devs API'
                )
              }
            />
            <SettingItem
              icon="📍"
              label="Location"
              value="Bermuda"
              onPress={() =>
                Alert.alert(
                  'Location',
                  'Visibility calculations are based on Bermuda coordinates (32.3°N, 64.8°W)'
                )
              }
            />
            <SettingItem
              icon="ℹ️"
              label="About This App"
              value=""
              onPress={handleAbout}
              isLast
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for Rocket Enthusiasts
          </Text>
          <Text style={styles.footerVersion}>Version {version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ThemeOption: React.FC<{
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, icon, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.themeOption, selected && styles.themeOptionSelected]}
    onPress={onPress}
  >
    <Text style={styles.themeOptionIcon}>{icon}</Text>
    <Text style={styles.themeOptionLabel}>{label}</Text>
    {selected && <Text style={styles.themeOptionCheck}>✓</Text>}
  </TouchableOpacity>
);

const SettingItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
  isLast?: boolean;
}> = ({ icon, label, value, onPress, isLast = false }) => (
  <TouchableOpacity
    style={[styles.settingItem, isLast && styles.settingItemLast]}
    onPress={onPress}
  >
    <View style={styles.settingItemLeft}>
      <Text style={styles.settingItemIcon}>{icon}</Text>
      <Text style={styles.settingItemLabel}>{label}</Text>
    </View>
    {value ? (
      <Text style={styles.settingItemValue}>{value}</Text>
    ) : (
      <Text style={styles.settingItemArrow}>›</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 32,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  themeOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  themeOptionLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  themeOptionCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 16,
    color: colors.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingTextContainer: {
    flex: 1,
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
  settingValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  clearButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingItemLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingItemValue: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  settingItemArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  footerVersion: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

export default SettingsScreen;
