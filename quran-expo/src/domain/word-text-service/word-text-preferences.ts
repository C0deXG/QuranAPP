/**
 * WordTextPreferences.swift → word-text-preferences.ts
 *
 * Preferences for word-by-word text display.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey } from '../../core/preferences';
import { useTransformedPreference } from '../../core/preferences';
import { PreferenceTransformer } from '../../core/preferences';
import { WordTextType } from '../../model/quran-text';

// ============================================================================
// Preference Keys
// ============================================================================

const DEFAULT_WORD_TEXT_TYPE = WordTextType.translation;

/**
 * Preference key for word text type.
 */
export const wordTextTypeKey = new PreferenceKey<number>(
  'wordTranslationType',
  DEFAULT_WORD_TEXT_TYPE
);

// ============================================================================
// Transformer
// ============================================================================

/**
 * Transformer for WordTextType enum.
 */
const wordTextTypeTransformer: PreferenceTransformer<number, WordTextType> = {
  rawToValue: (raw: number): WordTextType => {
    if (raw === WordTextType.translation) return WordTextType.translation;
    if (raw === WordTextType.transliteration) return WordTextType.transliteration;
    return DEFAULT_WORD_TEXT_TYPE;
  },
  valueToRaw: (value: WordTextType): number => {
    return value;
  },
};

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for word text type preference.
 * Returns [value, setValue, isLoading] tuple.
 */
export function useWordTextType(): [WordTextType, (value: WordTextType) => Promise<void>, boolean] {
  return useTransformedPreference(wordTextTypeKey, wordTextTypeTransformer);
}

// ============================================================================
// WordTextPreferences Singleton
// ============================================================================

/**
 * Word text preferences.
 * Provides access to word text type preference.
 */
class WordTextPreferencesImpl {
  private static _instance: WordTextPreferencesImpl | null = null;

  static get shared(): WordTextPreferencesImpl {
    if (!WordTextPreferencesImpl._instance) {
      WordTextPreferencesImpl._instance = new WordTextPreferencesImpl();
    }
    return WordTextPreferencesImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the current word text type.
   */
  get wordTextType(): WordTextType {
    const { Preferences } = require('../../core/preferences');
    const raw = Preferences.shared.get(wordTextTypeKey);
    return wordTextTypeTransformer.rawToValue(raw);
  }

  /**
   * Sets the word text type.
   */
  set wordTextType(value: WordTextType) {
    const { Preferences } = require('../../core/preferences');
    Preferences.shared.set(wordTextTypeKey, wordTextTypeTransformer.valueToRaw(value));
  }
}

export const WordTextPreferences = WordTextPreferencesImpl;

