/**
 * AyahMenuViewModel.swift → ayah-menu-view-model.ts
 *
 * View model for the ayah menu.
 *
 * Quran.com. All rights reserved.
 */

import { l } from '../../core/localization';
import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import * as Clipboard from 'expo-clipboard';
import { type AyahNumber, quranForReading } from '../../model/quran-kit';
import type { Note, NoteColor } from '../../model/quran-annotations';
import type { Point } from '../../model/quran-geometry';
import type { NoteService } from '../../domain/annotations-service';
import { ReadingPreferences } from '../../domain/reading-service';
import { AudioPreferences } from '../../domain/quran-audio-kit';
import { QuranContentStatePreferences } from '../../domain/quran-text-kit';
import type { ShareableVerseTextRetriever } from '../../domain/quran-text-kit';
import type { AyahMenuListener } from './ayah-menu-listener';
import type { AyahMenuUI } from '../../ui/features/ayah-menu';

// ============================================================================
// AyahMenuViewModelDeps
// ============================================================================

export interface AyahMenuViewModelDeps {
  pointInView: Point;
  verses: AyahNumber[];
  notes: Note[];
  noteService: NoteService;
  textRetriever: ShareableVerseTextRetriever;
}

// ============================================================================
// AyahMenuViewModel
// ============================================================================

/**
 * View model for the ayah menu.
 *
 * 1:1 translation of iOS AyahMenuViewModel.
 */
export class AyahMenuViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  listener: AyahMenuListener | null = null;

  private readonly deps: AyahMenuViewModelDeps;
  private readonly audioPreferences = AudioPreferences.shared;
  private readonly quranContentStatePreferences = QuranContentStatePreferences.shared;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(deps: AyahMenuViewModelDeps) {
    this.deps = deps;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Whether the current view is translation mode.
   */
  get isTranslationView(): boolean {
    return this.quranContentStatePreferences.quranMode === 'translation';
  }

  /**
   * Get the highlighting color from existing notes.
   */
  get highlightingColor(): NoteColor {
    return this.deps.noteService.colorFromNotes(this.deps.notes);
  }

  /**
   * Get the subtitle for the play button.
   */
  get playSubtitle(): string {
    if (this.deps.verses.length > 1) {
      return l('ayah.menu.selected-verses');
    }

    switch (this.audioPreferences.audioEnd) {
      case 'juz':
        return l('ayah.menu.play-end-juz');
      case 'sura':
        return l('ayah.menu.play-end-surah');
      case 'page':
        return l('ayah.menu.play-end-page');
      default:
        return l('ayah.menu.play-end-surah');
    }
  }

  /**
   * Get the subtitle for the repeat button.
   */
  get repeatSubtitle(): string {
    if (this.deps.verses.length === 1) {
      return l('ayah.menu.selected-verse');
    }
    return l('ayah.menu.selected-verses');
  }

  /**
   * Get the note state.
   */
  get noteState(): AyahMenuUI.NoteState {
    if (this.deps.notes.length === 0) {
      return 'noHighlight';
    } else if (this.containsText(this.deps.notes)) {
      return 'noted';
    }
    return 'highlighted';
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Play audio.
   */
  play(): void {
    logger.info(`AyahMenu: play tapped. Verses: ${this.versesString}`);
    this.listener?.dismissAyahMenu();

    const verses = this.deps.verses;
    const lastVerse = verses.length === 1 ? null : verses[verses.length - 1];
    this.listener?.playAudio(verses[0], lastVerse, false);
  }

  /**
   * Repeat verses.
   */
  repeatVerses(): void {
    logger.info(`AyahMenu: repeat verses tapped. Verses: ${this.versesString}`);
    this.listener?.dismissAyahMenu();

    const verses = this.deps.verses;
    this.listener?.playAudio(verses[0], verses[verses.length - 1], true);
  }

  /**
   * Delete notes.
   */
  async deleteNotes(): Promise<void> {
    logger.info(`AyahMenu: delete notes. Verses: ${this.versesString}`);
    this.listener?.dismissAyahMenu();
    await this.listener?.deleteNotes(this.deps.notes, this.deps.verses);
  }

  /**
   * Edit note.
   */
  async editNote(): Promise<void> {
    logger.info(`AyahMenu: edit notes. Verses: ${this.versesString}`);
    const notes = this.deps.notes;
    const color = this.deps.noteService.colorFromNotes(notes);
    const note = await this._updateHighlight(color);
    if (note) {
      this.listener?.editNote(note);
    }
  }

  /**
   * Update highlight color.
   */
  async updateHighlight(color: NoteColor): Promise<void> {
    logger.info(`AyahMenu: update verse highlights. Verses: ${this.versesString}`);
    this.listener?.dismissAyahMenu();
    await this._updateHighlight(color);
  }

  /**
   * Show translation.
   */
  showTranslation(): void {
    logger.info(`AyahMenu: showTranslation. Verses: ${this.versesString}`);
    this.listener?.showTranslation(this.deps.verses);
  }

  /**
   * Copy text to clipboard.
   */
  copy(): void {
    logger.info(`AyahMenu: copy. Verses: ${this.versesString}`);
    this.listener?.dismissAyahMenu();

    this.retrieveSelectedAyahText()
      .then(async (lines) => {
        const text = lines.join('\n');
        await Clipboard.setStringAsync(text);
      })
      .catch((error) => {
        crasher.recordError(error as Error, 'Failed to copy text');
      });
  }

  /**
   * Share text.
   */
  share(): void {
    logger.info(`AyahMenu: share. Verses: ${this.versesString}`);

    this.retrieveSelectedAyahText()
      .then((lines) => {
        const withNewLines = lines.join('\n');
        this.listener?.shareText([withNewLines], this.deps.pointInView);
      })
      .catch((error) => {
        crasher.recordError(error as Error, 'Failed to share text');
      });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private get versesString(): string {
    return this.deps.verses
      .map((v) => `${v.sura.suraNumber}:${v.ayah}`)
      .join(', ');
  }

  private containsText(notes: Note[]): boolean {
    return notes.some((note) => {
      const noteText = note.note ?? '';
      return noteText.length > 0;
    });
  }

  private async _updateHighlight(color: NoteColor): Promise<Note | null> {
    const quran = quranForReading(ReadingPreferences.shared.reading);
    try {
      const updatedNote = await this.deps.noteService.updateHighlight(
        this.deps.verses,
        color,
        quran
      );
      logger.info('AyahMenu: notes updated');
      return updatedNote;
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to update highlights');
      return null;
    }
  }

  private async retrieveSelectedAyahText(): Promise<string[]> {
    try {
      return await this.deps.textRetriever.textForVerses(this.deps.verses);
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to retrieve verse text');
      throw error;
    }
  }
}

