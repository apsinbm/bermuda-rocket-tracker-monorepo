import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme';
import { Launch } from '@bermuda/shared';

// Screens
import LaunchListScreen from '../screens/LaunchListScreen';
import LaunchDetailScreen from '../screens/LaunchDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  LaunchDetail: { launch: Launch };
};

export type TabParamList = {
  Launches: undefined;
  Notifications: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: styles.header,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: styles.headerTitle,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Launches"
        component={LaunchListScreen}
        options={{
          title: 'Rocket Launches',
          tabBarIcon: ({ color }) => <TabIcon icon="🚀" color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <TabIcon icon="🔔" color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const TabIcon = ({ icon, color }: { icon: string; color: string }) => (
  <Text style={{ fontSize: 24, color }}>{icon}</Text>
);

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: styles.header,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: styles.headerTitle,
        contentStyle: styles.card,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LaunchDetail"
        component={LaunchDetailScreen}
        options={{
          title: 'Launch Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 64,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
