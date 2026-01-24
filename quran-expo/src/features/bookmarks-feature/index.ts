/**
 * BookmarksFeature - Bookmarks list
 *
 * Translated from quran-ios/Features/BookmarksFeature
 *
 * This module provides:
 * - BookmarksBuilder for creating the bookmarks screen
 * - BookmarksViewModel for managing bookmarks state
 * - BookmarksScreen component for rendering
 */

// View Model
export {
  BookmarksViewModel,
  type BookmarksViewState,
  initialBookmarksViewState,
} from './bookmarks-view-model';

// Screen
export { BookmarksScreen, type BookmarksScreenProps } from './BookmarksScreen';

// Builder
export { BookmarksBuilder } from './bookmarks-builder';

