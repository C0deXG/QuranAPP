/**
 * VerseTextPersistence - Verse text queries
 *
 * Translated from quran-ios/Data/VerseTextPersistence
 *
 * This module provides:
 * - Interface for verse text retrieval
 * - Search and autocomplete functionality
 * - Translation text with reference support
 * - Database version queries
 */

export type {
  SearchableTextPersistence,
  VerseTextPersistence,
  TranslationTextModel,
  TranslationVerseTextPersistence,
  DatabaseVersionPersistence,
} from './verse-text-persistence';

export {
  VerseTextTable,
  ayahKey,
  SQLiteQuranVerseTextPersistence,
  SQLiteTranslationVerseTextPersistence,
  SQLiteDatabaseVersionPersistence,
  createQuranVerseTextPersistence,
  createTranslationVerseTextPersistence,
  createDatabaseVersionPersistence,
} from './verse-text-persistence';

