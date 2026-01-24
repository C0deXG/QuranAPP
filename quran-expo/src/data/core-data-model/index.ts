/**
 * CoreDataModel - Database schema definitions
 *
 * Translated from quran-ios/Data/CoreDataModel
 *
 * This module provides:
 * - SQLite schema definitions for annotations
 * - Column and table name constants
 * - Row types for query results
 */

// Schema definitions
export {
  // Column constants
  NoteColumns,
  VerseColumns,
  PageBookmarkColumns,
  LastPageColumns,
  // Table names
  TableNames,
  // Create statements
  CREATE_NOTES_TABLE,
  CREATE_NOTE_VERSES_TABLE,
  CREATE_PAGE_BOOKMARKS_TABLE,
  CREATE_LAST_PAGES_TABLE,
  CREATE_INDEXES,
  ALL_CREATE_STATEMENTS,
  // Utilities
  dateToString,
  stringToDate,
} from './schema';

export type {
  NoteColumn,
  VerseColumn,
  PageBookmarkColumn,
  LastPageColumn,
  TableName,
  NoteRow,
  VerseRow,
  PageBookmarkRow,
  LastPageRow,
} from './schema';

// Resources
export {
  ANNOTATIONS_DB_NAME,
  ANNOTATIONS_SCHEMA_VERSION,
  AnnotationsDatabaseConfig,
  getAnnotationsDatabasePath,
} from './resources';

