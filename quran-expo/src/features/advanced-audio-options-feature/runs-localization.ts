/**
 * Runs++.swift → runs-localization.ts
 *
 * Runs localization utilities.
 *
 * Quran.com. All rights reserved.
 */

import { lAndroid } from '../../core/localization';
import { Runs } from '../../core/queue-player';

// ============================================================================
// Runs Utilities
// ============================================================================

/**
 * Get sorted list of Runs values for UI display.
 */
export const sortedRuns: Runs[] = [
  Runs.One,
  Runs.Two,
  Runs.Three,
  Runs.Indefinite,
];

/**
 * Get localized description for a Runs value.
 */
export function getRunsLocalizedDescription(runs: Runs): string {
  switch (runs) {
    case Runs.One:
      return lAndroid('repeatValues[0]');
    case Runs.Two:
      return lAndroid('repeatValues[1]');
    case Runs.Three:
      return lAndroid('repeatValues[2]');
    case Runs.Indefinite:
      return lAndroid('repeatValues[3]');
    default:
      return String(runs);
  }
}

/**
 * Check if two Runs values are equal.
 */
export function runsEqual(a: Runs, b: Runs): boolean {
  return a === b;
}

/**
 * Get unique key for a Runs value.
 */
export function getRunsKey(runs: Runs): string {
  return String(runs);
}

