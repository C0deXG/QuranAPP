/**
 * FeaturesSupport - Base utilities for features
 *
 * Translated from quran-ios/Features/FeaturesSupport
 *
 * This module provides:
 * - Screen enum for analytics tracking
 * - Common analytics events
 * - QuranNavigator interface for navigation
 */

// Screen enum
export { Screen } from './screen';

// Common analytics
export {
  logRemoveBookmarkPage,
  logOpeningQuran,
  createCommonAnalytics,
  type CommonAnalytics,
} from './common-analytics';

// Navigation
export {
  type QuranNavigator,
  type QuranNavigationParams,
  createNavigationParams,
} from './quran-navigator';

