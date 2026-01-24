/**
 * ReadingPreferences.swift → reading-preferences.ts
 *
 * Preferences for Quran reading style.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey } from '../../core/preferences';
import { useTransformedPreference } from '../../core/preferences';
import type { PreferenceTransformer } from '../../core/preferences';
import { Reading } from '../../model/quran-kit';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_QURAN_READING = Reading.Hafs1405;
const DEFAULT_QURAN_READING_RAW = DEFAULT_QURAN_READING as string;

// ============================================================================
// Preference Keys
// ============================================================================

/**
 * Preference key for reading style (raw value - stored as string).
 */
export const readingKey = new PreferenceKey<string>(
  'quranReading',
  DEFAULT_QURAN_READING_RAW
);

// ============================================================================
// Transformer
// ============================================================================

/**
 * Transformer for Reading enum.
 */
const readingTransformer: PreferenceTransformer<string, Reading> = {
  rawToValue: (raw: string): Reading => {
    // Validate that it's a valid Reading value
    if (Object.values(Reading).includes(raw as Reading)) {
      return raw as Reading;
    }
    return DEFAULT_QURAN_READING;
  },
  valueToRaw: (value: Reading): string => {
    return value as string;
  },
};

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for reading preference.
 * Returns [value, setValue, isLoading] tuple.
 */
export function useReading(): [Reading, (value: Reading) => Promise<void>, boolean] {
  return useTransformedPreference(readingKey, readingTransformer);
}

// ============================================================================
// ReadingPreferences Singleton
// ============================================================================

/**
 * Reading preferences singleton.
 */
class ReadingPreferencesImpl {
  private static _instance: ReadingPreferencesImpl | null = null;

  static get shared(): ReadingPreferencesImpl {
    if (!ReadingPreferencesImpl._instance) {
      ReadingPreferencesImpl._instance = new ReadingPreferencesImpl();
    }
    return ReadingPreferencesImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the current reading style.
   */
  get reading(): Reading {
    const { Preferences } = require('../../core/preferences');
    const raw = Preferences.shared.get(readingKey);
    return readingTransformer.rawToValue(raw);
  }

  /**
   * Sets the current reading style.
   */
  set reading(value: Reading) {
    const { Preferences } = require('../../core/preferences');
    Preferences.shared.set(readingKey, readingTransformer.valueToRaw(value));
  }

  /**
   * Gets an observable for reading changes.
   */
  observeReading(callback: (reading: Reading) => void): () => void {
    const { Preferences } = require('../../core/preferences');
    return Preferences.shared.observe(readingKey, (raw: string) => {
      callback(readingTransformer.rawToValue(raw));
    });
  }

  /**
   * Adds a listener for preference changes.
   * This is an alias for observeReading with a key-based API.
   */
  addListener(key: 'reading', callback: (value: Reading) => void): () => void {
    return this.observeReading(callback);
  }
}

export const ReadingPreferences = ReadingPreferencesImpl;

