/**
 * Note.swift → note.ts
 *
 * Model for user notes/highlights on verses.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../quran-kit/types';
import { compareAyahs } from '../quran-kit/types';

/**
 * Color options for notes/highlights.
 */
export enum NoteColor {
  Red = 0,
  Green = 1,
  Blue = 2,
  Yellow = 3,
  Purple = 4,
}

/**
 * All available note colors.
 */
export const ALL_NOTE_COLORS: readonly NoteColor[] = [
  NoteColor.Red,
  NoteColor.Green,
  NoteColor.Blue,
  NoteColor.Yellow,
  NoteColor.Purple,
];

/**
 * Gets the hex color value for a NoteColor.
 */
export function noteColorHex(color: NoteColor): string {
  switch (color) {
    case NoteColor.Red:
      return '#E57373';
    case NoteColor.Green:
      return '#81C784';
    case NoteColor.Blue:
      return '#64B5F6';
    case NoteColor.Yellow:
      return '#FFD54F';
    case NoteColor.Purple:
      return '#BA68C8';
  }
}

/**
 * Gets the name of a NoteColor.
 */
export function noteColorName(color: NoteColor): string {
  switch (color) {
    case NoteColor.Red:
      return 'Red';
    case NoteColor.Green:
      return 'Green';
    case NoteColor.Blue:
      return 'Blue';
    case NoteColor.Yellow:
      return 'Yellow';
    case NoteColor.Purple:
      return 'Purple';
  }
}

/**
 * Represents a user note on one or more verses.
 */
export interface Note {
  /** The verses this note applies to */
  readonly verses: ReadonlySet<IAyahNumber>;
  /** When the note was last modified */
  readonly modifiedDate: Date;
  /** The highlight color */
  readonly color: NoteColor;
  /** The note text (optional) */
  readonly note: string | undefined;
}

/**
 * Creates a Note.
 */
export function createNote(params: {
  verses: Set<IAyahNumber>;
  modifiedDate: Date;
  color: NoteColor;
  note?: string;
}): Note {
  return {
    verses: params.verses,
    modifiedDate: params.modifiedDate,
    color: params.color,
    note: params.note,
  };
}

/**
 * Creates a Note with the current time.
 */
export function createNoteNow(params: {
  verses: Set<IAyahNumber>;
  color: NoteColor;
  note?: string;
}): Note {
  return {
    verses: params.verses,
    modifiedDate: new Date(),
    color: params.color,
    note: params.note,
  };
}

/**
 * Gets the first (earliest) verse in the note.
 */
export function noteFirstVerse(note: Note): IAyahNumber {
  const sorted = Array.from(note.verses).sort(compareAyahs);
  return sorted[0];
}

/**
 * Updates the note text.
 */
export function updateNoteText(note: Note, newText: string | undefined): Note {
  return {
    ...note,
    note: newText,
    modifiedDate: new Date(),
  };
}

/**
 * Updates the note color.
 */
export function updateNoteColor(note: Note, newColor: NoteColor): Note {
  return {
    ...note,
    color: newColor,
    modifiedDate: new Date(),
  };
}

/**
 * Checks if a verse is in the note.
 */
export function noteContainsVerse(note: Note, verse: IAyahNumber): boolean {
  for (const v of note.verses) {
    if (v.sura.suraNumber === verse.sura.suraNumber && v.ayah === verse.ayah) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if two Notes are equal.
 */
export function notesEqual(a: Note, b: Note): boolean {
  if (a.verses.size !== b.verses.size) return false;
  if (a.modifiedDate.getTime() !== b.modifiedDate.getTime()) return false;
  if (a.color !== b.color) return false;
  if (a.note !== b.note) return false;

  // Check verses
  for (const verse of a.verses) {
    if (!noteContainsVerse({ ...b, verses: b.verses }, verse)) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two Notes by modified date (most recent first).
 */
export function compareNotesByModified(a: Note, b: Note): number {
  return b.modifiedDate.getTime() - a.modifiedDate.getTime();
}

/**
 * Compares two Notes by first verse.
 */
export function compareNotesByVerse(a: Note, b: Note): number {
  return compareAyahs(noteFirstVerse(a), noteFirstVerse(b));
}

