/**
 * NoteItem.swift → note-item.ts
 *
 * Data model for note list items.
 *
 * Quran.com. All rights reserved.
 */

import type { Note } from '../../model/quran-annotations';
import type { AyahNumber } from '../../model/quran-kit';

// ============================================================================
// NoteItem
// ============================================================================

/**
 * Represents a note with its verse text for display.
 */
export interface NoteItem {
  /** The note data */
  note: Note;
  /** The Arabic text of the verses */
  verseText: string;
}

/**
 * Creates a NoteItem.
 */
export function createNoteItem(note: Note, verseText: string): NoteItem {
  return { note, verseText };
}

/**
 * Gets the unique ID for a NoteItem.
 * Uses the first verse's key as the ID.
 */
export function getNoteItemId(item: NoteItem): string {
  const verses = Array.from(item.note.verses);
  return verses.map((v) => `${v.sura.suraNumber}:${v.ayah}`).join(',');
}

/**
 * Compares two NoteItems for equality.
 */
export function noteItemsEqual(a: NoteItem, b: NoteItem): boolean {
  if (a.note.verses.size !== b.note.verses.size) {
    return false;
  }

  const aVerses = Array.from(a.note.verses);
  const bVerses = Array.from(b.note.verses);

  return aVerses.every((av, i) => {
    const bv = bVerses[i];
    return av.sura.suraNumber === bv.sura.suraNumber && av.ayah === bv.ayah;
  });
}

