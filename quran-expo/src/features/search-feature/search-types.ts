/**
 * SearchTypes.swift → search-types.ts
 *
 * Type definitions for search feature.
 *
 * Quran.com. All rights reserved.
 */

import type { SearchResults } from '../../model/quran-text';

// ============================================================================
// SearchUIState
// ============================================================================

/**
 * Represents the current UI state of the search screen.
 */
export type SearchUIState =
  | { type: 'entry' }
  | { type: 'search'; term: string };

/**
 * Factory functions for SearchUIState.
 */
export const SearchUIState = {
  entry(): SearchUIState {
    return { type: 'entry' };
  },
  search(term: string): SearchUIState {
    return { type: 'search', term };
  },
};

// ============================================================================
// SearchState
// ============================================================================

/**
 * Represents the current state of a search operation.
 */
export type SearchState =
  | { type: 'searching' }
  | { type: 'searchResult'; results: SearchResults[] };

/**
 * Factory functions for SearchState.
 */
export const SearchState = {
  searching(): SearchState {
    return { type: 'searching' };
  },
  searchResult(results: SearchResults[]): SearchState {
    return { type: 'searchResult', results };
  },
};

// ============================================================================
// KeyboardState
// ============================================================================

/**
 * Represents the keyboard visibility state.
 */
export type KeyboardState = 'open' | 'closed';

