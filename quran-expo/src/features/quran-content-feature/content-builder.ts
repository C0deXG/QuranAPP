/**
 * ContentBuilder.swift → content-builder.ts
 *
 * Builder for the Content feature.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { ReadingPreferences } from '../../domain/reading-service';
import { quranForReading } from '../../model/quran-kit';
import { LastPageService, LastPageUpdater, type QuranHighlightsService } from '../../domain/annotations-service';
import { ContentViewModel, type ContentViewModelDeps } from './content-view-model';
import type { QuranInput } from './quran-input';
import type { ContentListener } from './content-listener';

// ============================================================================
// ContentBuilder
// ============================================================================

/**
 * Builder for the Content feature.
 *
 * 1:1 translation of iOS ContentBuilder.
 */
export class ContentBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly container: AppDependencies;
  private readonly highlightsService: QuranHighlightsService;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(container: AppDependencies, highlightsService: QuranHighlightsService) {
    this.container = container;
    this.highlightsService = highlightsService;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the ContentViewModel.
   *
   * @param listener The listener for content events
   * @param input The input data for the content
   * @returns The configured ContentViewModel
   */
  build(listener: ContentListener, input: QuranInput): ContentViewModel {
    const quran = quranForReading(ReadingPreferences.shared.reading);
    const noteService = this.container.noteService();
    const lastPageService = new LastPageService(this.container.lastPagePersistence);
    const lastPageUpdater = new LastPageUpdater(lastPageService);

    const deps: ContentViewModelDeps = {
      analytics: this.container.analytics,
      noteService,
      lastPageUpdater,
      quran,
      highlightsService: this.highlightsService,
    };

    const viewModel = new ContentViewModel(deps, input);
    viewModel.listener = listener;

    return viewModel;
  }
}

