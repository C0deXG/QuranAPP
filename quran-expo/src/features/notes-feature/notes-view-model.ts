/**
 * NotesViewModel.swift → notes-view-model.ts
 *
 * View model for the Notes screen.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { AnalyticsLibrary } from '../../core/analytics';
import type { NoteService } from '../../domain/annotations-service';
import type { ShareableVerseTextRetriever } from '../../domain/quran-text-kit';
import { type AyahNumber, quranForReading } from '../../model/quran-kit';
import type { Note } from '../../model/quran-annotations';
import type { IAyahNumber } from '../../model/quran-kit';
import { ReadingPreferences } from '../../domain/reading-service';
import type { NoteItem } from './note-item';
import { createNoteItem } from './note-item';

/**
 * Gets the first verse from a Note's verses set.
 */
function getFirstVerse(note: Note): IAyahNumber | undefined {
  const versesArray = Array.from(note.verses);
  if (versesArray.length === 0) return undefined;
  return versesArray.sort((a, b) => {
    if (a.sura.suraNumber !== b.sura.suraNumber) {
      return a.sura.suraNumber - b.sura.suraNumber;
    }
    return a.ayah - b.ayah;
  })[0];
}

// ============================================================================
// NotesViewState
// ============================================================================

/**
 * State for the Notes view.
 */
export interface NotesViewState {
  notes: NoteItem[];
  isEditing: boolean;
  error: Error | null;
  isLoading: boolean;
  isSharing: boolean;
}

/**
 * Initial state for the Notes view.
 */
export const initialNotesViewState: NotesViewState = {
  notes: [],
  isEditing: false,
  error: null,
  isLoading: true,
  isSharing: false,
};

// ============================================================================
// NotesViewModel
// ============================================================================

/**
 * View model for the Notes screen.
 *
 * 1:1 translation of iOS NotesViewModel.
 */
export class NotesViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly analytics: AnalyticsLibrary;
  private readonly noteService: NoteService;
  private readonly textRetriever: ShareableVerseTextRetriever;
  private readonly navigateToVerse: (verse: IAyahNumber) => void;
  private readonly readingPreferences = ReadingPreferences.shared;

  /** Current state */
  private _state: NotesViewState = { ...initialNotesViewState };

  /** State change listeners */
  private listeners: ((state: NotesViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    analytics: AnalyticsLibrary,
    noteService: NoteService,
    textRetriever: ShareableVerseTextRetriever,
    navigateTo: (verse: AyahNumber) => void
  ) {
    this.analytics = analytics;
    this.noteService = noteService;
    this.textRetriever = textRetriever;
    this.navigateToVerse = navigateTo;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): NotesViewState {
    return this._state;
  }

  get notes(): NoteItem[] {
    return this._state.notes;
  }

  get isEditing(): boolean {
    return this._state.isEditing;
  }

  get error(): Error | null {
    return this._state.error;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: NotesViewState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: NotesViewState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<NotesViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start loading data.
   */
  async start(): Promise<void> {
    this.setState({ isLoading: true });

    try {
      const reading = this.readingPreferences.reading;
      const notesPublisher = this.noteService.notes(quranForReading(reading));

      // Get initial value and subscribe
      for await (const notes of notesPublisher) {
        const noteItems = await this.noteItems(notes);
        // Sort by modified date descending (newest first)
        const sortedNotes = [...noteItems].sort(
          (a, b) => b.note.modifiedDate.getTime() - a.note.modifiedDate.getTime()
        );
        this.setState({ notes: sortedNotes, isLoading: false });
        break; // Only get first value for initial load
      }
    } catch (error) {
      this.setState({ error: error as Error, isLoading: false });
    }
  }

  /**
   * Navigate to a note.
   */
  navigateTo(item: NoteItem): void {
    const firstVerse = getFirstVerse(item.note);
    if (!firstVerse) return;
    logger.info(`Notes: select note at ${firstVerse.sura.suraNumber}:${firstVerse.ayah}`);
    this.navigateToVerse(firstVerse);
  }

  /**
   * Delete a note.
   */
  async deleteItem(item: NoteItem): Promise<void> {
    const firstVerse = getFirstVerse(item.note);
    if (!firstVerse) return;
    logger.info(`Notes: delete note at ${firstVerse.sura.suraNumber}:${firstVerse.ayah}`);

    try {
      await this.noteService.removeNotes(Array.from(item.note.verses));

      // Optimistically update the list
      const updatedNotes = this._state.notes.filter((n) => {
        const nFirst = getFirstVerse(n.note);
        if (!nFirst || !firstVerse) return true;
        return nFirst.sura.suraNumber !== firstVerse.sura.suraNumber ||
               nFirst.ayah !== firstVerse.ayah;
      });
      this.setState({ notes: updatedNotes });
    } catch (error) {
      this.setState({ error: error as Error });
    }
  }

  /**
   * Prepare notes for sharing.
   */
  async prepareNotesForSharing(): Promise<string> {
    this.setState({ isSharing: true });

    try {
      const notesText: string[] = [];
      const notes = this._state.notes;

      for (let index = 0; index < notes.length; index++) {
        const note = notes[index];

        // Add note content if present
        const title: string[] = [];
        if (note.note.note && note.note.note.trim() !== '') {
          title.push(note.note.note.trim(), '');
        }

        // Get verse text
        const verses = await this.textRetriever.textForVerses(Array.from(note.note.verses));

        notesText.push(...title, ...verses);

        // Add separator between notes
        if (index !== notes.length - 1) {
          notesText.push('', '', '');
        }
      }

      this.setState({ isSharing: false });
      return notesText.join('\n');
    } catch (error) {
      this.setState({ isSharing: false });
      crasher.recordError(error as Error, 'Failed to share notes');
      throw error;
    }
  }

  /**
   * Toggle edit mode.
   */
  toggleEditMode(): void {
    this.setState({ isEditing: !this._state.isEditing });
  }

  /**
   * Set edit mode.
   */
  setEditMode(isEditing: boolean): void {
    this.setState({ isEditing });
  }

  /**
   * Clear error.
   */
  clearError(): void {
    this.setState({ error: null });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Convert notes to note items with verse text.
   */
  private async noteItems(notes: Note[]): Promise<NoteItem[]> {
    const items = await Promise.all(
      notes.map(async (note) => {
        try {
          const verseText = await this.noteService.textForVerses(Array.from(note.verses));
          return createNoteItem(note, verseText);
        } catch (error) {
          crasher.recordError(error as Error, 'NoteService.textForVerses');
          const firstVerse = getFirstVerse(note);
          return createNoteItem(note, firstVerse ? `${firstVerse.sura.suraNumber}:${firstVerse.ayah}` : '');
        }
      })
    );

    return items;
  }
}

