/**
 * Root Layout
 *
 * Main entry point for the Expo Router navigation.
 *
 * Quran.com. All rights reserved.
 */

import 'react-native-reanimated';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppContainer } from '@/src/app-core';
import { useTheme } from '@/src/ui/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Root navigation layout.
 */
function RootNavigation() {
  const theme = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.systemBackground },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="quran" options={{ headerShown: false }} />
        <Stack.Screen name="translation-verse" options={{ presentation: 'modal' }} />
        <Stack.Screen name="translations" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reading-selector" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reciter-list" options={{ presentation: 'modal' }} />
        <Stack.Screen name="audio-downloads" options={{ presentation: 'modal' }} />
        <Stack.Screen name="advanced-audio" options={{ presentation: 'modal' }} />
        <Stack.Screen name="note-editor" options={{ presentation: 'modal' }} />
        <Stack.Screen name="diagnostics" options={{ presentation: 'modal' }} />
        <Stack.Screen name="whats-new" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

/**
 * Root layout component.
 */
export default function RootLayout() {
  return (
    <AppContainer>
      <RootNavigation />
    </AppContainer>
  );
}
