/**
 * LastPagePersistence - Last page tracking
 *
 * Translated from quran-ios/Data/LastPagePersistence
 *
 * This module provides:
 * - Interface for last page persistence
 * - SQLite implementation
 * - Overflow handling (max 3 pages)
 * - Uniquifier for sync operations
 */

export type {
  LastPagePersistence,
  LastPagePersistenceModel,
} from './last-page-persistence';

export {
  SQLiteLastPagePersistence,
  LastPageOverflowHandler,
  LastPageUniquifier,
  createLastPagePersistence,
  createLastPagePersistenceModel,
} from './last-page-persistence';

