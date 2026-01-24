/**
 * Timing.swift → timing.ts
 *
 * Timing structure for audio playback.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Represents a timing value in milliseconds.
 */
export interface Timing {
  /** Time in milliseconds */
  readonly time: number;
  /** Time in seconds (computed) */
  readonly seconds: number;
}

/**
 * Creates a Timing from milliseconds.
 */
export function createTiming(timeMs: number): Timing {
  return { 
    time: timeMs,
    get seconds() { return this.time / 1000; }
  };
}

/**
 * Creates a Timing from seconds.
 */
export function createTimingFromSeconds(secs: number): Timing {
  const timeMs = Math.round(secs * 1000);
  return { 
    time: timeMs,
    get seconds() { return this.time / 1000; }
  };
}

/**
 * Gets the timing value in seconds.
 */
export function timingSeconds(timing: Timing): number {
  return timing.time / 1000;
}

/**
 * Checks if two timings are equal.
 */
export function timingsEqual(a: Timing, b: Timing): boolean {
  return a.time === b.time;
}

/**
 * Compares two timings for sorting.
 */
export function compareTimings(a: Timing, b: Timing): number {
  return a.time - b.time;
}

/**
 * Adds two timings together.
 */
export function addTimings(a: Timing, b: Timing): Timing {
  return createTiming(a.time + b.time);
}

/**
 * Subtracts timing b from timing a.
 */
export function subtractTimings(a: Timing, b: Timing): Timing {
  return createTiming(a.time - b.time);
}

/**
 * Gets the duration between two timings.
 */
export function timingDuration(start: Timing, end: Timing): number {
  return timingSeconds(end) - timingSeconds(start);
}

