/**
 * HomeBuilder.swift → home-builder.ts
 *
 * Builder for the Home screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import type { QuranNavigator } from '../features-support';
import { LastPageService } from '../../domain/annotations-service';
import { QuranTextDataService } from '../../domain/quran-text-kit';
import { HomeViewModel } from './home-view-model';

// ============================================================================
// HomeBuilder
// ============================================================================

/**
 * Builder for the Home screen.
 *
 * 1:1 translation of iOS HomeBuilder.
 */
export class HomeBuilder {
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
   * Build the Home view model.
   *
   * @param listener - The navigation listener (QuranNavigator)
   * @returns The configured HomeViewModel
   */
  build(listener: QuranNavigator): HomeViewModel {
    const lastPageService = new LastPageService(this.container.lastPagePersistence);
    const textRetriever = new QuranTextDataService(
      this.container.databasesURL,
      this.container.quranUthmaniV2Database
    );

    return new HomeViewModel(
      lastPageService,
      textRetriever,
      (lastPage) => {
        listener.navigateTo(lastPage, lastPage, null);
      },
      (sura) => {
        listener.navigateTo(sura.page, null, null);
      },
      (quarter) => {
        listener.navigateTo(quarter.page, null, null);
      }
    );
  }
}

