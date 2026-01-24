/**
 * FontSizePreferences.swift → font-size-preferences.ts
 *
 * Preferences for font sizes.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey } from '../../../core/preferences';
import { useTransformedPreference } from '../../../core/preferences';
import type { PreferenceTransformer } from '../../../core/preferences';
import { FontSize } from '../../../model/quran-text';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FONT_SIZE = FontSize.large;

// ============================================================================
// Preference Keys
// ============================================================================

/**
 * Preference key for translation font size.
 */
export const translationFontSizeKey = new PreferenceKey<number>(
  'translationFontSize',
  DEFAULT_FONT_SIZE
);

/**
 * Preference key for Arabic font size.
 */
export const arabicFontSizeKey = new PreferenceKey<number>(
  'arabicFont',
  DEFAULT_FONT_SIZE
);

// ============================================================================
// Transformer
// ============================================================================

/**
 * Transformer for FontSize enum.
 */
const fontSizeTransformer: PreferenceTransformer<number, FontSize> = {
  rawToValue: (raw: number): FontSize => {
    if (Object.values(FontSize).includes(raw as FontSize)) {
      return raw as FontSize;
    }
    return DEFAULT_FONT_SIZE;
  },
  valueToRaw: (value: FontSize): number => {
    return value;
  },
};

// ============================================================================
// React Hooks
// ============================================================================

/**
 * React hook for translation font size.
 */
export function useTranslationFontSize(): [FontSize, (value: FontSize) => Promise<void>, boolean] {
  return useTransformedPreference(translationFontSizeKey, fontSizeTransformer);
}

/**
 * React hook for Arabic font size.
 */
export function useArabicFontSize(): [FontSize, (value: FontSize) => Promise<void>, boolean] {
  return useTransformedPreference(arabicFontSizeKey, fontSizeTransformer);
}

// ============================================================================
// FontSizePreferences Singleton
// ============================================================================

/**
 * Font size preferences singleton.
 */
class FontSizePreferencesImpl {
  private static _instance: FontSizePreferencesImpl | null = null;

  static get shared(): FontSizePreferencesImpl {
    if (!FontSizePreferencesImpl._instance) {
      FontSizePreferencesImpl._instance = new FontSizePreferencesImpl();
    }
    return FontSizePreferencesImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the translation font size.
   */
  get translationFontSize(): FontSize {
    const { Preferences } = require('../../../core/preferences');
    const raw = Preferences.shared.get(translationFontSizeKey);
    return fontSizeTransformer.rawToValue(raw);
  }

  /**
   * Sets the translation font size.
   */
  set translationFontSize(value: FontSize) {
    const { Preferences } = require('../../../core/preferences');
    Preferences.shared.set(translationFontSizeKey, fontSizeTransformer.valueToRaw(value));
  }

  /**
   * Gets the Arabic font size.
   */
  get arabicFontSize(): FontSize {
    const { Preferences } = require('../../../core/preferences');
    const raw = Preferences.shared.get(arabicFontSizeKey);
    return fontSizeTransformer.rawToValue(raw);
  }

  /**
   * Sets the Arabic font size.
   */
  set arabicFontSize(value: FontSize) {
    const { Preferences } = require('../../../core/preferences');
    Preferences.shared.set(arabicFontSizeKey, fontSizeTransformer.valueToRaw(value));
  }

  // Listener storage
  private translationListeners: Set<(size: FontSize) => void> = new Set();
  private arabicListeners: Set<(size: FontSize) => void> = new Set();

  /**
   * Adds a listener for font size changes.
   * Supports 'translationFontSize' and 'arabicFontSize' events.
   */
  addListener(event: string, listener: (size: FontSize) => void): () => void {
    if (event === 'translationFontSize') {
      this.translationListeners.add(listener);
      listener(this.translationFontSize);
      return () => {
        this.translationListeners.delete(listener);
      };
    } else if (event === 'arabicFontSize') {
      this.arabicListeners.add(listener);
      listener(this.arabicFontSize);
      return () => {
        this.arabicListeners.delete(listener);
      };
    }
    return () => {};
  }
}

export const FontSizePreferences = FontSizePreferencesImpl;

