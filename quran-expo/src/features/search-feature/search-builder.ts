/**
 * SearchBuilder.swift → search-builder.ts
 *
 * Builder for the Search screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import type { QuranNavigator } from '../features-support';
import { CompositeSearcher } from '../../domain/quran-text-kit';
import { SearchViewModel } from './search-view-model';

// ============================================================================
// SearchBuilder
// ============================================================================

/**
 * Builder for the Search screen.
 *
 * 1:1 translation of iOS SearchBuilder.
 */
export class SearchBuilder {
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
   * Build the Search view model.
   *
   * @param listener - The navigation listener (QuranNavigator)
   * @returns The configured SearchViewModel
   */
  build(listener: QuranNavigator): SearchViewModel {
    const searchService = new CompositeSearcher(
      this.container.databasesURL,
      this.container.quranUthmaniV2Database
    );

    return new SearchViewModel(
      this.container.analytics,
      searchService,
      (verse) => {
        listener.navigateTo(verse.page, null, verse);
      }
    );
  }
}

