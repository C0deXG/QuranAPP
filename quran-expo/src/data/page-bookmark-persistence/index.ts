/**
 * PageBookmarkPersistence - Page bookmark storage
 *
 * Translated from quran-ios/Data/PageBookmarkPersistence
 *
 * This module provides:
 * - Interface for page bookmark persistence
 * - SQLite implementation
 * - Uniquifier for sync operations
 */

export type {
  PageBookmarkPersistence,
  PageBookmarkPersistenceModel,
} from './page-bookmark-persistence';

export {
  SQLitePageBookmarkPersistence,
  PageBookmarkUniquifier,
  createPageBookmarkPersistence,
  createPageBookmarkPersistenceModel,
} from './page-bookmark-persistence';

