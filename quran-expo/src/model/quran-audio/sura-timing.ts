/**
 * SuraTiming.swift → sura-timing.ts
 *
 * Timing for all verses in a sura.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { AyahTiming } from './ayah-timing';
import type { Timing } from './timing';

/**
 * Represents the timing of all verses in a sura.
 */
export interface SuraTiming {
  /** Timings for each verse */
  readonly verses: readonly AyahTiming[];
  /** End time of the sura (optional) */
  readonly endTime: Timing | undefined;
}

/**
 * Creates a SuraTiming.
 */
export function createSuraTiming(
  verses: AyahTiming[],
  endTime?: Timing
): SuraTiming {
  return {
    verses,
    endTime,
  };
}

/**
 * Gets the timing for a specific ayah number within a sura.
 */
export function getAyahTiming(
  suraTiming: SuraTiming,
  ayahNumber: number
): AyahTiming | undefined {
  return suraTiming.verses.find((v) => v.ayah.ayah === ayahNumber);
}

/**
 * Gets the duration of the sura in seconds.
 */
export function suraDuration(suraTiming: SuraTiming): number | undefined {
  if (!suraTiming.endTime || suraTiming.verses.length === 0) {
    return undefined;
  }
  const startTime = suraTiming.verses[0].time.time;
  return (suraTiming.endTime.time - startTime) / 1000;
}

