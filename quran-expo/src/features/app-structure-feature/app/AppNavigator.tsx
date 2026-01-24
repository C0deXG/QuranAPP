/**
 * AppViewController.swift → AppNavigator.tsx
 *
 * Main app tab navigator component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { AnalyticsLibrary } from '../../../core/analytics';
import type { AppDependencies } from '../../app-dependencies';
import { AppInteractor } from './app-interactor';
import {
  HomeTabBuilder,
  BookmarksTabBuilder,
  NotesTabBuilder,
  SearchTabBuilder,
  SettingsTabBuilder,
} from '../tabs';
import { useTheme } from '../../../ui/theme';

// ============================================================================
// Types
// ============================================================================

/**
 * Tab screen configuration.
 */
interface TabScreenConfig {
  name: string;
  component: React.ComponentType<any>;
  options: {
    tabBarLabel: string;
    tabBarIcon: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  };
}

/**
 * Props for AppNavigator.
 */
export interface AppNavigatorProps {
  /** The app dependencies container */
  container: AppDependencies;
  /** Callback when the app is ready */
  onReady?: () => void;
  /** Screen components for each tab */
  screens: {
    Home: React.ComponentType<any>;
    Notes: React.ComponentType<any>;
    Bookmarks: React.ComponentType<any>;
    Search: React.ComponentType<any>;
    Settings: React.ComponentType<any>;
  };
}

// ============================================================================
// Tab Navigator
// ============================================================================

const Tab = createBottomTabNavigator();

/**
 * Main app tab navigator.
 *
 * This is the React Native equivalent of AppViewController (UITabBarController).
 * It sets up the bottom tab bar with all 5 main tabs.
 */
export function AppNavigator({
  container,
  onReady,
  screens,
}: AppNavigatorProps) {
  const theme = useTheme();
  const [interactor] = useState(() => createAppInteractor(container));

  // Start the interactor when mounted
  useEffect(() => {
    interactor.start();
    onReady?.();
  }, [interactor, onReady]);

  // Get tab bar icon
  const getTabBarIcon = useCallback(
    (
      iconName: string,
      iconNameFocused: string
    ) => {
      return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
        <Ionicons
          name={(focused ? iconNameFocused : iconName) as any}
          size={size}
          color={color}
        />
      );
    },
    []
  );

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: theme.colors.systemBackground,
          borderTopColor: theme.colors.separator,
        },
      }}
    >
      {/* Home Tab (Suras / Juzs) */}
      <Tab.Screen
        name="HomeTab"
        component={screens.Home}
        options={{
          tabBarLabel: HomeTabBuilder.prototype.getTabConfig().label,
          tabBarIcon: getTabBarIcon('document-text-outline', 'document-text'),
        }}
      />

      {/* Notes Tab */}
      <Tab.Screen
        name="NotesTab"
        component={screens.Notes}
        options={{
          tabBarLabel: NotesTabBuilder.prototype.getTabConfig().label,
          tabBarIcon: getTabBarIcon('star-outline', 'star'),
        }}
      />

      {/* Bookmarks Tab */}
      <Tab.Screen
        name="BookmarksTab"
        component={screens.Bookmarks}
        options={{
          tabBarLabel: BookmarksTabBuilder.prototype.getTabConfig().label,
          tabBarIcon: getTabBarIcon('bookmark-outline', 'bookmark'),
        }}
      />

      {/* Search Tab */}
      <Tab.Screen
        name="SearchTab"
        component={screens.Search}
        options={{
          tabBarLabel: SearchTabBuilder.prototype.getTabConfig().label,
          tabBarIcon: getTabBarIcon('search-outline', 'search'),
        }}
      />

      {/* Settings Tab */}
      <Tab.Screen
        name="SettingsTab"
        component={screens.Settings}
        options={{
          tabBarLabel: SettingsTabBuilder.prototype.getTabConfig().label,
          tabBarIcon: getTabBarIcon('settings-outline', 'settings'),
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================================================
// App Builder
// ============================================================================

/**
 * Creates the app interactor with all tabs.
 *
 * 1:1 translation of iOS AppBuilder.build().
 */
export function createAppInteractor(container: AppDependencies): AppInteractor {
  const tabs = [
    new HomeTabBuilder(container),
    new NotesTabBuilder(container),
    new BookmarksTabBuilder(container),
    new SearchTabBuilder(container),
    new SettingsTabBuilder(container),
  ];

  return new AppInteractor(
    container.supportsCloudKit,
    container.analytics,
    container.lastPagePersistence,
    tabs
  );
}

// ============================================================================
// useAppInteractor Hook
// ============================================================================

/**
 * Hook to create and manage the app interactor.
 */
export function useAppInteractor(container: AppDependencies): AppInteractor {
  const [interactor] = useState(() => createAppInteractor(container));

  useEffect(() => {
    interactor.start();
  }, [interactor]);

  return interactor;
}

