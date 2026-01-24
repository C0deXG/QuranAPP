/**
 * NoteEditorInteractor.swift → note-editor-interactor.ts
 *
 * Interactor for note editing logic.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { NoteService } from '../../domain/annotations-service';
import type { Note, NoteColor } from '../../model/quran-annotations';
import type { EditableNote } from '../../ui/features/note';
import { createEditableNote } from '../../ui/features/note';
import { timeAgo } from '../../ui/formatters';

// ============================================================================
// NoteEditorListener
// ============================================================================

/**
 * Listener for note editor events.
 */
export interface NoteEditorListener {
  /**
   * Called when the note editor should be dismissed.
   */
  dismissNoteEditor(): void;
}

// ============================================================================
// NoteEditorState
// ============================================================================

/**
 * State for the note editor.
 */
export interface NoteEditorState {
  editableNote: EditableNote | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
}

/**
 * Initial state for the note editor.
 */
export const initialNoteEditorState: NoteEditorState = {
  editableNote: null,
  isLoading: true,
  isSaving: false,
  error: null,
};

// ============================================================================
// NoteEditorInteractor
// ============================================================================

/**
 * Interactor for note editing logic.
 *
 * 1:1 translation of iOS NoteEditorInteractor.
 */
export class NoteEditorInteractor {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Listener for editor events */
  listener: NoteEditorListener | null = null;

  private readonly noteService: NoteService;
  private readonly note: Note;
  private editableNote: EditableNote | null = null;

  /** Current state */
  private _state: NoteEditorState = { ...initialNoteEditorState };

  /** State change listeners */
  private listeners: ((state: NoteEditorState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(noteService: NoteService, note: Note) {
    this.noteService = noteService;
    this.note = note;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): NoteEditorState {
    return this._state;
  }

  /**
   * Returns true if the note has content (not just a highlight).
   */
  get isEditedNote(): boolean {
    const noteText = this.editableNote?.note ?? '';
    return noteText.trim().length > 0;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: NoteEditorState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: NoteEditorState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<NoteEditorState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Fetch note data and prepare for editing.
   */
  async fetchNote(): Promise<EditableNote> {
    this.setState({ isLoading: true, error: null });

    try {
      const versesText = await this.getNoteText();

      logger.info('NoteEditor: note loaded');

      const editableNote = createEditableNote(
        versesText,
        timeAgo(this.note.modifiedDate),
        this.note.color,
        this.note.note ?? ''
      );

      this.editableNote = editableNote;
      this.setState({ editableNote, isLoading: false });

      return editableNote;
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to retrieve note text');
      this.setState({ isLoading: false, error: error as Error });
      throw error;
    }
  }

  /**
   * Save changes and close the editor.
   */
  async commitEditsAndExit(): Promise<void> {
    logger.info('NoteEditor: done tapped');
    this.setState({ isSaving: true });

    const editorColor = this.editableNote?.selectedColor;

    try {
      await this.noteService.setNote(
        this.editableNote?.note ?? this.note.note ?? '',
        this.note.verses,
        editorColor ?? this.note.color
      );

      logger.info('NoteEditor: note saved');
      this.setState({ isSaving: false });
      this.listener?.dismissNoteEditor();
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to set note');
      this.setState({ isSaving: false, error: error as Error });
    }
  }

  /**
   * Delete the note (removes highlight and note).
   */
  async forceDelete(): Promise<void> {
    logger.info('NoteEditor: force delete note');
    this.setState({ isSaving: true });

    try {
      await this.noteService.removeNotes(Array.from(this.note.verses));

      logger.info('NoteEditor: notes removed');
      this.setState({ isSaving: false });
      this.listener?.dismissNoteEditor();
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to delete note');
      this.setState({ isSaving: false, error: error as Error });
    }
  }

  /**
   * Update the editable note.
   */
  updateNote(note: string): void {
    if (this.editableNote) {
      this.editableNote = { ...this.editableNote, note };
      this.setState({ editableNote: this.editableNote });
    }
  }

  /**
   * Update the selected color.
   */
  updateColor(color: NoteColor): void {
    if (this.editableNote) {
      this.editableNote = { ...this.editableNote, selectedColor: color };
      this.setState({ editableNote: this.editableNote });
    }
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
   * Get the text for the note's verses.
   */
  private async getNoteText(): Promise<string> {
    return this.noteService.textForVerses(Array.from(this.note.verses));
  }
}

