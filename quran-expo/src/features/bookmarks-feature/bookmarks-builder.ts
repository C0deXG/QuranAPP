/**
 * BookmarksBuilder.swift → bookmarks-builder.ts
 *
 * Builder for the Bookmarks screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import type { QuranNavigator } from '../features-support';
import { PageBookmarkService } from '../../domain/annotations-service';
import { BookmarksViewModel } from './bookmarks-view-model';

// ============================================================================
// BookmarksBuilder
// ============================================================================

/**
 * Builder for the Bookmarks screen.
 *
 * 1:1 translation of iOS BookmarksBuilder.
 */
export class BookmarksBuilder {
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
   * Build the Bookmarks view model.
   *
   * @param listener - The navigation listener (QuranNavigator)
   * @returns The configured BookmarksViewModel
   */
  build(listener: QuranNavigator): BookmarksViewModel {
    const service = new PageBookmarkService(this.container.pageBookmarkPersistence);

    return new BookmarksViewModel(
      this.container.analytics,
      service,
      (page) => {
        listener.navigateTo(page, null, null);
      }
    );
  }
}

