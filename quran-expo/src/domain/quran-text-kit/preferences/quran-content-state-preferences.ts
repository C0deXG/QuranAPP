/**
 * QuranContentStatePreferences.swift → quran-content-state-preferences.ts
 *
 * Preferences for Quran content display state.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey } from '../../../core/preferences';
import { usePreference, useTransformedPreference } from '../../../core/preferences';
import type { PreferenceTransformer } from '../../../core/preferences';
import { QuranMode } from '../../../model/quran-text';
import { getTwoPagesSettingDefaultValue } from '../two-pages/two-pages-utils';

// ============================================================================
// Preference Keys
// ============================================================================

/**
 * Preference key for showing translation view.
 */
const showQuranTranslationViewKey = new PreferenceKey<boolean>(
  'showQuranTranslationView',
  false
);

/**
 * Preference key for two pages enabled.
 */
export const twoPagesEnabledKey = new PreferenceKey<boolean>(
  'twoPagesEnabled',
  getTwoPagesSettingDefaultValue()
);

/**
 * Preference key for vertical scrolling enabled.
 */
export const verticalScrollingEnabledKey = new PreferenceKey<boolean>(
  'verticalScrollingEnabled',
  false
);

// ============================================================================
// Transformer
// ============================================================================

/**
 * Transformer for QuranMode.
 */
const quranModeTransformer: PreferenceTransformer<boolean, QuranMode> = {
  rawToValue: (raw: boolean): QuranMode => {
    return raw ? QuranMode.translation : QuranMode.arabic;
  },
  valueToRaw: (value: QuranMode): boolean => {
    return value === QuranMode.translation;
  },
};

// ============================================================================
// React Hooks
// ============================================================================

/**
 * React hook for Quran mode.
 * Returns [value, setValue, isLoading] tuple.
 */
export function useQuranMode(): [QuranMode, (value: QuranMode) => Promise<void>, boolean] {
  return useTransformedPreference(showQuranTranslationViewKey, quranModeTransformer);
}

/**
 * React hook for two pages enabled.
 * Returns [value, setValue, isLoading] tuple.
 */
export function useTwoPagesEnabled(): [boolean, (value: boolean) => Promise<void>, boolean] {
  return usePreference(twoPagesEnabledKey);
}

/**
 * React hook for vertical scrolling enabled.
 * Returns [value, setValue, isLoading] tuple.
 */
export function useVerticalScrollingEnabled(): [boolean, (value: boolean) => Promise<void>, boolean] {
  return usePreference(verticalScrollingEnabledKey);
}

// ============================================================================
// QuranContentStatePreferences Singleton
// ============================================================================

/**
 * Quran content state preferences singleton.
 */
class QuranContentStatePreferencesImpl {
  private static _instance: QuranContentStatePreferencesImpl | null = null;

  static get shared(): QuranContentStatePreferencesImpl {
    if (!QuranContentStatePreferencesImpl._instance) {
      QuranContentStatePreferencesImpl._instance = new QuranContentStatePreferencesImpl();
    }
    return QuranContentStatePreferencesImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the Quran mode.
   */
  get quranMode(): QuranMode {
    const { Preferences } = require('../../../core/preferences');
    const raw = Preferences.shared.get(showQuranTranslationViewKey);
    return quranModeTransformer.rawToValue(raw);
  }

  /**
   * Sets the Quran mode.
   */
  set quranMode(value: QuranMode) {
    const { Preferences } = require('../../../core/preferences');
    Preferences.shared.set(showQuranTranslationViewKey, quranModeTransformer.valueToRaw(value));
  }

  /**
   * Gets whether two pages is enabled.
   */
  get twoPagesEnabled(): boolean {
    const { Preferences } = require('../../../core/preferences');
    return Preferences.shared.get(twoPagesEnabledKey);
  }

  /**
   * Sets whether two pages is enabled.
   */
  set twoPagesEnabled(value: boolean) {
    const { Preferences } = require('../../../core/preferences');
    Preferences.shared.set(twoPagesEnabledKey, value);
  }

  /**
   * Gets whether vertical scrolling is enabled.
   */
  get verticalScrollingEnabled(): boolean {
    const { Preferences } = require('../../../core/preferences');
    return Preferences.shared.get(verticalScrollingEnabledKey);
  }

  /**
   * Sets whether vertical scrolling is enabled.
   */
  set verticalScrollingEnabled(value: boolean) {
    const { Preferences } = require('../../../core/preferences');
    Preferences.shared.set(verticalScrollingEnabledKey, value);
  }

  /**
   * Adds a listener for preference changes.
   */
  addListener(
    key: 'quranMode' | 'twoPagesEnabled' | 'verticalScrollingEnabled',
    callback: (value: any) => void
  ): () => void {
    const { Preferences } = require('../../../core/preferences');
    switch (key) {
      case 'quranMode':
        return Preferences.shared.observe(showQuranTranslationViewKey, (raw: boolean) => {
          callback(quranModeTransformer.rawToValue(raw));
        });
      case 'twoPagesEnabled':
        return Preferences.shared.observe(twoPagesEnabledKey, callback);
      case 'verticalScrollingEnabled':
        return Preferences.shared.observe(verticalScrollingEnabledKey, callback);
    }
  }
}

export const QuranContentStatePreferences = QuranContentStatePreferencesImpl;

