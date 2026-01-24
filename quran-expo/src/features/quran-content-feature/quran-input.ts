/**
 * QuranInput.swift → quran-input.ts
 *
 * Input data for the Quran content screen.
 *
 * Quran.com. All rights reserved.
 */

import type { Page, AyahNumber } from '../../model/quran-kit';

// ============================================================================
// QuranInput
// ============================================================================

/**
 * Input data for opening the Quran content.
 *
 * 1:1 translation of iOS QuranInput.
 */
export interface QuranInput {
  /** Initial page to display */
  initialPage: Page;
  /** Last page the user was on (for tracking) */
  lastPage: Page | null;
  /** Ayah to highlight from search results */
  highlightingSearchAyah: AyahNumber | null;
}

/**
 * Create a QuranInput.
 */
export function createQuranInput(
  initialPage: Page,
  lastPage: Page | null,
  highlightingSearchAyah: AyahNumber | null
): QuranInput {
  return { initialPage, lastPage, highlightingSearchAyah };
}

