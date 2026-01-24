/**
 * NotePersistence - Notes and highlights storage
 *
 * Translated from quran-ios/Data/NotePersistence
 *
 * This module provides:
 * - Interface for note persistence
 * - SQLite implementation
 * - Verse-to-note relationships
 * - Note merging logic
 * - Uniquifier for sync operations
 */

export type {
  NotePersistence,
  NotePersistenceModel,
  VersePersistenceModel,
} from './note-persistence';

export {
  SQLiteNotePersistence,
  NoteUniquifier,
  createNotePersistence,
  createNotePersistenceModel,
  createVersePersistenceModel,
  versesEqual,
  notesEqual,
} from './note-persistence';

