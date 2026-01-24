/**
 * NotesTab.swift → notes-tab.ts
 *
 * Notes tab configuration and interactor.
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
 * Notes tab configuration for React Navigation.
 */
export const NOTES_TAB_CONFIG: TabConfig = {
  name: 'NotesTab',
  component: null as any, // Will be set by the app
  iconName: 'star-outline',
  iconNameFocused: 'star',
  label: l('tab.notes'),
};

/**
 * Gets the notes tab label.
 */
export function getNotesTabLabel(): string {
  return l('tab.notes');
}

// ============================================================================
// NotesTabInteractor
// ============================================================================

/**
 * Interactor for the Notes tab.
 * Handles navigation from the Notes screen to the Quran view.
 *
 * 1:1 translation of iOS NotesTabInteractor.
 */
export class NotesTabInteractor extends TabInteractor {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Reference to build the notes screen */
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
// NotesTabBuilder
// ============================================================================

/**
 * Builder for the Notes tab.
 *
 * 1:1 translation of iOS NotesTabBuilder.
 */
export class NotesTabBuilder implements TabBuildable {
  private readonly container: AppDependencies;

  constructor(container: AppDependencies) {
    this.container = container;
  }

  /**
   * Creates the notes tab interactor.
   */
  createInteractor(): NotesTabInteractor {
    return new NotesTabInteractor(this.container);
  }

  /**
   * Gets the tab configuration.
   */
  getTabConfig(): TabConfig {
    return {
      ...NOTES_TAB_CONFIG,
      label: getNotesTabLabel(),
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

