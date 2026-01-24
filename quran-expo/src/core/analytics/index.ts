/**
 * Core Analytics
 *
 * Translated from quran-ios/Core/Analytics
 * Provides analytics interface and utilities.
 */

export {
  type AnalyticsLibrary,
  NoOpAnalyticsLibrary,
  ConsoleAnalyticsLibrary,
  CompositeAnalyticsLibrary,
  setAnalyticsLibrary,
  getAnalyticsLibrary,
  logAnalyticsEvent,
  createEventLogger,
  createStructuredEventLogger,
} from './analytics-library';

