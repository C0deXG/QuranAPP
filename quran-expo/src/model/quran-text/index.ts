/**
 * QuranText - Text-related models
 *
 * Translated from quran-ios/Model/QuranText
 *
 * This module provides:
 * - Translation model and utilities
 * - Translated verse text structures
 * - Search result models
 * - Font size options
 * - Display mode enums
 */

// Translation
export type { Translation } from './translation';
export {
  createTranslation,
  isDownloaded,
  needsUpgrade,
  translationName,
  translatorDisplayName,
  isLocalTranslationPath,
  translationLocalPath,
  translationLocalFiles,
  unprocessedLocalPath,
  isUnprocessedFileZip,
  unprocessedFileName,
  compareTranslations,
  translationsEqual,
  translationHashCode,
} from './translation';

// Translated verses
export type {
  StringRange,
  TranslationString,
  TranslationText,
  VerseText,
  TranslatedVerses,
} from './translated-verses';
export {
  createTranslationString,
  translationTextString,
  translationTextReference,
  isTranslationTextString,
  isTranslationTextReference,
  createVerseText,
  createTranslatedVerses,
  translationStringsEqual,
} from './translated-verses';

// Search results
export type { SearchResult, SearchResultSource, SearchResults } from './search-results';
export {
  createSearchResult,
  searchResultId,
  searchResultsEqual,
  searchSourceQuran,
  searchSourceTranslation,
  searchSourceName,
  searchSourceId,
  compareSearchSources,
  createSearchResults,
  searchResultsId,
  searchResultsCollectionEqual,
} from './search-results';

// Font size
export { FontSize, ALL_FONT_SIZES, DEFAULT_FONT_SIZE } from './font-size';
export {
  fontSizeDescription,
  fontSizeScale,
  fontSizeLarger,
  fontSizeSmaller,
  fontSizeDistance,
  fontSizeAdvanced,
  isAccessibilitySize,
} from './font-size';

// Quran mode
export { QuranMode } from './quran-mode';
export { quranModeDescription, toggleQuranMode } from './quran-mode';

// Word text type
export { WordTextType } from './word-text-type';
export { wordTextTypeDescription, toggleWordTextType } from './word-text-type';

