/**
 * AdvancedAudioOptions.swift → advanced-audio-options.ts
 *
 * Advanced audio options data model.
 *
 * Quran.com. All rights reserved.
 */

import type { Runs } from '../../core/queue-player';
import type { Reciter } from '../../model/quran-audio';
import type { IAyahNumber } from '../../model/quran-kit';

// ============================================================================
// AdvancedAudioOptions
// ============================================================================

/**
 * Options for advanced audio playback.
 *
 * 1:1 translation of iOS AdvancedAudioOptions.
 */
export interface AdvancedAudioOptions {
  /** The reciter */
  reciter: Reciter;
  /** Start verse */
  start: IAyahNumber;
  /** End verse */
  end: IAyahNumber;
  /** Number of times to repeat each verse */
  verseRuns: Runs;
  /** Number of times to repeat the verse range */
  listRuns: Runs;
}

/**
 * Create AdvancedAudioOptions.
 */
export function createAdvancedAudioOptions(
  reciter: Reciter,
  start: IAyahNumber,
  end: IAyahNumber,
  verseRuns: Runs,
  listRuns: Runs
): AdvancedAudioOptions {
  return { reciter, start, end, verseRuns, listRuns };
}

