/**
 * TranslationPersistence - Active translations management
 *
 * Translated from quran-ios/Data/TranslationPersistence
 *
 * This module provides:
 * - Interface for managing downloaded translations
 * - SQLite implementation for translation storage
 */

export type { ActiveTranslationsPersistence } from './active-translations-persistence';
export {
  SQLiteActiveTranslationsPersistence,
  createActiveTranslationsPersistence,
} from './active-translations-persistence';

