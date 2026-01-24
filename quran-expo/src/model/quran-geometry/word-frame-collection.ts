/**
 * WordFrameCollection.swift → word-frame-collection.ts
 *
 * Collection of word frames for a page.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber, IWord } from '../quran-kit/types';
import type { Point } from './geometry-types';
import { rectContainsPoint } from './geometry-types';
import type { WordFrame } from './word-frame';
import { wordFrameRect } from './word-frame';
import type { WordFrameLine } from './word-frame-line';
import { wordFrameLinesEqual } from './word-frame-line';
import type { WordFrameScale } from './word-frame-scale';
import { scaleRect } from './word-frame-scale';

/**
 * Collection of word frames organized by lines.
 */
export interface WordFrameCollection {
  /** Lines of word frames */
  readonly lines: readonly WordFrameLine[];
}

/**
 * Creates a WordFrameCollection.
 */
export function createWordFrameCollection(
  lines: WordFrameLine[]
): WordFrameCollection {
  return { lines };
}

/**
 * Gets all word frames for a specific verse.
 */
export function wordFramesForVerse(
  collection: WordFrameCollection,
  verse: IAyahNumber
): WordFrame[] {
  // Defensive check: verify collection exists and lines is an array
  if (!collection || !Array.isArray((collection as any).lines)) {
    console.warn(`[WordFrameCollection] collection.lines is not an array for verse ${verse.sura.suraNumber}:${verse.ayah}! type: ${typeof (collection as any)?.lines}`);
    return [];
  }

  // Use reduce instead of flatMap for better compatibility
  const allFrames = collection.lines.reduce(
    (acc, line) => acc.concat(line.frames),
    [] as WordFrame[]
  );

  return allFrames.filter(
    (frame) =>
      frame.word.verse.sura.suraNumber === verse.sura.suraNumber &&
      frame.word.verse.ayah === verse.ayah
  );
}

/**
 * Gets all line frames that contain a specific verse.
 */
export function lineFramesForVerse(
  collection: WordFrameCollection,
  verse: IAyahNumber
): WordFrameLine[] {
  return collection.lines.filter((line) =>
    line.frames.some(
      (frame) =>
        frame.word.verse.sura.suraNumber === verse.sura.suraNumber &&
        frame.word.verse.ayah === verse.ayah
    )
  );
}

/**
 * Gets the word frame for a specific word.
 */
export function wordFrameForWord(
  collection: WordFrameCollection,
  word: IWord
): WordFrame | undefined {
  const frames = wordFramesForVerse(collection, word.verse);
  return frames.find((frame) => frame.word.wordNumber === word.wordNumber);
}

/**
 * Gets the word at a specific location.
 */
export function wordAtLocation(
  collection: WordFrameCollection,
  location: Point,
  imageScale: WordFrameScale
): IWord | undefined {
  const allFrames = collection.lines.flatMap((line) => line.frames);

  for (const frame of allFrames) {
    const rect = wordFrameRect(frame);
    const scaledRect = scaleRect(rect, imageScale);
    if (rectContainsPoint(scaledRect, location)) {
      return frame.word;
    }
  }

  return undefined;
}

/**
 * Gets the top padding for a line.
 */
export function topPaddingAtLine(
  collection: WordFrameCollection,
  lineIndex: number,
  scale: WordFrameScale
): number {
  const topLine =
    lineIndex === 0 ? 0 : collection.lines[lineIndex - 1].frames[0].maxY;
  const padding = collection.lines[lineIndex].frames[0].minY - topLine;
  return padding * scale.scale;
}

/**
 * Gets all word frames in the collection.
 */
export function allWordFrames(collection: WordFrameCollection): WordFrame[] {
  return collection.lines.flatMap((line) => line.frames);
}

/**
 * Checks if two word frame collections are equal.
 */
export function wordFrameCollectionsEqual(
  a: WordFrameCollection,
  b: WordFrameCollection
): boolean {
  if (a.lines.length !== b.lines.length) {
    return false;
  }
  for (let i = 0; i < a.lines.length; i++) {
    if (!wordFrameLinesEqual(a.lines[i], b.lines[i])) {
      return false;
    }
  }
  return true;
}

