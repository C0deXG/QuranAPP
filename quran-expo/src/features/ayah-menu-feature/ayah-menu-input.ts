/**
 * AyahMenuBuilder.swift (AyahMenuInput) → ayah-menu-input.ts
 *
 * Input data for the ayah menu.
 *
 * Quran.com. All rights reserved.
 */

import type { AyahNumber } from '../../model/quran-kit';
import type { Note } from '../../model/quran-annotations';
import type { Point } from '../../model/quran-geometry';

// ============================================================================
// AyahMenuInput
// ============================================================================

/**
 * Input data for presenting the ayah menu.
 *
 * 1:1 translation of iOS AyahMenuInput.
 */
export interface AyahMenuInput {
  /** The point where the menu should be anchored (for popover positioning) */
  pointInView: Point;
  /** The verses selected */
  verses: AyahNumber[];
  /** Existing notes for the selected verses */
  notes: Note[];
}

/**
 * Create an AyahMenuInput.
 */
export function createAyahMenuInput(
  pointInView: Point,
  verses: AyahNumber[],
  notes: Note[]
): AyahMenuInput {
  return { pointInView, verses, notes };
}

