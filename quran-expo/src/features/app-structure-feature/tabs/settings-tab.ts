/**
 * SettingsTab.swift → settings-tab.ts
 *
 * Settings tab configuration and interactor.
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
 * Settings tab configuration for React Navigation.
 */
export const SETTINGS_TAB_CONFIG: TabConfig = {
  name: 'SettingsTab',
  component: null as any, // Will be set by the app
  iconName: 'settings-outline',
  iconNameFocused: 'settings',
  label: l('menu_settings'),
};

/**
 * Gets the settings tab label.
 */
export function getSettingsTabLabel(): string {
  return l('menu_settings');
}

// ============================================================================
// SettingsTabInteractor
// ============================================================================

/**
 * Interactor for the Settings tab.
 * Handles navigation from the Settings screen to the Quran view.
 *
 * 1:1 translation of iOS SettingsTabInteractor.
 */
export class SettingsTabInteractor extends TabInteractor {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Reference to build the settings screen */
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
// SettingsTabBuilder
// ============================================================================

/**
 * Builder for the Settings tab.
 *
 * 1:1 translation of iOS SettingsTabBuilder.
 */
export class SettingsTabBuilder implements TabBuildable {
  private readonly container: AppDependencies;

  constructor(container: AppDependencies) {
    this.container = container;
  }

  /**
   * Creates the settings tab interactor.
   */
  createInteractor(): SettingsTabInteractor {
    return new SettingsTabInteractor(this.container);
  }

  /**
   * Gets the tab configuration.
   */
  getTabConfig(): TabConfig {
    return {
      ...SETTINGS_TAB_CONFIG,
      label: getSettingsTabLabel(),
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

