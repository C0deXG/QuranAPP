/**
 * LastPageService.swift → last-page-service.ts
 *
 * Service for managing last read pages.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, IPage } from '../../model/quran-kit/types';
import { Page } from '../../model/quran-kit';
import type { LastPage } from '../../model/quran-annotations';
import { createLastPage } from '../../model/quran-annotations';
import type { LastPagePersistence, LastPagePersistenceModel } from '../../data/last-page-persistence';
import { createAsyncPublisher } from '../../core/utilities/async-publisher';

// ============================================================================
// LastPageService
// ============================================================================

/**
 * Service for managing last read pages.
 */
export class LastPageService {
  private readonly persistence: LastPagePersistence;

  constructor(persistence: LastPagePersistence) {
    this.persistence = persistence;
  }

  /**
   * Gets an async iterable of last pages.
   */
  lastPages(quran: IQuran): AsyncIterable<LastPage[]> {
    const self = this;
    return createAsyncPublisher<LastPage[]>((emit) => {
      // Subscribe to persistence updates
      const subscription = self.persistence.lastPages();
      
      // Process updates
      (async () => {
        for await (const lastPages of subscription) {
          const mapped = lastPages.map((model) => 
            self.createLastPage(quran, model)
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
   * Adds a new last page entry.
   */
  async add(page: IPage): Promise<LastPage> {
    const persistenceModel = await this.persistence.add(page.pageNumber);
    return this.createLastPage(page.quran, persistenceModel);
  }

  /**
   * Updates an existing last page entry.
   */
  async update(page: IPage, toPage: IPage): Promise<LastPage> {
    const persistenceModel = await this.persistence.update(
      page.pageNumber,
      toPage.pageNumber
    );
    return this.createLastPage(toPage.quran, persistenceModel);
  }

  /**
   * Creates a LastPage from persistence model.
   */
  private createLastPage(quran: IQuran, model: LastPagePersistenceModel): LastPage {
    const page = Page.create(quran, model.page);
    if (!page) {
      throw new Error(`Invalid page number: ${model.page}`);
    }
    
    return createLastPage({
      page,
      createdOn: model.createdOn,
      modifiedOn: model.modifiedOn,
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a LastPageService.
 */
export function createLastPageService(persistence: LastPagePersistence): LastPageService {
  return new LastPageService(persistence);
}

