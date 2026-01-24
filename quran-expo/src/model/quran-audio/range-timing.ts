/**
 * RangeTiming.swift → range-timing.ts
 *
 * Timing for a range of suras.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { ISura } from '../quran-kit/types';
import type { SuraTiming } from './sura-timing';
import type { Timing } from './timing';

/**
 * Represents the timing for a range of suras.
 */
export interface RangeTiming {
  /** Timings keyed by sura number */
  readonly timings: ReadonlyMap<number, SuraTiming>;
  /** End time of the range (optional) */
  readonly endTime: Timing | undefined;
}

/**
 * Creates a RangeTiming from a map.
 */
export function createRangeTiming(
  timings: Map<number, SuraTiming>,
  endTime?: Timing
): RangeTiming {
  return {
    timings,
    endTime,
  };
}

/**
 * Creates a RangeTiming from suras.
 */
export function createRangeTimingFromSuras(
  timings: Array<{ sura: ISura; timing: SuraTiming }>,
  endTime?: Timing
): RangeTiming {
  const map = new Map<number, SuraTiming>();
  for (const { sura, timing } of timings) {
    map.set(sura.suraNumber, timing);
  }
  return { timings: map, endTime };
}

/**
 * Gets the timing for a specific sura.
 */
export function getSuraTiming(
  rangeTiming: RangeTiming,
  suraNumber: number
): SuraTiming | undefined {
  return rangeTiming.timings.get(suraNumber);
}

/**
 * Gets the timing for a specific sura by ISura.
 */
export function getSuraTimingBySura(
  rangeTiming: RangeTiming,
  sura: ISura
): SuraTiming | undefined {
  return rangeTiming.timings.get(sura.suraNumber);
}

/**
 * Gets all sura numbers in the range.
 */
export function rangeTimingSuras(rangeTiming: RangeTiming): number[] {
  return Array.from(rangeTiming.timings.keys()).sort((a, b) => a - b);
}

