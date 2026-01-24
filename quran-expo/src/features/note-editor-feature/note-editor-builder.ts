/**
 * NoteEditorBuilder.swift → note-editor-builder.ts
 *
 * Builder for the Note Editor screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { createNoteService } from '../app-dependencies';
import type { Note } from '../../model/quran-annotations';
import { NoteEditorInteractor, type NoteEditorListener } from './note-editor-interactor';

// ============================================================================
// NoteEditorBuilder
// ============================================================================

/**
 * Builder for the Note Editor screen.
 *
 * 1:1 translation of iOS NoteEditorBuilder.
 */
export class NoteEditorBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  readonly container: AppDependencies;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(container: AppDependencies) {
    this.container = container;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the Note Editor interactor.
   *
   * @param listener - The listener for editor events
   * @param note - The note to edit
   * @returns The configured NoteEditorInteractor
   */
  build(listener: NoteEditorListener, note: Note): NoteEditorInteractor {
    const noteService = createNoteService(this.container);
    const interactor = new NoteEditorInteractor(noteService, note);
    interactor.listener = listener;
    return interactor;
  }
}

