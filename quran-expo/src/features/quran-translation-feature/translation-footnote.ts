/**
 * TranslationFootnote.swift → translation-footnote.ts
 *
 * Translation footnote model.
 *
 * Quran.com. All rights reserved.
 */

import type { Translation, TranslationString, FontSize } from '../../model/quran-text';

// ============================================================================
// TranslationFootnote
// ============================================================================

/**
 * Footnote data for display.
 *
 * 1:1 translation of iOS TranslationFootnote.
 */
export interface TranslationFootnote {
  string: TranslationString;
  footnoteIndex: number;
  translation: Translation;
  translationFontSize: FontSize;
}

/**
 * Get the footnote text (with brackets trimmed).
 */
export function getFootnoteText(footnote: TranslationFootnote): string {
  const text = footnote.string.footnotes[footnote.footnoteIndex] ?? '';
  // Trim leading/trailing brackets
  return text.replace(/^\[+|\]+$/g, '');
}

/**
 * Create a unique key for a footnote.
 */
export function getFootnoteId(footnote: TranslationFootnote): string {
  return `${footnote.translation.id}-${footnote.footnoteIndex}`;
}

