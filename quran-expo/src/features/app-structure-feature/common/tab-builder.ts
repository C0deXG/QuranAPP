/**
 * TabBuilder.swift → tab-builder.ts
 *
 * Protocol for building tab screens.
 *
 * Quran.com. All rights reserved.
 */

import type { ReactElement } from 'react';

// ============================================================================
// TabBuildable Interface
// ============================================================================

/**
 * Protocol for building a tab's content.
 * Implemented by each tab builder to create its screen.
 *
 * In iOS, this returns a UIViewController.
 * In React Native, this returns a React component/element.
 */
export interface TabBuildable {
  /**
   * Build and return the tab's root component.
   */
  build(): ReactElement;
}

/**
 * Tab configuration for React Navigation.
 */
export interface TabConfig {
  /** The tab's name (used as route name) */
  name: string;
  /** The component to render for this tab */
  component: React.ComponentType<any>;
  /** Tab bar icon name (Ionicons) */
  iconName: string;
  /** Tab bar icon name when focused */
  iconNameFocused: string;
  /** Tab bar label */
  label: string;
}

