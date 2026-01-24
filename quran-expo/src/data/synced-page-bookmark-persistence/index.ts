/**
 * SyncedPageBookmarkPersistence - Cloud-synced page bookmarks
 *
 * Translated from quran-ios/Data/SyncedPageBookmarkPersistence
 *
 * This module provides:
 * - Interface for synced bookmark persistence
 * - SQLite implementation with its own database file
 * - Remote ID tracking for cloud sync
 */

export type {
  SyncedPageBookmarkPersistence,
  SyncedPageBookmarkPersistenceModel,
  SyncedBookmarkChangeCallback,
} from './synced-page-bookmark-persistence';

export {
  SQLiteSyncedPageBookmarkPersistence,
  createSyncedPageBookmarkPersistence,
  createSyncedPageBookmarkPersistenceModel,
} from './synced-page-bookmark-persistence';

