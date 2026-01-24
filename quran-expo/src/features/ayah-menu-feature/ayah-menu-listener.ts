/**
 * AyahMenuViewModel.swift (AyahMenuListener) → ayah-menu-listener.ts
 *
 * Listener interface for ayah menu events.
 *
 * Quran.com. All rights reserved.
 */

import type { AyahNumber } from '../../model/quran-kit';
import type { Note } from '../../model/quran-annotations';
import type { Point } from '../../model/quran-geometry';

// ============================================================================
// AyahMenuListener
// ============================================================================

/**
 * Listener for ayah menu events.
 *
 * 1:1 translation of iOS AyahMenuListener.
 */
export interface AyahMenuListener {
  /**
   * Dismiss the ayah menu.
   */
  dismissAyahMenu(): void;

  /**
   * Play audio from a verse.
   *
   * @param from Starting verse
   * @param to Optional ending verse
   * @param repeatVerses Whether to repeat the verses
   */
  playAudio(from: AyahNumber, to: AyahNumber | null, repeatVerses: boolean): void;

  /**
   * Share text.
   *
   * @param lines Text lines to share
   * @param point Point for popover positioning
   */
  shareText(lines: string[], point: Point): void;

  /**
   * Delete notes.
   *
   * @param notes Notes to delete
   * @param verses Associated verses
   */
  deleteNotes(notes: Note[], verses: AyahNumber[]): Promise<void>;

  /**
   * Show translation for verses.
   *
   * @param verses Verses to show translation for
   */
  showTranslation(verses: AyahNumber[]): void;

  /**
   * Edit a note.
   *
   * @param note Note to edit
   */
  editNote(note: Note): void;
}

