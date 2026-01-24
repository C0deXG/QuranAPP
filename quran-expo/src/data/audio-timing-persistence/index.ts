/**
 * AudioTimingPersistence - Audio timing queries
 *
 * Translated from quran-ios/Data/AudioTimingPersistence
 *
 * This module provides:
 * - Interface for ayah timing data retrieval
 * - SQLite implementation for timing database queries
 */

export type { AyahTimingPersistence } from './ayah-timing-persistence';
export {
  SQLiteAyahTimingPersistence,
  createAyahTimingPersistence,
} from './ayah-timing-persistence';

