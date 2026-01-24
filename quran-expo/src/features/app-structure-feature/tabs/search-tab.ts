/**
 * SearchTab.swift → search-tab.ts
 *
 * Search tab configuration and interactor.
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
 * Search tab configuration for React Navigation.
 */
export const SEARCH_TAB_CONFIG: TabConfig = {
  name: 'SearchTab',
  component: null as any, // Will be set by the app
  iconName: 'search-outline',
  iconNameFocused: 'search',
  label: l('search'),
};

/**
 * Gets the search tab label.
 */
export function getSearchTabLabel(): string {
  return l('search');
}

// ============================================================================
// SearchTabInteractor
// ============================================================================

/**
 * Interactor for the Search tab.
 * Handles navigation from the Search screen to the Quran view.
 *
 * 1:1 translation of iOS SearchTabInteractor.
 */
export class SearchTabInteractor extends TabInteractor {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Reference to build the search screen */
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
// SearchTabBuilder
// ============================================================================

/**
 * Builder for the Search tab.
 *
 * 1:1 translation of iOS SearchTabBuilder.
 */
export class SearchTabBuilder implements TabBuildable {
  private readonly container: AppDependencies;

  constructor(container: AppDependencies) {
    this.container = container;
  }

  /**
   * Creates the search tab interactor.
   */
  createInteractor(): SearchTabInteractor {
    return new SearchTabInteractor(this.container);
  }

  /**
   * Gets the tab configuration.
   */
  getTabConfig(): TabConfig {
    return {
      ...SEARCH_TAB_CONFIG,
      label: getSearchTabLabel(),
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

