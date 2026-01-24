/**
 * EditableNote.swift → EditableNote.ts
 *
 * State model for note editing.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { NoteColor } from '../../../model/quran-annotations';

// ============================================================================
// EditableNote
// ============================================================================

/**
 * State for note editing UI.
 */
export interface EditableNote {
  /** The verse text being annotated */
  ayahText: string;
  /** Relative time since last modification */
  modifiedSince: string;
  /** Currently selected highlight color */
  selectedColor: NoteColor;
  /** The note text content */
  note: string;
}

/**
 * Creates a new EditableNote.
 */
export function createEditableNote(
  ayahText: string,
  modifiedSince: string,
  selectedColor: NoteColor,
  note: string
): EditableNote {
  return {
    ayahText,
    modifiedSince,
    selectedColor,
    note,
  };
}

