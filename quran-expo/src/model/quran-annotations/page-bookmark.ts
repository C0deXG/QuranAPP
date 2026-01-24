/**
 * PageBookmark.swift → page-bookmark.ts
 *
 * Model for page bookmarks.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IPage } from '../quran-kit/types';

/**
 * Represents a bookmark on a page.
 */
export interface PageBookmark {
  /** The bookmarked page */
  readonly page: IPage;
  /** When the bookmark was created */
  readonly creationDate: Date;
}

/**
 * Creates a PageBookmark.
 */
export function createPageBookmark(page: IPage, creationDate: Date): PageBookmark {
  return { page, creationDate };
}

/**
 * Creates a PageBookmark with the current time.
 */
export function createPageBookmarkNow(page: IPage): PageBookmark {
  return { page, creationDate: new Date() };
}

/**
 * Gets a unique ID for a PageBookmark.
 */
export function pageBookmarkId(bookmark: PageBookmark): string {
  return `bookmark-${bookmark.page.pageNumber}`;
}

/**
 * Checks if two PageBookmarks are equal.
 */
export function pageBookmarksEqual(a: PageBookmark, b: PageBookmark): boolean {
  return (
    a.page.pageNumber === b.page.pageNumber &&
    a.creationDate.getTime() === b.creationDate.getTime()
  );
}

/**
 * Compares two PageBookmarks by creation date (most recent first).
 */
export function comparePageBookmarksByDate(
  a: PageBookmark,
  b: PageBookmark
): number {
  return b.creationDate.getTime() - a.creationDate.getTime();
}

/**
 * Compares two PageBookmarks by page number.
 */
export function comparePageBookmarksByPage(
  a: PageBookmark,
  b: PageBookmark
): number {
  return a.page.pageNumber - b.page.pageNumber;
}

