/**
 * SearchResults.swift → search-results.ts
 *
 * Search result models.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../quran-kit/types';
import type { Translation } from './translation';
import type { StringRange } from './translated-verses';

/**
 * A single search result.
 */
export interface SearchResult {
  /** The matched text */
  readonly text: string;
  /** Ranges within the text that matched the query */
  readonly ranges: readonly StringRange[];
  /** The verse where this result was found */
  readonly ayah: IAyahNumber;
}

/**
 * Creates a SearchResult.
 */
export function createSearchResult(params: {
  text: string;
  ranges: StringRange[];
  ayah: IAyahNumber;
}): SearchResult {
  return {
    text: params.text,
    ranges: params.ranges,
    ayah: params.ayah,
  };
}

/**
 * Gets a unique ID for a search result.
 */
export function searchResultId(result: SearchResult): string {
  return `${result.ayah.sura.suraNumber}:${result.ayah.ayah}`;
}

/**
 * Checks if two search results are equal.
 */
export function searchResultsEqual(a: SearchResult, b: SearchResult): boolean {
  if (a.text !== b.text) return false;
  if (a.ayah.sura.suraNumber !== b.ayah.sura.suraNumber) return false;
  if (a.ayah.ayah !== b.ayah.ayah) return false;
  if (a.ranges.length !== b.ranges.length) return false;

  for (let i = 0; i < a.ranges.length; i++) {
    if (a.ranges[i].start !== b.ranges[i].start) return false;
    if (a.ranges[i].end !== b.ranges[i].end) return false;
  }

  return true;
}

/**
 * Source of search results.
 */
export type SearchResultSource =
  | { type: 'quran' }
  | { type: 'translation'; translation: Translation };

/**
 * Creates a Quran search source.
 */
export function searchSourceQuran(): SearchResultSource {
  return { type: 'quran' };
}

/**
 * Creates a translation search source.
 */
export function searchSourceTranslation(translation: Translation): SearchResultSource {
  return { type: 'translation', translation };
}

/**
 * Gets the display name for a search source.
 */
export function searchSourceName(source: SearchResultSource): string {
  switch (source.type) {
    case 'quran':
      return 'Quran';
    case 'translation':
      return 'Translation';
  }
}

/**
 * Gets a unique ID for a search source.
 */
export function searchSourceId(source: SearchResultSource): string {
  switch (source.type) {
    case 'quran':
      return 'quran';
    case 'translation':
      return `translation-${source.translation.id}`;
  }
}

/**
 * Compares two search sources for sorting.
 */
export function compareSearchSources(a: SearchResultSource, b: SearchResultSource): number {
  if (a.type === 'quran' && b.type === 'translation') return -1;
  if (a.type === 'translation' && b.type === 'quran') return 1;
  if (a.type === 'translation' && b.type === 'translation') {
    return a.translation.id - b.translation.id;
  }
  return 0;
}

/**
 * Collection of search results from a single source.
 */
export interface SearchResults {
  /** The source of these results */
  readonly source: SearchResultSource;
  /** The individual results */
  readonly items: readonly SearchResult[];
}

/**
 * Creates a SearchResults collection.
 */
export function createSearchResults(params: {
  source: SearchResultSource;
  items: SearchResult[];
}): SearchResults {
  return {
    source: params.source,
    items: params.items,
  };
}

/**
 * Gets a unique ID for search results.
 */
export function searchResultsId(results: SearchResults): string {
  return searchSourceId(results.source);
}

/**
 * Checks if two SearchResults are equal.
 */
export function searchResultsCollectionEqual(a: SearchResults, b: SearchResults): boolean {
  if (searchSourceId(a.source) !== searchSourceId(b.source)) return false;
  if (a.items.length !== b.items.length) return false;

  for (let i = 0; i < a.items.length; i++) {
    if (!searchResultsEqual(a.items[i], b.items[i])) return false;
  }

  return true;
}

