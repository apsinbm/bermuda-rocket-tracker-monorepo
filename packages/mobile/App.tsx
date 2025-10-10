import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';
import { clearLaunchCache } from '@bermuda/shared';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Platform adapters are initialized in index.ts before this file is imported

export default function App() {
  // Clear launch cache on app startup to ensure fresh data
  useEffect(() => {
    clearLaunchCache();
  }, []);

  return (
    <ErrorBoundary>
      <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
        <AppNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
