/**
 * SettingsRootViewModel.swift → settings-view-model.ts
 *
 * View model for the Settings screen.
 *
 * Quran.com. All rights reserved.
 */

import { Share, Linking } from 'react-native';
import { logger } from '../../core/logging';
import type { AnalyticsLibrary } from '../../core/analytics';
import { ThemeService, type AppearanceMode } from '../../ui/theme';
import { AudioPreferences, type AudioEnd } from '../../domain/quran-audio-kit';
import { ReviewService } from '../../domain/settings-service';
import { QuranProfileService } from '../../domain/quran-profile-service';
import { ContactUsService } from './contact-us-service';

// ============================================================================
// SettingsViewState
// ============================================================================

/**
 * State for the Settings view.
 */
export interface SettingsViewState {
  appearanceMode: AppearanceMode;
  audioEnd: AudioEnd;
  isLoggingIn: boolean;
  error: Error | null;
}

// ============================================================================
// Navigation Actions
// ============================================================================

/**
 * Navigation actions for settings.
 */
export interface SettingsNavigation {
  navigateToAudioEndSelector: () => void;
  navigateToAudioManager: () => void;
  navigateToTranslationsList: () => void;
  navigateToReadingSelector: () => void;
  navigateToDiagnostics: () => void;
}

// ============================================================================
// SettingsViewModel
// ============================================================================

/**
 * View model for the Settings screen.
 *
 * 1:1 translation of iOS SettingsRootViewModel.
 */
export class SettingsViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  readonly analytics: AnalyticsLibrary;
  readonly reviewService: ReviewService;
  readonly quranProfileService: QuranProfileService;
  readonly contactUsService = new ContactUsService();
  readonly themeService = ThemeService.shared;
  readonly audioPreferences = AudioPreferences.shared;

  private navigation: SettingsNavigation | null = null;

  /** Current state */
  private _state: SettingsViewState;

  /** State change listeners */
  private listeners: ((state: SettingsViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    analytics: AnalyticsLibrary,
    reviewService: ReviewService,
    quranProfileService: QuranProfileService
  ) {
    this.analytics = analytics;
    this.reviewService = reviewService;
    this.quranProfileService = quranProfileService;

    this._state = {
      appearanceMode: this.themeService.appearanceMode,
      audioEnd: this.audioPreferences.audioEnd,
      isLoggingIn: false,
      error: null,
    };

    // Subscribe to theme changes
    this.themeService.addAppearanceModeListener((mode: AppearanceMode) => {
      this.setState({ appearanceMode: mode });
    });

    // Subscribe to audio end changes
    this.audioPreferences.addAudioEndListener((audioEnd: AudioEnd) => {
      this.setState({ audioEnd });
    });
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): SettingsViewState {
    return this._state;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: SettingsViewState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: SettingsViewState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<SettingsViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  /**
   * Set navigation handler.
   */
  setNavigation(navigation: SettingsNavigation): void {
    this.navigation = navigation;
  }

  // ============================================================================
  // Public Methods - Appearance
  // ============================================================================

  /**
   * Set appearance mode.
   */
  setAppearanceMode(mode: AppearanceMode): void {
    this.themeService.appearanceMode = mode;
  }

  // ============================================================================
  // Public Methods - Navigation
  // ============================================================================

  /**
   * Navigate to audio end selector.
   */
  navigateToAudioEndSelector(): void {
    logger.info('Settings: presentAudioEndSelector');
    this.navigation?.navigateToAudioEndSelector();
  }

  /**
   * Navigate to audio manager.
   */
  navigateToAudioManager(): void {
    logger.info('Settings: presentAudioDownloads');
    this.navigation?.navigateToAudioManager();
  }

  /**
   * Navigate to translations list.
   */
  navigateToTranslationsList(): void {
    logger.info('Settings: presentTranslationsList');
    this.navigation?.navigateToTranslationsList();
  }

  /**
   * Navigate to reading selector.
   */
  navigateToReadingSelector(): void {
    logger.info('Settings: navigateToReadingSelectors');
    this.navigation?.navigateToReadingSelector();
  }

  /**
   * Navigate to diagnostics.
   */
  navigateToDiagnostics(): void {
    logger.info('Settings: navigateToDiagnotics');
    this.navigation?.navigateToDiagnostics();
  }

  // ============================================================================
  // Public Methods - Actions
  // ============================================================================

  /**
   * Share the app.
   */
  async shareApp(): Promise<void> {
    logger.info('Settings: Share the app.');
    const url = 'https://itunes.apple.com/app/id1118663303';
    const appName = 'Quran - by Quran.com - قرآن';

    try {
      await Share.share({
        message: `${appName}\n${url}`,
        url: url,
      });
    } catch (error) {
      logger.warning('Failed to share app:', error);
    }
  }

  /**
   * Write a review.
   */
  writeReview(): void {
    logger.info('Settings: Navigate to app store to write a review.');
    this.reviewService.openAppReview();
  }

  /**
   * Contact us.
   */
  async contactUs(): Promise<void> {
    logger.info('Settings: presentContactUs');
    await this.contactUsService.openContactUs();
  }

  /**
   * Login to Quran.com.
   */
  async loginToQuranCom(): Promise<void> {
    logger.info('Settings: Login to Quran.com');
    this.setState({ isLoggingIn: true, error: null });

    try {
      await this.quranProfileService.login();
      logger.info('Login seems successful');
      this.setState({ isLoggingIn: false });
    } catch (error) {
      logger.error('Failed to login to Quran.com:', error);
      this.setState({ isLoggingIn: false, error: error as Error });
    }
  }

  /**
   * Clear error.
   */
  clearError(): void {
    this.setState({ error: null });
  }
}

