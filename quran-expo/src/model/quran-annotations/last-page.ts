/**
 * LastPage.swift → last-page.ts
 *
 * Model for tracking the last read page.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IPage } from '../quran-kit/types';

/**
 * Represents the last page the user was reading.
 */
export interface LastPage {
  /** The page */
  readonly page: IPage;
  /** When this record was created */
  readonly createdOn: Date;
  /** When this record was last modified */
  readonly modifiedOn: Date;
}

/**
 * Creates a LastPage.
 */
export function createLastPage(
  page: IPage,
  createdOn: Date,
  modifiedOn: Date
): LastPage {
  return { page, createdOn, modifiedOn };
}

/**
 * Creates a LastPage with the current time.
 */
export function createLastPageNow(page: IPage): LastPage {
  const now = new Date();
  return { page, createdOn: now, modifiedOn: now };
}

/**
 * Updates the modified date on a LastPage.
 */
export function updateLastPageModified(lastPage: LastPage): LastPage {
  return { ...lastPage, modifiedOn: new Date() };
}

/**
 * Gets a unique ID for a LastPage.
 */
export function lastPageId(lastPage: LastPage): string {
  return `page-${lastPage.page.pageNumber}`;
}

/**
 * Checks if two LastPages are equal.
 */
export function lastPagesEqual(a: LastPage, b: LastPage): boolean {
  return (
    a.page.pageNumber === b.page.pageNumber &&
    a.createdOn.getTime() === b.createdOn.getTime() &&
    a.modifiedOn.getTime() === b.modifiedOn.getTime()
  );
}

/**
 * Compares two LastPages by modified date (most recent first).
 */
export function compareLastPagesByModified(a: LastPage, b: LastPage): number {
  return b.modifiedOn.getTime() - a.modifiedOn.getTime();
}

