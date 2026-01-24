/**
 * TabViewController.swift → TabNavigator.tsx
 *
 * Base stack navigator for a tab.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { TabInteractor } from './tab-interactor';
import { createTabPresenter } from './tab-interactor';

// ============================================================================
// Types
// ============================================================================

/**
 * Screen definition for the tab navigator.
 */
export interface TabScreen {
  /** Screen name */
  name: string;
  /** Screen component */
  component: React.ComponentType<any>;
  /** Screen options */
  options?: Record<string, unknown>;
}

/**
 * Props for TabNavigator.
 */
export interface TabNavigatorProps {
  /** The interactor for this tab */
  interactor: TabInteractor;
  /** Initial screen name */
  initialRouteName: string;
  /** Screens to include in the navigator */
  screens: TabScreen[];
  /** Default screen options */
  screenOptions?: Record<string, unknown>;
}

// ============================================================================
// TabNavigator Component
// ============================================================================

const Stack = createNativeStackNavigator();

/**
 * Base stack navigator for a tab.
 * Wraps screens in a stack navigator and connects the interactor.
 *
 * This is the React Native equivalent of TabViewController (UINavigationController).
 */
export function TabNavigator({
  interactor,
  initialRouteName,
  screens,
  screenOptions,
}: TabNavigatorProps) {
  const navigation = useNavigation();

  // Connect the interactor to the navigation
  useEffect(() => {
    const presenter = createTabPresenter(navigation);
    interactor.presenter = presenter;
    interactor.start();

    return () => {
      interactor.presenter = null;
    };
  }, [interactor, navigation]);

  return (
    <Stack.Navigator
      id={tabName}
      initialRouteName={initialRouteName}
      screenOptions={screenOptions as any}
    >
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options as any}
        />
      ))}
    </Stack.Navigator>
  );
}

// ============================================================================
// useTabInteractor Hook
// ============================================================================

/**
 * Hook to create and connect a tab interactor.
 *
 * @param quranScreenName - The name of the Quran screen
 * @returns The connected tab interactor
 */
export function useTabInteractor(quranScreenName: string = 'Quran'): TabInteractor {
  const navigation = useNavigation();
  
  const interactor = useMemo(() => {
    const TabInteractorClass = require('./tab-interactor').TabInteractor;
    return new TabInteractorClass(quranScreenName);
  }, [quranScreenName]);

  useEffect(() => {
    const presenter = createTabPresenter(navigation);
    interactor.presenter = presenter;
    interactor.start();

    return () => {
      interactor.presenter = null;
    };
  }, [interactor, navigation]);

  return interactor;
}

