/**
 * QuranNavigator.swift → quran-navigator.ts
 *
 * Protocol for navigating to Quran pages.
 *
 * Quran.com. All rights reserved.
 */

import type { IPage, IAyahNumber } from '../../model/quran-kit';

// ============================================================================
// QuranNavigator Interface
// ============================================================================

/**
 * Interface for navigating to Quran pages.
 * Implemented by the main app coordinator to handle navigation requests from features.
 *
 * This is a 1:1 translation of the iOS QuranNavigator protocol.
 * In iOS, this is marked with @MainActor - in React Native, all JS runs on main thread.
 */
export interface QuranNavigator {
  /**
   * Navigate to a specific page in the Quran.
   *
   * @param page - The page to navigate to
   * @param lastPage - The last page context (for "continue reading" behavior), or null
   * @param highlightingSearchAyah - An ayah to highlight (from search results), or null
   */
  navigateTo(
    page: IPage,
    lastPage: IPage | null,
    highlightingSearchAyah: IAyahNumber | null
  ): void;
}

// ============================================================================
// Navigation Parameters Type
// ============================================================================

/**
 * Parameters for Quran navigation.
 * Useful for passing around navigation intent.
 */
export interface QuranNavigationParams {
  /** The page to navigate to */
  page: IPage;
  /** The last page context (for "continue reading" behavior) */
  lastPage: IPage | null;
  /** An ayah to highlight (from search results) */
  highlightingSearchAyah: IAyahNumber | null;
}

/**
 * Creates navigation parameters object.
 */
export function createNavigationParams(
  page: IPage,
  lastPage: IPage | null = null,
  highlightingSearchAyah: IAyahNumber | null = null
): QuranNavigationParams {
  return { page, lastPage, highlightingSearchAyah };
}

