/**
 * MoreMenuModel.swift → more-menu-model.ts
 *
 * Data models for the more menu.
 *
 * Quran.com. All rights reserved.
 */

// ============================================================================
// ConfigState
// ============================================================================

/**
 * State for a configurable menu item.
 *
 * 1:1 translation of iOS ConfigState.
 */
export type ConfigState = 'alwaysOn' | 'alwaysOff' | 'conditional';

// ============================================================================
// MoreMenuControlsState
// ============================================================================

/**
 * Controls state for the more menu.
 *
 * 1:1 translation of iOS MoreMenuControlsState.
 */
export interface MoreMenuControlsState {
  mode: ConfigState;
  translationsSelection: ConfigState;
  wordPointer: ConfigState;
  orientation: ConfigState;
  fontSize: ConfigState;
  twoPages: ConfigState;
  verticalScrolling: ConfigState;
  theme: ConfigState;
}

/**
 * Create default MoreMenuControlsState.
 */
export function createMoreMenuControlsState(): MoreMenuControlsState {
  return {
    mode: 'conditional',
    translationsSelection: 'conditional',
    wordPointer: 'conditional',
    orientation: 'conditional',
    fontSize: 'conditional',
    twoPages: 'conditional',
    verticalScrolling: 'conditional',
    theme: 'conditional',
  };
}

// ============================================================================
// MoreMenuModel
// ============================================================================

/**
 * Model for the more menu.
 *
 * 1:1 translation of iOS MoreMenuModel.
 */
export interface MoreMenuModel {
  isWordPointerActive: boolean;
  state: MoreMenuControlsState;
}

/**
 * Create a MoreMenuModel.
 */
export function createMoreMenuModel(
  isWordPointerActive: boolean,
  state: MoreMenuControlsState
): MoreMenuModel {
  return { isWordPointerActive, state };
}

