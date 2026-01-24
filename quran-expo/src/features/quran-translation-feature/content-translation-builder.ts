/**
 * ContentTranslationBuilder.swift → content-translation-builder.ts
 *
 * Builder for the Content Translation feature.
 *
 * Quran.com. All rights reserved.
 */

import type { Page } from '../../model/quran-kit';
import type { AppDependencies } from '../app-dependencies';
import type { QuranHighlightsService } from '../../domain/annotations-service';
import { QuranTextDataService } from '../../domain/quran-text-kit';
import { LocalTranslationsRetriever } from '../../domain/translation-service';
import { ContentTranslationViewModel } from './content-translation-view-model';

// ============================================================================
// ContentTranslationBuilder
// ============================================================================

/**
 * Builder for the Content Translation feature.
 *
 * 1:1 translation of iOS ContentTranslationBuilder.
 */
export class ContentTranslationBuilder {
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
   * Build the ContentTranslationViewModel for a page.
   */
  build(page: Page): ContentTranslationViewModel {
    const dataService = new QuranTextDataService(
      this.container.databasesURL,
      this.container.quranUthmaniV2Database
    );

    const localTranslationsRetriever = new LocalTranslationsRetriever(this.container.databasesURL);

    const viewModel = new ContentTranslationViewModel(
      localTranslationsRetriever,
      dataService,
      this.highlightsService
    );

    viewModel.setVerses(page.verses);

    return viewModel;
  }
}

