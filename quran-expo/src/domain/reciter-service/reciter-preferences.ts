/**
 * ReciterPreferences.swift → reciter-preferences.ts
 *
 * Preferences for reciter selection.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey } from '../../core/preferences';
import { usePreference, useTransformedPreference } from '../../core/preferences';
import type { PreferenceTransformer } from '../../core/preferences';

// ============================================================================
// Preference Keys
// ============================================================================

/** Default reciter ID (Mishary Al-Afasy). */
const DEFAULT_LAST_SELECTED_RECITER_ID = 41;

/**
 * Preference key for last selected reciter ID.
 */
export const lastSelectedReciterIdKey = new PreferenceKey<number>(
  'LastSelectedQariId',
  DEFAULT_LAST_SELECTED_RECITER_ID
);

/**
 * Preference key for recent reciter IDs.
 */
export const recentReciterIdsKey = new PreferenceKey<number[]>(
  'recentRecitersIdsKey',
  []
);

// ============================================================================
// Transformer for OrderedSet-like behavior
// ============================================================================

/**
 * Transformer that treats an array as an ordered set.
 */
const orderedSetTransformer: PreferenceTransformer<number[], number[]> = {
  rawToValue: (raw: number[]): number[] => {
    // Deduplicate while preserving order
    const seen = new Set<number>();
    return raw.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  },
  valueToRaw: (value: number[]): number[] => {
    return value;
  },
};

// ============================================================================
// React Hooks
// ============================================================================

/**
 * React hook for last selected reciter ID.
 * Returns [value, setValue, isLoading] tuple.
 */
export function useLastSelectedReciterId(): [number, (value: number) => Promise<void>, boolean] {
  return usePreference(lastSelectedReciterIdKey);
}

/**
 * React hook for recent reciter IDs.
 * Returns [value, setValue, isLoading] tuple.
 */
export function useRecentReciterIds(): [number[], (value: number[]) => Promise<void>, boolean] {
  return useTransformedPreference(recentReciterIdsKey, orderedSetTransformer);
}

// ============================================================================
// ReciterPreferences Singleton
// ============================================================================

/**
 * Reciter preferences singleton.
 */
class ReciterPreferencesImpl {
  private static _instance: ReciterPreferencesImpl | null = null;

  static get shared(): ReciterPreferencesImpl {
    if (!ReciterPreferencesImpl._instance) {
      ReciterPreferencesImpl._instance = new ReciterPreferencesImpl();
    }
    return ReciterPreferencesImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the last selected reciter ID.
   */
  get lastSelectedReciterId(): number {
    const { Preferences } = require('../../core/preferences');
    return Preferences.shared.get(lastSelectedReciterIdKey);
  }

  /**
   * Sets the last selected reciter ID.
   */
  set lastSelectedReciterId(value: number) {
    const { Preferences } = require('../../core/preferences');
    Preferences.shared.set(lastSelectedReciterIdKey, value);
  }

  /**
   * Gets the recent reciter IDs (as an ordered set).
   */
  get recentReciterIds(): number[] {
    const { Preferences } = require('../../core/preferences');
    const raw = Preferences.shared.get(recentReciterIdsKey);
    return orderedSetTransformer.rawToValue(raw);
  }

  /**
   * Sets the recent reciter IDs.
   */
  set recentReciterIds(value: number[]) {
    const { Preferences } = require('../../core/preferences');
    Preferences.shared.set(recentReciterIdsKey, orderedSetTransformer.valueToRaw(value));
  }

  /**
   * Resets all reciter preferences.
   */
  reset(): void {
    const { Preferences } = require('../../core/preferences');
    Preferences.shared.removeValueForKey(lastSelectedReciterIdKey);
    Preferences.shared.removeValueForKey(recentReciterIdsKey);
  }
}

export const ReciterPreferences = ReciterPreferencesImpl;

