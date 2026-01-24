/**
 * Note.Color++.swift → NoteColors.ts
 *
 * Color definitions for note highlights.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { NoteColor } from '../../../model/quran-annotations';

// ============================================================================
// Note Color Mappings
// ============================================================================

/**
 * Maps NoteColor enum to hex color values.
 * These match the exact iOS color literals.
 */
export const NoteColorValues: Record<NoteColor, string> = {
  [NoteColor.Red]: '#FFB0C9',    // rgba(0.9976, 0.6918, 0.7906, 1)
  [NoteColor.Green]: '#C1EC70',  // rgba(0.7582, 0.9266, 0.4418, 1)
  [NoteColor.Blue]: '#ADD7FE',   // rgba(0.6777, 0.8418, 0.9947, 1)
  [NoteColor.Yellow]: '#FCEC63', // rgba(0.9911, 0.9236, 0.3887, 1)
  [NoteColor.Purple]: '#D8B1FE', // rgba(0.8483, 0.6955, 0.9966, 1)
};

/**
 * Sorted note colors in display order.
 */
export const sortedNoteColors: NoteColor[] = [
  NoteColor.Yellow,
  NoteColor.Green,
  NoteColor.Blue,
  NoteColor.Red,
  NoteColor.Purple,
];

/**
 * Gets the hex color value for a NoteColor.
 */
export function getNoteColorValue(color: NoteColor): string {
  return NoteColorValues[color];
}

/**
 * Gets the display name for a NoteColor.
 */
export function getNoteColorName(color: NoteColor): string {
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

