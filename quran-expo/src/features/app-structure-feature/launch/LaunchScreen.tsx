/**
 * LaunchScreen.tsx
 *
 * React component for the app launch screen.
 * Handles showing migration progress or the main app.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { AppDependencies } from '../../app-dependencies';
import { LaunchBuilder } from './launch-builder';
import { LaunchStartup, LaunchState, LaunchStateData, LaunchStartupListener } from './launch-startup';
import { MigrationScreen } from '../../app-migration-feature';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for LaunchScreen.
 */
export interface LaunchScreenProps {
  /** The app dependencies container */
  container: AppDependencies;
  /** The main app component to render when ready */
  AppComponent: React.ComponentType<{ container: AppDependencies }>;
}

// ============================================================================
// LaunchScreen Component
// ============================================================================

/**
 * Launch screen component.
 *
 * This component orchestrates the app launch:
 * 1. Shows splash/loading while checking migrations
 * 2. Shows migration screen if a blocking migration is needed
 * 3. Shows the main app when ready
 */
export function LaunchScreen({ container, AppComponent }: LaunchScreenProps) {
  const [launchState, setLaunchState] = useState<LaunchStateData>({ state: LaunchState.initial });
  const [launchStartup, setLaunchStartup] = useState<LaunchStartup | null>(null);

  // Initialize launch startup
  useEffect(() => {
    const builder = new LaunchBuilder(container);
    const startup = builder.launchStartup();
    setLaunchStartup(startup);

    // Add listener for state changes
    const listener: LaunchStartupListener = {
      onStateChange: (state) => {
        setLaunchState(state);
      },
    };
    startup.addListener(listener);

    // Start the launch process
    startup.launch();

    // Cleanup
    return () => {
      startup.removeListener(listener);
    };
  }, [container]);

  // Render based on state
  switch (launchState.state) {
    case LaunchState.initial:
    case LaunchState.checkingMigration:
      // Show loading/splash screen
      return (
        <View style={styles.container}>
          {/* The splash screen is handled by expo-splash-screen */}
        </View>
      );

    case LaunchState.migrating:
      // Show migration screen with progress
      return <MigrationScreen titles={launchState.titles} />;

    case LaunchState.ready:
      // Show the main app
      return <AppComponent container={container} />;
  }
}

// ============================================================================
// useLaunchStartup Hook
// ============================================================================

/**
 * Hook to manage the launch startup process.
 */
export function useLaunchStartup(container: AppDependencies): {
  state: LaunchStateData;
  startup: LaunchStartup | null;
} {
  const [state, setState] = useState<LaunchStateData>({ state: LaunchState.initial });
  const [startup, setStartup] = useState<LaunchStartup | null>(null);

  useEffect(() => {
    const builder = new LaunchBuilder(container);
    const launchStartup = builder.launchStartup();
    setStartup(launchStartup);

    const listener: LaunchStartupListener = {
      onStateChange: setState,
    };
    launchStartup.addListener(listener);
    launchStartup.launch();

    return () => {
      launchStartup.removeListener(listener);
    };
  }, [container]);

  return { state, startup };
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

