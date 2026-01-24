/**
 * TranslationsParser.swift → translations-parser.ts
 *
 * Parses translations from API response.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { Translation } from '../../model/quran-text';
import { createTranslation } from '../../model/quran-text';

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Translation response from the API.
 */
interface TranslationResponse {
  id: number;
  displayName: string;
  translator?: string | null;
  translatorForeign?: string | null;
  fileUrl: string;
  fileName: string;
  languageCode: string;
  currentVersion: number;
}

/**
 * Translations API response wrapper.
 */
interface TranslationsResponse {
  data: TranslationResponse[];
}

// ============================================================================
// Parser Interface
// ============================================================================

/**
 * Parser for translations data.
 */
export interface TranslationsParser {
  parse(data: string): Translation[];
}

// ============================================================================
// JSON Parser Implementation
// ============================================================================

/**
 * JSON parser for translations.
 */
export class JSONTranslationsParser implements TranslationsParser {
  /**
   * Parses JSON data into translations.
   */
  parse(data: string): Translation[] {
    const response: TranslationsResponse = JSON.parse(data);
    return response.data.map((item) => this.translationFromResponse(item));
  }

  /**
   * Converts a response item to a Translation.
   */
  private translationFromResponse(response: TranslationResponse): Translation {
    return createTranslation({
      id: response.id,
      displayName: response.displayName,
      translator: response.translator ?? undefined,
      translatorForeign: response.translatorForeign ?? undefined,
      fileURL: response.fileUrl,
      fileName: response.fileName,
      languageCode: response.languageCode,
      version: response.currentVersion,
      installedVersion: undefined,
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a JSON translations parser.
 */
export function createTranslationsParser(): TranslationsParser {
  return new JSONTranslationsParser();
}

