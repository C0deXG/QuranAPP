/**
 * AyahTiming.swift → ayah-timing.ts
 *
 * Timing for a specific verse.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../quran-kit/types';
import type { Timing } from './timing';

/**
 * Represents the timing of a verse in an audio file.
 */
export interface AyahTiming {
  /** The verse */
  readonly ayah: IAyahNumber;
  /** The timing (start time) */
  readonly time: Timing;
}

/**
 * Creates an AyahTiming.
 */
export function createAyahTiming(ayah: IAyahNumber, time: Timing): AyahTiming {
  return { ayah, time };
}

/**
 * Checks if two AyahTimings are equal.
 */
export function ayahTimingsEqual(a: AyahTiming, b: AyahTiming): boolean {
  return (
    a.ayah.sura.suraNumber === b.ayah.sura.suraNumber &&
    a.ayah.ayah === b.ayah.ayah &&
    a.time.time === b.time.time
  );
}

/**
 * Compares two AyahTimings by time.
 */
export function compareAyahTimings(a: AyahTiming, b: AyahTiming): number {
  return a.time.time - b.time.time;
}

