/**
 * AnalyticsLibrary+Events.swift → analytics-events.ts
 *
 * Analytics events for annotations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../../model/quran-kit/types';
import type { AnalyticsLibrary } from '../../core/analytics';
import { createLogger } from '../../core/logging';

const logger = createLogger('AnalyticsEvents');

// ============================================================================
// Analytics Extension Functions
// ============================================================================

/**
 * Logs a verses event.
 */
function logVersesEvent(
  analytics: AnalyticsLibrary,
  name: string,
  verses: IAyahNumber[]
): void {
  const versesDescription = verses.map(getShortDescription).join(', ');
  logger.info(`AnalyticsVerses=${name}. Verses: [${versesDescription}]`);
  analytics.logEvent(name, verses.length.toString());
}

/**
 * Gets a short description for an ayah.
 */
function getShortDescription(ayah: IAyahNumber): string {
  return `${ayah.sura.suraNumber}:${ayah.ayah}`;
}

// ============================================================================
// Highlight Analytics
// ============================================================================

/**
 * Logs a highlight event.
 */
export function logHighlightEvent(
  analytics: AnalyticsLibrary,
  verses: IAyahNumber[]
): void {
  logVersesEvent(analytics, 'HighlightVersesNum', verses);
}

/**
 * Logs an unhighlight event.
 */
export function logUnhighlightEvent(
  analytics: AnalyticsLibrary,
  verses: IAyahNumber[]
): void {
  logVersesEvent(analytics, 'UnhighlightVersesNum', verses);
}

/**
 * Logs an update note event.
 */
export function logUpdateNoteEvent(
  analytics: AnalyticsLibrary,
  verses: Set<IAyahNumber>
): void {
  logVersesEvent(analytics, 'UpdateNoteVersesNum', Array.from(verses));
}

