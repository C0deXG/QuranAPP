/**
 * MoreMenuViewModel.swift → more-menu-view-model.ts
 *
 * View model for the more menu.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import type { QuranMode, FontSize, WordTextType } from '../../model/quran-text';
import type { AppearanceMode } from '../../ui/theme';
import { ThemeService } from '../../ui/theme';
import { FontSizePreferences, QuranContentStatePreferences } from '../../domain/quran-text-kit';
import { WordTextPreferences } from '../../domain/word-text-service';
import { TwoPagesUtils } from '../../domain/quran-text-kit';
import type { MoreMenuModel, MoreMenuControlsState, ConfigState } from './more-menu-model';
import type { MoreMenuListener } from './more-menu-listener';

// ============================================================================
// MoreMenuViewState
// ============================================================================

export interface MoreMenuViewState {
  mode: QuranMode;
  wordPointerEnabled: boolean;
  wordPointerType: WordTextType;
  translationFontSize: FontSize;
  arabicFontSize: FontSize;
  twoPagesEnabled: boolean;
  verticalScrollingEnabled: boolean;
  appearanceMode: AppearanceMode;
  controlsState: MoreMenuControlsState;
}

// ============================================================================
// MoreMenuViewModel
// ============================================================================

/**
 * View model for the more menu.
 *
 * 1:1 translation of iOS MoreMenuViewModel.
 */
export class MoreMenuViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  listener: MoreMenuListener | null = null;

  private readonly model: MoreMenuModel;
  private readonly themeService = ThemeService.shared;
  private readonly wordTextPreferences = WordTextPreferences.shared;
  private readonly preferences = QuranContentStatePreferences.shared;
  private readonly fontSizePreferences = FontSizePreferences.shared;

  private _state: MoreMenuViewState;
  private stateListeners: ((state: MoreMenuViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(model: MoreMenuModel) {
    this.model = model;

    // Adjust twoPages state based on screen size
    const controlsState = { ...model.state };
    if (controlsState.twoPages === 'conditional' && !TwoPagesUtils.hasEnoughHorizontalSpace()) {
      controlsState.twoPages = 'alwaysOff';
    }

    this._state = {
      mode: this.preferences.quranMode,
      wordPointerEnabled: model.isWordPointerActive,
      wordPointerType: this.wordTextPreferences.wordTextType,
      translationFontSize: this.fontSizePreferences.translationFontSize,
      arabicFontSize: this.fontSizePreferences.arabicFontSize,
      twoPagesEnabled: this.preferences.twoPagesEnabled,
      verticalScrollingEnabled: this.preferences.verticalScrollingEnabled,
      appearanceMode: this.themeService.appearanceMode,
      controlsState,
    };
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): MoreMenuViewState {
    return this._state;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  addListener(listener: (state: MoreMenuViewState) => void): void {
    this.stateListeners.push(listener);
  }

  removeListener(listener: (state: MoreMenuViewState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  private setState(updates: Partial<MoreMenuViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.stateListeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Set the Quran mode.
   */
  setMode(mode: QuranMode): void {
    logger.info(`More Menu: set quran mode ${mode}`);
    this.preferences.quranMode = mode;

    // Disable word pointer when switching to translation mode
    if (mode === 'translation') {
      this.setState({ mode, wordPointerEnabled: false });
      this.listener?.onIsWordPointerActiveUpdated(false);
    } else {
      this.setState({ mode });
    }
  }

  /**
   * Set word pointer enabled state.
   */
  setWordPointerEnabled(enabled: boolean): void {
    logger.info(`More Menu: set is word pointer active ${enabled}`);
    this.setState({ wordPointerEnabled: enabled });
    this.listener?.onIsWordPointerActiveUpdated(enabled);
  }

  /**
   * Set word pointer type.
   */
  setWordPointerType(type: WordTextType): void {
    logger.info(`More Menu: set word pointer type ${type}`);
    this.wordTextPreferences.wordTextType = type;
    this.setState({ wordPointerType: type });
  }

  /**
   * Set translation font size.
   */
  setTranslationFontSize(size: FontSize): void {
    logger.info(`More Menu: set translation font size ${size}`);
    this.fontSizePreferences.translationFontSize = size;
    this.setState({ translationFontSize: size });
  }

  /**
   * Set Arabic font size.
   */
  setArabicFontSize(size: FontSize): void {
    logger.info(`More Menu: set arabic font size ${size}`);
    this.fontSizePreferences.arabicFontSize = size;
    this.setState({ arabicFontSize: size });
  }

  /**
   * Set two pages enabled state.
   */
  setTwoPagesEnabled(enabled: boolean): void {
    logger.info(`More Menu: set two pages enabled ${enabled}`);
    this.preferences.twoPagesEnabled = enabled;
    this.setState({ twoPagesEnabled: enabled });
  }

  /**
   * Set vertical scrolling enabled state.
   */
  setVerticalScrollingEnabled(enabled: boolean): void {
    logger.info(`More Menu: set vertical scrolling enabled ${enabled}`);
    this.preferences.verticalScrollingEnabled = enabled;
    this.setState({ verticalScrollingEnabled: enabled });
  }

  /**
   * Set appearance mode.
   */
  setAppearanceMode(mode: AppearanceMode): void {
    logger.info(`More Menu: set appearanceMode ${mode}`);
    this.themeService.appearanceMode = mode;
    this.setState({ appearanceMode: mode });
  }

  /**
   * Called when translations selection is tapped.
   */
  selectTranslations(): void {
    logger.info('More Menu: translations selections tapped');
    this.listener?.onTranslationsSelectionsTapped();
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if a config state should be visible.
   */
  isVisible(state: ConfigState, customCondition: boolean = true): boolean {
    switch (state) {
      case 'alwaysOff':
        return false;
      case 'alwaysOn':
        return true;
      case 'conditional':
        return customCondition;
    }
  }
}

