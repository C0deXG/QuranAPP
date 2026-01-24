/**
 * SelectedTranslationsPreferences.swift → selected-translations-preferences.ts
 *
 * Preferences for selected translations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey } from '../../core/preferences';
import { usePreference } from '../../core/preferences';
import type { Translation } from '../../model/quran-text';

// ============================================================================
// Preference Keys
// ============================================================================

/**
 * Preference key for selected translation IDs.
 */
export const selectedTranslationsKey = new PreferenceKey<number[]>(
  'selectedTranslations',
  []
);

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for selected translation IDs.
 */
export function useSelectedTranslationIds(): [number[], (value: number[]) => Promise<void>, boolean] {
  return usePreference(selectedTranslationsKey);
}

// ============================================================================
// SelectedTranslationsPreferences Singleton
// ============================================================================

/**
 * Selected translations preferences singleton.
 */
class SelectedTranslationsPreferencesImpl {
  private static _instance: SelectedTranslationsPreferencesImpl | null = null;

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
    const { Preferences } = require('../../core/preferences');
    return Preferences.shared.get(selectedTranslationsKey);
  }

  /**
   * Sets the selected translation IDs.
   */
  set selectedTranslationIds(value: number[]) {
    const { Preferences } = require('../../core/preferences');
    Preferences.shared.set(selectedTranslationsKey, value);
  }

  /**
   * Removes a translation from the selected list.
   */
  remove(translationId: number): void {
    const ids = this.selectedTranslationIds;
    const index = ids.indexOf(translationId);
    if (index !== -1) {
      ids.splice(index, 1);
      this.selectedTranslationIds = ids;
    }
  }

  /**
   * Checks if a translation is selected.
   */
  isSelected(translationId: number): boolean {
    return this.selectedTranslationIds.includes(translationId);
  }

  /**
   * Toggles the selection of a translation.
   */
  toggleSelection(translationId: number): void {
    const ids = this.selectedTranslationIds;
    const index = ids.indexOf(translationId);
    if (index !== -1) {
      ids.splice(index, 1);
    } else {
      ids.push(translationId);
    }
    this.selectedTranslationIds = ids;
  }

  /**
   * Selects a translation.
   */
  select(translationId: number): void {
    if (!this.selectedTranslationIds.includes(translationId)) {
      const ids = [...this.selectedTranslationIds, translationId];
      this.selectedTranslationIds = ids;
    }
  }

  /**
   * Deselects a translation.
   */
  deselect(translationId: number): void {
    const ids = this.selectedTranslationIds;
    const index = ids.indexOf(translationId);
    if (index !== -1) {
      ids.splice(index, 1);
      this.selectedTranslationIds = ids;
    }
  }

  /**
   * Gets the selected translations from a list of local translations.
   */
  selectedTranslations(localTranslations: Translation[]): Translation[] {
    const selectedIds = this.selectedTranslationIds;
    const translationsById = new Map(localTranslations.map((t) => [t.id, t]));
    return selectedIds
      .map((id) => translationsById.get(id))
      .filter((t): t is Translation => t !== undefined);
  }

  /**
   * Resets all selected translations.
   */
  reset(): void {
    const { Preferences } = require('../../core/preferences');
    Preferences.shared.removeValueForKey(selectedTranslationsKey);
  }
}

export const SelectedTranslationsPreferences = SelectedTranslationsPreferencesImpl;

