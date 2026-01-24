/**
 * BookmarksTab.swift → bookmarks-tab.ts
 *
 * Bookmarks tab configuration and interactor.
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
 * Bookmarks tab configuration for React Navigation.
 */
export const BOOKMARKS_TAB_CONFIG: TabConfig = {
  name: 'BookmarksTab',
  component: null as any, // Will be set by the app
  iconName: 'bookmark-outline',
  iconNameFocused: 'bookmark',
  label: l('menu_bookmarks'),
};

/**
 * Gets the bookmarks tab label.
 */
export function getBookmarksTabLabel(): string {
  return l('menu_bookmarks');
}

// ============================================================================
// BookmarksTabInteractor
// ============================================================================

/**
 * Interactor for the Bookmarks tab.
 * Handles navigation from the Bookmarks screen to the Quran view.
 *
 * 1:1 translation of iOS BookmarksTabInteractor.
 */
export class BookmarksTabInteractor extends TabInteractor {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Reference to build the bookmarks screen */
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
// BookmarksTabBuilder
// ============================================================================

/**
 * Builder for the Bookmarks tab.
 *
 * 1:1 translation of iOS BookmarksTabBuilder.
 */
export class BookmarksTabBuilder implements TabBuildable {
  private readonly container: AppDependencies;

  constructor(container: AppDependencies) {
    this.container = container;
  }

  /**
   * Creates the bookmarks tab interactor.
   */
  createInteractor(): BookmarksTabInteractor {
    return new BookmarksTabInteractor(this.container);
  }

  /**
   * Gets the tab configuration.
   */
  getTabConfig(): TabConfig {
    return {
      ...BOOKMARKS_TAB_CONFIG,
      label: getBookmarksTabLabel(),
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

