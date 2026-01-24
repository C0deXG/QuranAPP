/**
 * TranslationsListBuilder.swift → translations-builder.ts
 *
 * Builder for the Translations list screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import {
  TranslationsRepository,
  LocalTranslationsRetriever,
  TranslationDeleter,
  TranslationsDownloader,
} from '../../domain/translation-service';
import { TranslationsViewModel } from './translations-view-model';

// ============================================================================
// TranslationsBuilder
// ============================================================================

/**
 * Builder for the Translations list screen.
 *
 * 1:1 translation of iOS TranslationsListBuilder.
 */
export class TranslationsBuilder {
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
   * Build the Translations view model.
   *
   * @returns The configured TranslationsViewModel
   */
  build(): TranslationsViewModel {
    const repository = new TranslationsRepository(
      this.container.databasesURL,
      this.container.appHost
    );

    const localRetriever = new LocalTranslationsRetriever(this.container.databasesURL);
    const deleter = new TranslationDeleter(this.container.databasesURL);
    const downloader = new TranslationsDownloader(this.container.downloadManager);

    return new TranslationsViewModel(
      this.container.analytics,
      repository,
      localRetriever,
      deleter,
      downloader
    );
  }
}

