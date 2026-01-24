/**
 * LastPageUpdater.swift → last-page-updater.ts
 *
 * Handles updating the last read page.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IPage } from '../../model/quran-kit/types';
import type { LastPageService } from './last-page-service';
import { crasher } from '../../core/crashing';

// ============================================================================
// LastPageUpdater
// ============================================================================

/**
 * Handles updating the last read page.
 */
export class LastPageUpdater {
  private readonly service: LastPageService;
  private _lastPage: IPage | null = null;

  constructor(service: LastPageService) {
    this.service = service;
  }

  /**
   * Gets the current last page.
   */
  get lastPage(): IPage | null {
    return this._lastPage;
  }

  /**
   * Configures the updater with an initial page.
   */
  configure(initialPage: IPage, lastPage: IPage | null): void {
    this._lastPage = lastPage;

    if (lastPage) {
      this.updateTo(initialPage, lastPage);
    } else {
      this.create(initialPage);
    }
  }

  /**
   * Updates to the given pages.
   */
  updateToPages(pages: IPage[]): void {
    if (pages.length === 0) return;

    // Get the minimum page
    const page = pages.reduce((min, p) => 
      p.pageNumber < min.pageNumber ? p : min
    );

    // Don't update if it's the same page
    if (!this._lastPage || page.pageNumber === this._lastPage.pageNumber) {
      return;
    }

    this.updateTo(page, this._lastPage);
  }

  /**
   * Updates from old page to new page.
   */
  private updateTo(page: IPage, lastPage: IPage): void {
    this._lastPage = page;

    (async () => {
      try {
        await this.service.update(lastPage, page);
      } catch (error) {
        crasher.recordError(error as Error, 'Failed to update last page');
      }
    })();
  }

  /**
   * Creates a new last page entry.
   */
  private create(page: IPage): void {
    this._lastPage = page;

    (async () => {
      try {
        await this.service.add(page);
      } catch (error) {
        crasher.recordError(error as Error, 'Failed to create a last page');
      }
    })();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a LastPageUpdater.
 */
export function createLastPageUpdater(service: LastPageService): LastPageUpdater {
  return new LastPageUpdater(service);
}

