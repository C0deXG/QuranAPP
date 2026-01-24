/**
 * CommonAnalytics.swift → common-analytics.ts
 *
 * Common analytics events used across features.
 *
 * Quran.com. All rights reserved.
 */

import type { AnalyticsLibrary } from '../../core/analytics';
import type { Page } from '../../model/quran-kit';
import { Screen } from './screen';

// ============================================================================
// Analytics Extensions
// ============================================================================

/**
 * Extension methods for AnalyticsLibrary providing common analytics events.
 * These are implemented as standalone functions that take an AnalyticsLibrary instance.
 */

/**
 * Logs an event when a user removes a page bookmark.
 *
 * @param analytics - The analytics library instance
 * @param page - The page being unbookmarked
 */
export function logRemoveBookmarkPage(analytics: AnalyticsLibrary, page: Page): void {
  analytics.logEvent('RemovePageBookmark', String(page.pageNumber));
}

/**
 * Logs an event when opening the Quran from a specific screen.
 *
 * @param analytics - The analytics library instance
 * @param screen - The screen from which Quran was opened
 */
export function logOpeningQuran(analytics: AnalyticsLibrary, screen: Screen): void {
  analytics.logEvent('OpeningQuranFrom', screen);
}

// ============================================================================
// AnalyticsLibrary Extension Interface
// ============================================================================

/**
 * Extended analytics interface with common feature events.
 * This can be used to create a wrapper around AnalyticsLibrary.
 */
export interface CommonAnalytics extends AnalyticsLibrary {
  /**
   * Logs an event when a user removes a page bookmark.
   */
  removeBookmarkPage(page: Page): void;

  /**
   * Logs an event when opening the Quran from a specific screen.
   */
  openingQuran(from: Screen): void;
}

/**
 * Creates an extended analytics object with common feature events.
 *
 * @param analytics - The base analytics library instance
 * @returns Extended analytics with common events
 */
export function createCommonAnalytics(analytics: AnalyticsLibrary): CommonAnalytics {
  return {
    ...analytics,
    logEvent: analytics.logEvent.bind(analytics),
    removeBookmarkPage(page: Page): void {
      logRemoveBookmarkPage(analytics, page);
    },
    openingQuran(from: Screen): void {
      logOpeningQuran(analytics, from);
    },
  };
}

