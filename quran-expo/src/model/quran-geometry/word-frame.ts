/**
 * WordFrame.swift → word-frame.ts
 *
 * Frame information for a word on a page.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IWord } from '../quran-kit/types';
import type { Rect } from './geometry-types';
import { createRectFromMinMax } from './geometry-types';

/**
 * Represents the frame (bounding box) of a word on a page.
 */
export interface WordFrame {
  /** Line number on the page */
  readonly line: number;
  /** The word */
  readonly word: IWord;
  /** Minimum X coordinate */
  readonly minX: number;
  /** Maximum X coordinate */
  readonly maxX: number;
  /** Minimum Y coordinate */
  readonly minY: number;
  /** Maximum Y coordinate */
  readonly maxY: number;
}

/**
 * Creates a WordFrame.
 */
export function createWordFrame(params: {
  line: number;
  word: IWord;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}): WordFrame {
  return {
    line: params.line,
    word: params.word,
    minX: params.minX,
    maxX: params.maxX,
    minY: params.minY,
    maxY: params.maxY,
  };
}

/**
 * Gets the rect for a word frame.
 */
export function wordFrameRect(frame: WordFrame): Rect {
  return createRectFromMinMax(frame.minX, frame.minY, frame.maxX, frame.maxY);
}

/**
 * Checks if two word frames are equal.
 */
export function wordFramesEqual(a: WordFrame, b: WordFrame): boolean {
  return (
    a.line === b.line &&
    a.word.verse.sura.suraNumber === b.word.verse.sura.suraNumber &&
    a.word.verse.ayah === b.word.verse.ayah &&
    a.word.wordNumber === b.word.wordNumber &&
    a.minX === b.minX &&
    a.maxX === b.maxX &&
    a.minY === b.minY &&
    a.maxY === b.maxY
  );
}

/**
 * Gets a hash code for a word frame.
 */
export function wordFrameHashCode(frame: WordFrame): number {
  return (
    frame.line * 10000000 +
    frame.word.verse.sura.suraNumber * 100000 +
    frame.word.verse.ayah * 1000 +
    frame.word.wordNumber
  );
}

/**
 * Serializes a word frame to JSON.
 */
export function wordFrameToJSON(frame: WordFrame): {
  word: { verse: { sura: number; ayah: number }; word: number };
  frame: { x: number; y: number; width: number; height: number };
} {
  const rect = wordFrameRect(frame);
  return {
    word: {
      verse: {
        sura: frame.word.verse.sura.suraNumber,
        ayah: frame.word.verse.ayah,
      },
      word: frame.word.wordNumber,
    },
    frame: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    },
  };
}

