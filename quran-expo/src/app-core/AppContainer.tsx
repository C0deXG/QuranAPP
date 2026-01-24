/**
 * AppContainer.tsx
 *
 * Main application container that provides the dependency injection context
 * and wraps the entire app with required providers.
 *
 * 1:1 translation of iOS app structure.
 *
 * Quran.com. All rights reserved.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../ui/theme';
import { initializeLocalization } from '../core/localization';
import { logger } from '../core/logging';
import type { AppDependencies } from '../features/app-dependencies';
import { createAppDependencies } from './create-app-dependencies';
import { setupDatabases } from '../data/database-setup';

// ============================================================================
// Context
// ============================================================================

/**
 * Context for the app dependencies.
 */
export const AppDependenciesContext = createContext<AppDependencies | null>(null);

/**
 * Hook to access app dependencies.
 */
export function useAppDependencies(): AppDependencies {
  const deps = useContext(AppDependenciesContext);
  if (!deps) {
    throw new Error('useAppDependencies must be used within an AppContainer');
  }
  return deps;
}

// ============================================================================
// Query Client
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

// ============================================================================
// AppContainer
// ============================================================================

interface AppContainerProps {
  children: React.ReactNode;
}

/**
 * Main application container component.
 * Sets up all providers and initializes the app.
 */
export function AppContainer({ children }: AppContainerProps) {
  const [isReady, setIsReady] = useState(false);
  const [dependencies, setDependencies] = useState<AppDependencies | null>(null);

  // Initialize the app
  useEffect(() => {
    async function initialize() {
      try {
        logger.info('Initializing app...');

        // Keep splash screen visible while initializing
        await SplashScreen.preventAutoHideAsync();

        // Initialize localization
        await initializeLocalization();
        logger.info('Localization initialized');

        // Setup databases
        await setupDatabases();
        logger.info('Databases set up');

        // Create app dependencies
        const deps = await createAppDependencies();
        setDependencies(deps);
        logger.info('App dependencies created');

        // Mark as ready
        setIsReady(true);

        // Hide splash screen
        await SplashScreen.hideAsync();
        logger.info('App initialization complete');
      } catch (error) {
        logger.error('Failed to initialize app:', error);
        // Still mark as ready to show error UI
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    initialize();
  }, []);

  if (!isReady || !dependencies) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppDependenciesContext.Provider value={dependencies}>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AppDependenciesContext.Provider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

