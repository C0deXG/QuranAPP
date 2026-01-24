/**
 * Page+Localization.swift → page-localization.ts
 *
 * Extension methods for Page localization.
 *
 * Quran.com. All rights reserved.
 */

import type { Page, Sura } from '../../model/quran-kit';

// ============================================================================
// MultipartText
// ============================================================================

/**
 * Represents a text that may contain mixed fonts (regular + Arabic sura name).
 *
 * 1:1 translation of iOS MultipartText.
 */
export interface MultipartTextPart {
  text: string;
  isArabicSuraName: boolean;
}

export interface MultipartText {
  parts: MultipartTextPart[];
}

/**
 * Create a simple MultipartText from a string.
 */
export function createMultipartText(text: string): MultipartText {
  return {
    parts: [{ text, isArabicSuraName: false }],
  };
}

/**
 * Append text to a MultipartText.
 */
export function appendToMultipartText(
  multipart: MultipartText,
  text: string,
  isArabicSuraName = false
): MultipartText {
  return {
    parts: [...multipart.parts, { text, isArabicSuraName }],
  };
}

/**
 * Append another MultipartText to this one.
 */
export function appendMultipartText(
  target: MultipartText,
  source: MultipartText
): MultipartText {
  return {
    parts: [...target.parts, ...source.parts],
  };
}

/**
 * Convert MultipartText to a plain string.
 */
export function multipartTextToString(multipart: MultipartText): string {
  return multipart.parts.map((p) => p.text).join('');
}

// ============================================================================
// Sura Extensions
// ============================================================================

/**
 * Get the multipart sura name for a Sura.
 *
 * 1:1 translation of iOS Sura.multipartSuraName().
 */
export function multipartSuraName(sura: Sura): MultipartText {
  return {
    parts: [
      { text: sura.localizedName(), isArabicSuraName: false },
      { text: ' ', isArabicSuraName: false },
      { text: sura.arabicSuraName, isArabicSuraName: true },
    ],
  };
}

// ============================================================================
// Page Extensions
// ============================================================================

/**
 * Get unique suras in order from a page's verses.
 */
function orderedUniqueSuras(page: Page): Sura[] {
  const seen = new Set<number>();
  const result: Sura[] = [];

  for (const verse of page.verses) {
    if (!seen.has(verse.sura.suraNumber)) {
      seen.add(verse.sura.suraNumber);
      result.push(verse.sura);
    }
  }

  return result;
}

/**
 * Get the sura names for a page as MultipartText.
 *
 * 1:1 translation of iOS Page.suraNames() -> MultipartText.
 */
export function pageSuraNames(page: Page): MultipartText {
  const suras = orderedUniqueSuras(page);

  let result: MultipartText = { parts: [] };

  for (let i = 0; i < suras.length; i++) {
    const sura = suras[i];
    const suraText = multipartSuraName(sura);

    if (i === 0) {
      result = appendMultipartText(result, suraText);
    } else {
      result = appendToMultipartText(result, ' - ');
      result = appendMultipartText(result, suraText);
    }
  }

  return result;
}

/**
 * Get the sura names for a page as a plain string.
 *
 * Convenience method that converts MultipartText to string.
 */
export function pageSuraNamesString(page: Page): string {
  return multipartTextToString(pageSuraNames(page));
}

