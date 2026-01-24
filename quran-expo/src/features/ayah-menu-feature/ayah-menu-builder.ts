/**
 * AyahMenuBuilder.swift → ayah-menu-builder.ts
 *
 * Builder for the Ayah Menu feature.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { ShareableVerseTextRetriever } from '../../domain/quran-text-kit';
import { AyahMenuViewModel, type AyahMenuViewModelDeps } from './ayah-menu-view-model';
import type { AyahMenuInput } from './ayah-menu-input';
import type { AyahMenuListener } from './ayah-menu-listener';

// ============================================================================
// AyahMenuBuilder
// ============================================================================

/**
 * Builder for the Ayah Menu feature.
 *
 * 1:1 translation of iOS AyahMenuBuilder.
 */
export class AyahMenuBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly container: AppDependencies;

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
   * Build the AyahMenuViewModel.
   *
   * @param listener The listener for menu events
   * @param input The input data for the menu
   * @returns The configured AyahMenuViewModel
   */
  build(listener: AyahMenuListener, input: AyahMenuInput): AyahMenuViewModel {
    const textRetriever = new ShareableVerseTextRetriever(
      this.container.databasesURL,
      this.container.quranUthmaniV2Database
    );

    const noteService = this.container.noteService();

    const deps: AyahMenuViewModelDeps = {
      pointInView: input.pointInView,
      verses: input.verses,
      notes: input.notes,
      noteService,
      textRetriever,
    };

    const viewModel = new AyahMenuViewModel(deps);
    viewModel.listener = listener;

    return viewModel;
  }
}

