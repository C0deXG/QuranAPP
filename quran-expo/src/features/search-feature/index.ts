/**
 * SearchFeature - Search screen
 *
 * Translated from quran-ios/Features/SearchFeature
 *
 * This module provides:
 * - SearchBuilder for creating the search screen
 * - SearchViewModel for managing search state
 * - SearchScreen component for rendering
 * - Search type definitions
 */

// Types
export {
  type SearchUIState,
  type SearchState,
  type KeyboardState,
  SearchUIState as SearchUIStateFactory,
  SearchState as SearchStateFactory,
} from './search-types';

// View Model
export {
  SearchViewModel,
  type SearchViewState,
  initialSearchViewState,
} from './search-view-model';

// Screen
export { SearchScreen, type SearchScreenProps } from './SearchScreen';

// Builder
export { SearchBuilder } from './search-builder';

