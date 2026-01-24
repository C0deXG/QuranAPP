/**
 * SelectedTranslationsPreferences.swift → selected-translations-preferences.ts
 *
 * Preferences for selected translations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Preferences, PreferenceKey } from '../../../core/preferences';

// ============================================================================
// Preference Keys
// ============================================================================

const selectedTranslationIdsKey = new PreferenceKey<number[]>('selectedTranslationIds', []);

// ============================================================================
// SelectedTranslationsPreferences
// ============================================================================

/**
 * Preferences for selected translations.
 */
class SelectedTranslationsPreferencesImpl {
  private static _instance: SelectedTranslationsPreferencesImpl | null = null;
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  static get shared(): SelectedTranslationsPreferencesImpl {
    if (!SelectedTranslationsPreferencesImpl._instance) {
      SelectedTranslationsPreferencesImpl._instance = new SelectedTranslationsPreferencesImpl();
    }
    return SelectedTranslationsPreferencesImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the selected translation IDs.
   */
  get selectedTranslationIds(): number[] {
    return Preferences.shared.get(selectedTranslationIdsKey) ?? [];
  }

  /**
   * Sets the selected translation IDs.
   */
  set selectedTranslationIds(value: number[]) {
    Preferences.shared.set(selectedTranslationIdsKey, value);
    this.notifyListeners('selectedTranslationIds', value);
  }

  /**
   * Adds a listener for preference changes.
   */
  addListener(key: string, listener: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    
    // Emit current value
    if (key === 'selectedTranslationIds') {
      listener(this.selectedTranslationIds);
    }
    
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notifyListeners(key: string, value: any): void {
    this.listeners.get(key)?.forEach(listener => listener(value));
  }
}

export const SelectedTranslationsPreferences = SelectedTranslationsPreferencesImpl;

