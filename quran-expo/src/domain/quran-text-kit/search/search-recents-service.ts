/**
 * SearchRecentsService.swift → search-recents-service.ts
 *
 * Service for managing recent search terms.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey } from '../../../core/preferences';
import { useTransformedPreference } from '../../../core/preferences';
import type { PreferenceTransformer } from '../../../core/preferences';
import { orderedUnique } from '../../../core/utilities/sequence';

// ============================================================================
// Constants
// ============================================================================

const MAX_RECENT_COUNT = 5;

/**
 * Popular search terms.
 */
export const POPULAR_SEARCH_TERMS = [
  'الرحمن',
  'الحي القيوم',
  'يس',
  '7',
  '5:88',
  'تبارك',
  'عم',
  'أعوذ',
];

// ============================================================================
// Preference Keys
// ============================================================================

/**
 * Preference key for recent search items.
 */
const searchRecentItemsKey = new PreferenceKey<string[]>(
  'com.quran.searchRecentItems',
  []
);

// ============================================================================
// Transformer
// ============================================================================

/**
 * Transformer that ensures unique items.
 */
const searchRecentItemsTransformer: PreferenceTransformer<string[], string[]> = {
  rawToValue: (raw: string[]): string[] => orderedUnique(raw),
  valueToRaw: (value: string[]): string[] => value,
};

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for recent search items.
 */
export function useRecentSearchItems() {
  return useTransformedPreference(searchRecentItemsKey, searchRecentItemsTransformer);
}

// ============================================================================
// SearchRecentsService Singleton
// ============================================================================

/**
 * Service for managing recent search terms.
 */
class SearchRecentsServiceImpl {
  private static _instance: SearchRecentsServiceImpl | null = null;

  static get shared(): SearchRecentsServiceImpl {
    if (!SearchRecentsServiceImpl._instance) {
      SearchRecentsServiceImpl._instance = new SearchRecentsServiceImpl();
    }
    return SearchRecentsServiceImpl._instance;
  }

  private constructor() {}

  /**
   * Popular search terms.
   */
  get popularTerms(): string[] {
    return POPULAR_SEARCH_TERMS;
  }

  /**
   * Gets recent search items.
   */
  get recentSearchItems(): string[] {
    const { Preferences } = require('../../../core/preferences');
    const raw = Preferences.shared.get(searchRecentItemsKey);
    return searchRecentItemsTransformer.rawToValue(raw);
  }

  /**
   * Sets recent search items.
   */
  set recentSearchItems(value: string[]) {
    const { Preferences } = require('../../../core/preferences');
    Preferences.shared.set(searchRecentItemsKey, searchRecentItemsTransformer.valueToRaw(value));
  }

  /**
   * Adds a term to recents.
   */
  addToRecents(term: string): void {
    let recents = [...this.recentSearchItems];

    // Remove if exists (will be re-added at front)
    const index = recents.indexOf(term);
    if (index !== -1) {
      recents.splice(index, 1);
    }

    // Add at front
    recents.unshift(term);

    // Limit to max count
    if (recents.length > MAX_RECENT_COUNT) {
      recents = recents.slice(0, MAX_RECENT_COUNT);
    }

    this.recentSearchItems = recents;
  }

  /**
   * Resets recent search items.
   */
  reset(): void {
    const { Preferences } = require('../../../core/preferences');
    Preferences.shared.removeValueForKey(searchRecentItemsKey);
  }
}

export const SearchRecentsService = SearchRecentsServiceImpl;

