/**
 * QuranHighlights.swift → quran-highlights.ts
 *
 * Model for tracking various highlights on Quran pages.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber, IWord } from '../quran-kit/types';
import type { Note } from './note';

/**
 * Represents all highlights currently displayed on a Quran page.
 */
export interface QuranHighlights {
  /** Verses being read (current playback position) */
  readonly readingVerses: readonly IAyahNumber[];
  /** Verses selected for sharing */
  readonly shareVerses: readonly IAyahNumber[];
  /** Verses matching a search */
  readonly searchVerses: readonly IAyahNumber[];
  /** Verses with notes, keyed by verse ID */
  readonly noteVerses: ReadonlyMap<string, Note>;
  /** Currently pointed word (word-by-word mode) */
  readonly pointedWord: IWord | undefined;
}

/**
 * Creates an empty QuranHighlights.
 */
export function createQuranHighlights(): QuranHighlights {
  return {
    readingVerses: [],
    shareVerses: [],
    searchVerses: [],
    noteVerses: new Map(),
    pointedWord: undefined,
  };
}

/**
 * Creates a QuranHighlights with the specified values.
 */
export function createQuranHighlightsWithValues(params: {
  readingVerses?: IAyahNumber[];
  shareVerses?: IAyahNumber[];
  searchVerses?: IAyahNumber[];
  noteVerses?: Map<string, Note>;
  pointedWord?: IWord;
}): QuranHighlights {
  return {
    readingVerses: params.readingVerses ?? [],
    shareVerses: params.shareVerses ?? [],
    searchVerses: params.searchVerses ?? [],
    noteVerses: params.noteVerses ?? new Map(),
    pointedWord: params.pointedWord,
  };
}

/**
 * Gets a unique key for an ayah (for use in maps).
 */
export function ayahKey(verse: IAyahNumber): string {
  return `${verse.sura.suraNumber}:${verse.ayah}`;
}

// ============================================================================
// Update Functions
// ============================================================================

/**
 * Sets the reading verses.
 */
export function setReadingVerses(
  highlights: QuranHighlights,
  verses: IAyahNumber[]
): QuranHighlights {
  return { ...highlights, readingVerses: verses };
}

/**
 * Sets the share verses.
 */
export function setShareVerses(
  highlights: QuranHighlights,
  verses: IAyahNumber[]
): QuranHighlights {
  return { ...highlights, shareVerses: verses };
}

/**
 * Sets the search verses.
 */
export function setSearchVerses(
  highlights: QuranHighlights,
  verses: IAyahNumber[]
): QuranHighlights {
  return { ...highlights, searchVerses: verses };
}

/**
 * Sets a note for a verse.
 */
export function setNoteForVerse(
  highlights: QuranHighlights,
  verse: IAyahNumber,
  note: Note
): QuranHighlights {
  const newNoteVerses = new Map(highlights.noteVerses);
  newNoteVerses.set(ayahKey(verse), note);
  return { ...highlights, noteVerses: newNoteVerses };
}

/**
 * Removes a note for a verse.
 */
export function removeNoteForVerse(
  highlights: QuranHighlights,
  verse: IAyahNumber
): QuranHighlights {
  const newNoteVerses = new Map(highlights.noteVerses);
  newNoteVerses.delete(ayahKey(verse));
  return { ...highlights, noteVerses: newNoteVerses };
}

/**
 * Sets the pointed word.
 */
export function setPointedWord(
  highlights: QuranHighlights,
  word: IWord | undefined
): QuranHighlights {
  return { ...highlights, pointedWord: word };
}

/**
 * Clears all highlights.
 */
export function clearHighlights(highlights: QuranHighlights): QuranHighlights {
  return createQuranHighlights();
}

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Checks if highlights need scrolling when compared to old value.
 */
export function needsScrolling(
  newHighlights: QuranHighlights,
  oldHighlights: QuranHighlights
): boolean {
  // Check readingHighlights & searchHighlights
  if (!versesArrayEqual(newHighlights.readingVerses, oldHighlights.readingVerses)) {
    return true;
  }
  if (!versesArrayEqual(newHighlights.searchVerses, oldHighlights.searchVerses)) {
    return true;
  }
  return false;
}

/**
 * Gets the first verse to scroll to.
 */
export function firstScrollingVerse(
  highlights: QuranHighlights
): IAyahNumber | undefined {
  if (highlights.readingVerses.length > 0) {
    return highlights.readingVerses[0];
  }
  if (highlights.searchVerses.length > 0) {
    return highlights.searchVerses[0];
  }
  return undefined;
}

/**
 * Gets the verse to scroll to when highlights change.
 */
export function verseToScrollTo(
  newHighlights: QuranHighlights,
  oldHighlights: QuranHighlights
): IAyahNumber | undefined {
  // Check share verses
  if (!versesArrayEqual(newHighlights.shareVerses, oldHighlights.shareVerses)) {
    if (newHighlights.shareVerses.length > 0) {
      return newHighlights.shareVerses[newHighlights.shareVerses.length - 1];
    }
  }

  // Check reading verses
  if (!versesArrayEqual(newHighlights.readingVerses, oldHighlights.readingVerses)) {
    if (newHighlights.readingVerses.length > 0) {
      return newHighlights.readingVerses[newHighlights.readingVerses.length - 1];
    }
  }

  return undefined;
}

/**
 * Checks if two verse arrays are equal.
 */
function versesArrayEqual(
  a: readonly IAyahNumber[],
  b: readonly IAyahNumber[]
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].sura.suraNumber !== b[i].sura.suraNumber ||
      a[i].ayah !== b[i].ayah
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if two QuranHighlights are equal.
 */
export function quranHighlightsEqual(
  a: QuranHighlights,
  b: QuranHighlights
): boolean {
  if (!versesArrayEqual(a.readingVerses, b.readingVerses)) return false;
  if (!versesArrayEqual(a.shareVerses, b.shareVerses)) return false;
  if (!versesArrayEqual(a.searchVerses, b.searchVerses)) return false;
  if (a.noteVerses.size !== b.noteVerses.size) return false;

  // Check pointed word
  if (a.pointedWord === undefined && b.pointedWord !== undefined) return false;
  if (a.pointedWord !== undefined && b.pointedWord === undefined) return false;
  if (a.pointedWord && b.pointedWord) {
    if (
      a.pointedWord.verse.sura.suraNumber !== b.pointedWord.verse.sura.suraNumber ||
      a.pointedWord.verse.ayah !== b.pointedWord.verse.ayah ||
      a.pointedWord.wordNumber !== b.pointedWord.wordNumber
    ) {
      return false;
    }
  }

  return true;
}

