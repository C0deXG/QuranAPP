/**
 * AyahMenuUI.swift → AyahMenuTypes.ts
 *
 * Types for the Ayah context menu.
 *
 * Quran.com. All rights reserved.
 */

import type { NoteColor } from '../../../model/quran-annotations';

// ============================================================================
// Note State
// ============================================================================

/**
 * State of a note/highlight on selected verses.
 */
export enum NoteState {
  /** No highlight or note */
  NoHighlight = 'noHighlight',
  /** Has highlight but no note */
  Highlighted = 'highlighted',
  /** Has both highlight and note */
  Noted = 'noted',
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Actions available from the Ayah menu.
 */
export interface AyahMenuActions {
  /** Play audio from selected verse */
  play: () => Promise<void>;
  /** Repeat selected verses */
  repeatVerses: () => Promise<void>;
  /** Highlight with a specific color */
  highlight: (color: NoteColor) => Promise<void>;
  /** Add or edit a note */
  addNote: () => Promise<void>;
  /** Delete note/highlight */
  deleteNote: () => Promise<void>;
  /** Show translation */
  showTranslation: () => Promise<void>;
  /** Copy verse text */
  copy: () => Promise<void>;
  /** Share verse */
  share: () => Promise<void>;
}

// ============================================================================
// Data Object
// ============================================================================

/**
 * Data passed to the Ayah menu.
 */
export interface AyahMenuDataObject {
  /** Current highlight color */
  highlightingColor: NoteColor;
  /** Current note state */
  state: NoteState;
  /** Subtitle for play action (e.g., "To the end of Juz'") */
  playSubtitle: string;
  /** Subtitle for repeat action (e.g., "selected verses") */
  repeatSubtitle: string;
  /** Available actions */
  actions: AyahMenuActions;
  /** Whether this is a translation view (hides translation option) */
  isTranslationView: boolean;
}

