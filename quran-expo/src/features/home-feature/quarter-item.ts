/**
 * QuarterItem.swift → quarter-item.ts
 *
 * Data model for quarter list items.
 *
 * Quran.com. All rights reserved.
 */

import type { Quarter } from '../../model/quran-kit';

// ============================================================================
// QuarterItem
// ============================================================================

/**
 * Represents a quarter with its Arabic text for display.
 */
export interface QuarterItem {
  /** The quarter data */
  quarter: Quarter;
  /** The Arabic text of the first ayah */
  ayahText: string;
}

/**
 * Creates a QuarterItem.
 */
export function createQuarterItem(quarter: Quarter, ayahText: string): QuarterItem {
  return { quarter, ayahText };
}

/**
 * Gets the unique ID for a QuarterItem.
 */
export function getQuarterItemId(item: QuarterItem): number {
  return item.quarter.quarterNumber;
}

