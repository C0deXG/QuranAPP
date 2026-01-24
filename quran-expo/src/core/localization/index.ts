/**
 * Core Localization
 *
 * Translated from quran-ios/Core/Localization
 * This module provides internationalization (i18n) support for the app.
 */

// Localization service
export {
  initLocalization,
  initLocalization as initializeLocalization, // Alias for consistency
  getCurrentLanguage,
  setLanguage,
  isRTL,
  l,
  lFormat,
  lAndroid,
  lTable,
  getSuraName,
  getArabicSuraName,
  getSuraTranslation,
  getReciterName,
  getSupportedLanguages,
  isLanguageSupported,
  type Language,
  type TranslationTable,
} from './localization';

// Number formatting
export {
  NumberFormatter,
  getFixedLocale,
  formatNumber,
  formatArabicNumber,
  formatPercent,
  formatBytes,
  formatDuration,
  parseNumber,
  formatOrdinal,
  type NumberFormatterOptions,
} from './number-formatter';

