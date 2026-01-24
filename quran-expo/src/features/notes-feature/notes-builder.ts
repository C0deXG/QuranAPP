/**
 * NotesBuilder.swift → notes-builder.ts
 *
 * Builder for the Notes screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { createNoteService } from '../app-dependencies';
import type { QuranNavigator } from '../features-support';
import { ShareableVerseTextRetriever } from '../../domain/quran-text-kit';
import { NotesViewModel } from './notes-view-model';

// ============================================================================
// NotesBuilder
// ============================================================================

/**
 * Builder for the Notes screen.
 *
 * 1:1 translation of iOS NotesBuilder.
 */
export class NotesBuilder {
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
   * Build the Notes view model.
   *
   * @param listener - The navigation listener (QuranNavigator)
   * @returns The configured NotesViewModel
   */
  build(listener: QuranNavigator): NotesViewModel {
    const textRetriever = new ShareableVerseTextRetriever(
      this.container.databasesURL,
      this.container.quranUthmaniV2Database
    );

    const noteService = createNoteService(this.container);

    return new NotesViewModel(
      this.container.analytics,
      noteService,
      textRetriever,
      (verse) => {
        listener.navigateTo(verse.page, null, null);
      }
    );
  }
}

