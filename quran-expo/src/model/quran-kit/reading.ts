/**
 * Reading.swift → reading.ts
 *
 * Reading types (different Quran editions/prints).
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran } from './types';

/**
 * Different Quran reading types/editions.
 */
export enum Reading {
  /** Hafs Madani 1405 edition */
  Hafs1405 = 'hafs_1405',
  /** Hafs Madani 1440 edition */
  Hafs1440 = 'hafs_1440',
  /** Tajweed edition */
  Tajweed = 'tajweed',
  /** Hafs 1421 edition */
  Hafs1421 = 'hafs_1421',
}

/**
 * Sorted readings for display.
 */
export const SORTED_READINGS: Reading[] = [
  Reading.Hafs1405,
  Reading.Tajweed,
  Reading.Hafs1421,
  Reading.Hafs1440,
];

// Lowercase and underscore aliases for compatibility
export namespace Reading {
  export const hafs1405 = Reading.Hafs1405;
  export const hafs1440 = Reading.Hafs1440;
  export const tajweed = Reading.Tajweed;
  export const hafs1421 = Reading.Hafs1421;
  export const hafs_1405 = Reading.Hafs1405;
  export const hafs_1440 = Reading.Hafs1440;
  export const hafs_1421 = Reading.Hafs1421;
}

/**
 * Gets the Quran instance for a reading.
 * Note: This requires the Quran class to be imported to avoid circular dependency.
 * The actual implementation should be done where Quran is available.
 */
export type QuranForReadingFn = (reading: Reading) => IQuran;

let _quranForReading: QuranForReadingFn | undefined;

/**
 * Sets the function to get Quran for a reading.
 * This should be called once during app initialization.
 */
export function setQuranForReading(fn: QuranForReadingFn): void {
  _quranForReading = fn;
}

/**
 * Gets the Quran instance for a reading.
 */
export function quranForReading(reading: Reading): IQuran {
  if (!_quranForReading) {
    throw new Error('quranForReading not initialized. Call setQuranForReading first.');
  }
  return _quranForReading(reading);
}

