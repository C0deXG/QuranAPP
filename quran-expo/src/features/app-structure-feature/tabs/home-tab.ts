/**
 * HomeTab.swift → home-tab.ts
 *
 * Home tab configuration and interactor.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../../app-dependencies';
import type { TabBuildable, TabConfig } from '../common';
import { TabInteractor } from '../common';
import { l } from '../../../core/localization';

// ============================================================================
// Tab Configuration
// ============================================================================

/**
 * Home tab configuration for React Navigation.
 */
export const HOME_TAB_CONFIG: TabConfig = {
  name: 'HomeTab',
  component: null as any, // Will be set by the app
  iconName: 'document-text-outline',
  iconNameFocused: 'document-text',
  label: `${l('quran_sura')} / ${l('quran_juz2')}`,
};

/**
 * Gets the home tab label.
 */
export function getHomeTabLabel(): string {
  return `${l('quran_sura')} / ${l('quran_juz2')}`;
}

// ============================================================================
// HomeTabInteractor
// ============================================================================

/**
 * Interactor for the Home tab.
 * Handles navigation from the Home screen to the Quran view.
 *
 * 1:1 translation of iOS HomeTabInteractor.
 */
export class HomeTabInteractor extends TabInteractor {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Reference to build the home screen */
  private readonly container: AppDependencies;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(container: AppDependencies, quranScreenName: string = 'Quran') {
    super(quranScreenName);
    this.container = container;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Called when the tab starts.
   * In iOS, this sets the root view controller.
   * In React Native, the initial screen is set via the navigator.
   */
  override start(): void {
    // In React Native, the initial screen is configured in the navigator
    // This method is kept for API compatibility
  }
}

// ============================================================================
// HomeTabBuilder
// ============================================================================

/**
 * Builder for the Home tab.
 *
 * 1:1 translation of iOS HomeTabBuilder.
 */
export class HomeTabBuilder implements TabBuildable {
  private readonly container: AppDependencies;

  constructor(container: AppDependencies) {
    this.container = container;
  }

  /**
   * Creates the home tab interactor.
   */
  createInteractor(): HomeTabInteractor {
    return new HomeTabInteractor(this.container);
  }

  /**
   * Gets the tab configuration.
   */
  getTabConfig(): TabConfig {
    return {
      ...HOME_TAB_CONFIG,
      label: getHomeTabLabel(),
    };
  }

  /**
   * Build the tab (returns null in RN - component set separately).
   */
  build(): React.ReactElement {
    // In React Native, the component is set via the navigator configuration
    return null as any;
  }
}

