/**
 * TranslationVerseBuilder.swift → translation-verse-builder.ts
 *
 * Builder for the translation verse feature.
 *
 * Quran.com. All rights reserved.
 */

import type { AyahNumber } from '../../model/quran-kit';
import type { AppDependencies } from '../app-dependencies';
import { QuranTextDataService, LocalTranslationsRetriever } from '../../domain/quran-text-kit';
import { TranslationVerseViewModel } from './translation-verse-view-model';
import type { TranslationVerseActions } from './translation-verse-actions';

// ============================================================================
// TranslationVerseBuilder
// ============================================================================

/**
 * Builder for the translation verse feature.
 *
 * 1:1 translation of iOS TranslationVerseBuilder.
 */
export class TranslationVerseBuilder {
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
   * Build the translation verse view model.
   *
   * @param startingVerse The verse to start with
   * @param actions Actions callback interface
   * @returns The configured TranslationVerseViewModel
   */
  build(startingVerse: AyahNumber, actions: TranslationVerseActions): TranslationVerseViewModel {
    const dataService = new QuranTextDataService(
      this.container.databasesURL,
      this.container.quranUthmaniV2Database
    );

    const localTranslationsRetriever = new LocalTranslationsRetriever(
      this.container.databasesURL
    );

    return new TranslationVerseViewModel(
      startingVerse,
      localTranslationsRetriever,
      dataService,
      actions
    );
  }
}

