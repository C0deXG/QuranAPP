/**
 * TranslationURL.swift → translation-url.ts
 *
 * URL encoding/decoding for translation actions.
 *
 * Quran.com. All rights reserved.
 */

import type { Translation } from '../../model/quran-text';

// ============================================================================
// TranslationURL
// ============================================================================

/**
 * URL encoding for translation actions.
 *
 * 1:1 translation of iOS TranslationURL.
 */
export type TranslationURL =
  | {
      type: 'footnote';
      translationId: Translation['id'];
      sura: number;
      ayah: number;
      footnoteIndex: number;
    }
  | {
      type: 'readMore';
      translationId: Translation['id'];
      sura: number;
      ayah: number;
    };

const SCHEME = 'quran-ios';
const HOST = 'translationURL';
const DATA_KEY = 'data';

/**
 * Create a URL from a TranslationURL.
 */
export function translationURLToString(url: TranslationURL): string {
  const jsonString = JSON.stringify(url);
  const encodedData = encodeURIComponent(jsonString);
  return `${SCHEME}://${HOST}?${DATA_KEY}=${encodedData}`;
}

/**
 * Parse a URL string into a TranslationURL.
 */
export function parseTranslationURL(urlString: string): TranslationURL | null {
  try {
    // Check scheme
    if (!urlString.startsWith(`${SCHEME}://`)) {
      return null;
    }

    // Parse URL
    const url = new URL(urlString);
    if (url.host !== HOST) {
      return null;
    }

    // Get data parameter
    const dataString = url.searchParams.get(DATA_KEY);
    if (!dataString) {
      return null;
    }

    // Decode and parse JSON
    const decodedData = decodeURIComponent(dataString);
    const parsed = JSON.parse(decodedData);

    // Validate type
    if (parsed.type === 'footnote' || parsed.type === 'readMore') {
      return parsed as TranslationURL;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Create a footnote URL.
 */
export function createFootnoteURL(
  translationId: Translation['id'],
  sura: number,
  ayah: number,
  footnoteIndex: number
): string {
  return translationURLToString({
    type: 'footnote',
    translationId,
    sura,
    ayah,
    footnoteIndex,
  });
}

/**
 * Create a read more URL.
 */
export function createReadMoreURL(
  translationId: Translation['id'],
  sura: number,
  ayah: number
): string {
  return translationURLToString({
    type: 'readMore',
    translationId,
    sura,
    ayah,
  });
}

