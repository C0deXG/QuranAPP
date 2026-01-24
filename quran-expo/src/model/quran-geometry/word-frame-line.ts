/**
 * WordFrameLine.swift → word-frame-line.ts
 *
 * A line of word frames.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { WordFrame } from './word-frame';
import { wordFramesEqual } from './word-frame';

/**
 * Represents a line of word frames on a page.
 */
export interface WordFrameLine {
  /** Word frames in this line */
  readonly frames: readonly WordFrame[];
}

/**
 * Creates a WordFrameLine.
 */
export function createWordFrameLine(frames: WordFrame[]): WordFrameLine {
  return { frames };
}

/**
 * Checks if two word frame lines are equal.
 */
export function wordFrameLinesEqual(
  a: WordFrameLine,
  b: WordFrameLine
): boolean {
  if (a.frames.length !== b.frames.length) {
    return false;
  }
  for (let i = 0; i < a.frames.length; i++) {
    if (!wordFramesEqual(a.frames[i], b.frames[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Gets a hash code for a word frame line.
 */
export function wordFrameLineHashCode(line: WordFrameLine): number {
  let hash = 0;
  for (const frame of line.frames) {
    hash = hash * 31 + frame.line;
  }
  return hash;
}

