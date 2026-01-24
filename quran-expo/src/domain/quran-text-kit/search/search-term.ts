/**
 * SearchTerm.swift → search-term.ts
 *
 * Search term processing with Arabic similarity support.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../../../model/quran-kit/types';
import type { SearchResult } from '../../../model/quran-text';
import { createSearchResult } from '../../../model/quran-text';

// ============================================================================
// Search Regex Patterns
// ============================================================================

/** Match unicode category Separators (Z). */
const SPACE_REGEX = /\p{Z}+/gu;

/** Match unicode categories Marks (M), Punctuation (P), Symbols (S), Control (C) and Arabic Tatweel. */
const INVALID_SEARCH_REGEX = /[\p{M}\p{P}\p{S}\p{C}\u0640]/gu;

/** Arabic similarity characters. */
const ARABIC_SIMILARITY_REGEX = /[\u0627\u0623\u0621\u062a\u0629\u0647\u0649\u0626]/g;

/** Arabic similarity replacements map. */
const ARABIC_SIMILARITY_REPLACEMENTS: Record<string, string> = {
  // given: ا match: آأإاﻯ
  '\u0627': '\u0622\u0623\u0625\u0627\u0649',
  // given: ﺃ match: ﺃﺀﺆﺋ
  '\u0623': '\u0621\u0623\u0624\u0626',
  // given: ﺀ match: ﺀﺃﺆ
  '\u0621': '\u0621\u0623\u0624\u0626',
  // given: ﺕ match: ﺕﺓ
  '\u062a': '\u062a\u0629',
  // given: ﺓ match: ﺓتﻫ
  '\u0629': '\u0629\u062a\u0647',
  // given: ه match: ةه
  '\u0647': '\u0647\u0629',
  // given: ﻯ match: ﻯي
  '\u0649': '\u0649\u064a',
  // given: ئ match: ئﻯي
  '\u0626': '\u0626\u0649\u064a',
};

// ============================================================================
// SearchTerm
// ============================================================================

/**
 * Represents a processed search term.
 */
export interface SearchTerm {
  compactQuery: string;
  persistenceQuery: string;
  queryRegex: RegExp;
}

/**
 * Creates a SearchTerm from a raw string.
 */
export function createSearchTerm(value: string): SearchTerm | null {
  const compactQuery = trimmedWords(value);
  if (!compactQuery) {
    return null;
  }

  const persistenceQuery = removeInvalidSearchCharacters(compactQuery);
  const queryRegex = regexForArabicSimilarityCharacters(persistenceQuery);

  if (!queryRegex) {
    return null;
  }

  return {
    compactQuery,
    persistenceQuery,
    queryRegex,
  };
}

/**
 * Creates a regex that handles Arabic similarity characters.
 */
function regexForArabicSimilarityCharacters(value: string): RegExp | null {
  const cleanedValue = removeInvalidSearchCharacters(value);
  let regex = '';

  for (const char of cleanedValue) {
    const replacement = ARABIC_SIMILARITY_REPLACEMENTS[char];
    if (replacement) {
      regex += `[${replacement}]`;
    } else {
      regex += escapeRegex(char);
    }
    // Allow invalid search characters between matches
    regex += '[\\p{M}\\p{P}\\p{S}\\p{C}\\u0640]*';
  }

  try {
    return new RegExp(`(${regex})`, 'giu');
  } catch {
    return null;
  }
}

/**
 * Escapes special regex characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Gets the persistence query with Arabic similarity chars replaced.
 */
export function getPersistenceQueryReplacingArabicSimilarity(term: SearchTerm): string {
  return term.persistenceQuery.replace(ARABIC_SIMILARITY_REGEX, '_');
}

/**
 * Builds autocompletions from search results.
 */
export function buildAutocompletions(term: SearchTerm, searchResults: string[]): string[] {
  const result: string[] = [];
  const added = new Set<string>();

  for (const searchResult of searchResults) {
    for (const text of [searchResult, searchResult.normalize('NFKD')]) {
      const parts = text.split(term.queryRegex);

      for (let i = 1; i < parts.length; i += 2) {
        // parts at odd indices are after matches
        const suffix = parts[i + 1] || '';
        // Include only first 5 words
        const suffixWords = suffix.split(' ').slice(0, 5).join(' ');
        const charSetToTrim = /^[^\w\s]+|[^\w\s]+$/g;
        const trimmedSuffix = suffixWords.replace(charSetToTrim, '');

        if (!trimmedSuffix && suffixWords !== trimmedSuffix) {
          continue;
        }

        const subrow = term.persistenceQuery + trimmedSuffix;
        if (!added.has(subrow)) {
          added.add(subrow);
          result.push(subrow);
        }
      }
    }
  }

  return result;
}

/**
 * Builds search results from verses.
 */
export function buildSearchResults(
  term: SearchTerm,
  verses: Array<{ verse: IAyahNumber; text: string }>
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const { verse, text } of verses) {
    for (const textVariant of [text, text.normalize('NFKD')]) {
      const ranges = findMatchRanges(textVariant, term.queryRegex);

      if (ranges.length > 0) {
        results.push(
          createSearchResult({
            text: textVariant,
            ranges,
            ayah: verse,
          })
        );
        break;
      }
    }
  }

  return results;
}

/**
 * Finds all match ranges in a string.
 */
function findMatchRanges(text: string, regex: RegExp): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  return ranges;
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Removes invalid search characters from a string.
 */
export function removeInvalidSearchCharacters(value: string): string {
  let cleaned = value
    .replace(INVALID_SEARCH_REGEX, '')
    .replace(SPACE_REGEX, ' ');

  // Limit to 1000 characters
  if (cleaned.length > 1000) {
    cleaned = cleaned.substring(0, 1000);
  }

  return cleaned.toLowerCase();
}

/**
 * Trims and normalizes whitespace in words.
 */
export function trimmedWords(value: string): string {
  return value
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(' ');
}

/**
 * Checks if a string contains Arabic characters.
 */
export function containsArabic(value: string): boolean {
  return /\p{Script=Arabic}/u.test(value);
}

/**
 * Checks if a string contains only numbers.
 */
export function containsOnlyNumbers(value: string): boolean {
  const cleaned = removeInvalidSearchCharacters(value);
  return /^[0-9]+$/.test(cleaned);
}

