/**
 * PageBookmarkService.swift → page-bookmark-service.ts
 *
 * Service for managing page bookmarks.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, IPage } from '../../model/quran-kit/types';
import { Page } from '../../model/quran-kit';
import type { PageBookmark } from '../../model/quran-annotations';
import { createPageBookmark } from '../../model/quran-annotations';
import type { PageBookmarkPersistence, PageBookmarkPersistenceModel } from '../../data/page-bookmark-persistence';
import { createAsyncPublisher } from '../../core/utilities/async-publisher';

// ============================================================================
// PageBookmarkService
// ============================================================================

/**
 * Service for managing page bookmarks.
 */
export class PageBookmarkService {
  private readonly persistence: PageBookmarkPersistence;

  constructor(persistence: PageBookmarkPersistence) {
    this.persistence = persistence;
  }

  /**
   * Gets an async iterable of page bookmarks.
   */
  pageBookmarks(quran: IQuran): AsyncIterable<PageBookmark[]> {
    const self = this;
    return createAsyncPublisher<PageBookmark[]>((emit) => {
      // Subscribe to persistence updates
      const subscription = self.persistence.pageBookmarks();
      
      // Process updates
      (async () => {
        for await (const bookmarks of subscription) {
          const mapped = bookmarks.map((model) => 
            self.createPageBookmark(quran, model)
          );
          emit(mapped);
        }
      })();

      return () => {
        // Cleanup if needed
      };
    });
  }

  /**
   * Inserts a page bookmark.
   */
  async insertPageBookmark(page: IPage): Promise<void> {
    await this.persistence.insertPageBookmark(page.pageNumber);
  }

  /**
   * Removes a page bookmark.
   */
  async removePageBookmark(page: IPage): Promise<void> {
    await this.persistence.removePageBookmark(page.pageNumber);
  }

  /**
   * Creates a PageBookmark from persistence model.
   */
  private createPageBookmark(quran: IQuran, model: PageBookmarkPersistenceModel): PageBookmark {
    const page = Page.create(quran, model.page);
    if (!page) {
      throw new Error(`Invalid page number: ${model.page}`);
    }
    
    return createPageBookmark({
      page,
      creationDate: model.creationDate,
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a PageBookmarkService.
 */
export function createPageBookmarkService(persistence: PageBookmarkPersistence): PageBookmarkService {
  return new PageBookmarkService(persistence);
}

