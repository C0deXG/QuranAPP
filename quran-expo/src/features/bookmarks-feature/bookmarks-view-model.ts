/**
 * BookmarksViewModel.swift → bookmarks-view-model.ts
 *
 * View model for the Bookmarks screen.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import type { AnalyticsLibrary } from '../../core/analytics';
import type { PageBookmarkService } from '../../domain/annotations-service';
import { logOpeningQuran, logRemoveBookmarkPage } from '../features-support';
import { Screen } from '../features-support';
import { type Page, quranForReading } from '../../model/quran-kit';
import type { PageBookmark } from '../../model/quran-annotations';
import { ReadingPreferences } from '../../domain/reading-service';

// ============================================================================
// BookmarksViewState
// ============================================================================

/**
 * State for the Bookmarks view.
 */
export interface BookmarksViewState {
  bookmarks: PageBookmark[];
  isEditing: boolean;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Initial state for the Bookmarks view.
 */
export const initialBookmarksViewState: BookmarksViewState = {
  bookmarks: [],
  isEditing: false,
  error: null,
  isLoading: true,
};

// ============================================================================
// BookmarksViewModel
// ============================================================================

/**
 * View model for the Bookmarks screen.
 *
 * 1:1 translation of iOS BookmarksViewModel.
 */
export class BookmarksViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly analytics: AnalyticsLibrary;
  private readonly service: PageBookmarkService;
  private readonly navigateToPage: (page: Page) => void;
  private readonly readingPreferences = ReadingPreferences.shared;

  /** Current state */
  private _state: BookmarksViewState = { ...initialBookmarksViewState };

  /** State change listeners */
  private listeners: ((state: BookmarksViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    analytics: AnalyticsLibrary,
    service: PageBookmarkService,
    navigateTo: (page: Page) => void
  ) {
    this.analytics = analytics;
    this.service = service;
    this.navigateToPage = navigateTo;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): BookmarksViewState {
    return this._state;
  }

  get bookmarks(): PageBookmark[] {
    return this._state.bookmarks;
  }

  get isEditing(): boolean {
    return this._state.isEditing;
  }

  get error(): Error | null {
    return this._state.error;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: BookmarksViewState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: BookmarksViewState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<BookmarksViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start loading data.
   */
  async start(): Promise<void> {
    this.setState({ isLoading: true });

    try {
      const reading = this.readingPreferences.reading;
      const bookmarksPublisher = this.service.pageBookmarks(quranForReading(reading));

      // Get initial value and subscribe
      for await (const bookmarks of bookmarksPublisher) {
        // Sort by creation date descending (newest first)
        const sortedBookmarks = [...bookmarks].sort(
          (a, b) => b.creationDate.getTime() - a.creationDate.getTime()
        );
        this.setState({ bookmarks: sortedBookmarks, isLoading: false });
        break; // Only get first value for initial load
      }
    } catch (error) {
      this.setState({ error: error as Error, isLoading: false });
    }
  }

  /**
   * Navigate to a bookmark.
   */
  navigateTo(item: PageBookmark): void {
    logger.info(`Bookmarks: select bookmark at ${item.page.pageNumber}`);
    logOpeningQuran(this.analytics, Screen.Bookmarks);
    this.navigateToPage(item.page);
  }

  /**
   * Delete a bookmark.
   */
  async deleteItem(pageBookmark: PageBookmark): Promise<void> {
    logger.info(`Bookmarks: delete bookmark at ${pageBookmark.page.pageNumber}`);
    logRemoveBookmarkPage(this.analytics, pageBookmark.page);

    try {
      await this.service.removePageBookmark(pageBookmark.page);

      // Optimistically update the list
      const updatedBookmarks = this._state.bookmarks.filter(
        (b) => b.page.pageNumber !== pageBookmark.page.pageNumber
      );
      this.setState({ bookmarks: updatedBookmarks });
    } catch (error) {
      this.setState({ error: error as Error });
    }
  }

  /**
   * Toggle edit mode.
   */
  toggleEditMode(): void {
    this.setState({ isEditing: !this._state.isEditing });
  }

  /**
   * Set edit mode.
   */
  setEditMode(isEditing: boolean): void {
    this.setState({ isEditing });
  }

  /**
   * Clear error.
   */
  clearError(): void {
    this.setState({ error: null });
  }
}

