/**
 * QuranTextKit - Search and text services
 *
 * Translated from quran-ios/Domain/QuranTextKit
 *
 * This module provides:
 * - Localization for QuranKit types
 * - Font size preferences
 * - Quran content state preferences
 * - Search functionality (composite, number, sura, persistence, translation)
 * - Search recents management
 * - Quran text data retrieval
 * - Shareable verse text
 * - Two pages utilities
 */

// Localization
export {
  getLocalizedAyahNumber,
  getLocalizedAyahName,
  getLocalizedAyahNameWithSuraNumber,
  getLocalizedJuzName,
  getLocalizedPageName,
  getLocalizedPageNumber,
  getLocalizedPageQuarterName,
  getLocalizedHizbName,
  getLocalizedQuarterName,
  getLocalizedSuraNumber,
  getLocalizedSuraName,
  getArabicSuraName,
} from './localization/quran-kit-localization';
export type { SuraNameOptions } from './localization/quran-kit-localization';

// Preferences
export {
  FontSizePreferences,
  translationFontSizeKey,
  arabicFontSizeKey,
  useTranslationFontSize,
  useArabicFontSize,
} from './preferences/font-size-preferences';

export {
  QuranContentStatePreferences,
  twoPagesEnabledKey,
  verticalScrollingEnabledKey,
  useQuranMode,
  useTwoPagesEnabled,
  useVerticalScrollingEnabled,
} from './preferences/quran-content-state-preferences';

export { SelectedTranslationsPreferences } from './preferences/selected-translations-preferences';

// Two Pages
export {
  getTwoPagesSettingDefaultValue,
  hasEnoughHorizontalSpace,
  isPhone,
  getPageCount,
} from './two-pages/two-pages-utils';

// TwoPagesUtils namespace for compatibility
import * as tpu from './two-pages/two-pages-utils';
export const TwoPagesUtils = {
  getTwoPagesSettingDefaultValue: tpu.getTwoPagesSettingDefaultValue,
  hasEnoughHorizontalSpace: tpu.hasEnoughHorizontalSpace,
  isPhone: tpu.isPhone,
  getPageCount: tpu.getPageCount,
};

// Search Term
export type { SearchTerm } from './search/search-term';
export {
  createSearchTerm,
  buildAutocompletions,
  buildSearchResults,
  getPersistenceQueryReplacingArabicSimilarity,
  removeInvalidSearchCharacters,
  trimmedWords,
  containsArabic,
  containsOnlyNumbers,
} from './search/search-term';

// Searchers
export type { Searcher } from './search/searchers';
export {
  NumberSearcher,
  PersistenceSearcher,
  SuraSearcher,
  TranslationSearcher,
} from './search/searchers';

// Composite Searcher
export {
  CompositeSearcher,
  createCompositeSearcher,
} from './search/composite-searcher';

// Search Recents
export {
  SearchRecentsService,
  POPULAR_SEARCH_TERMS,
  useRecentSearchItems,
} from './search/search-recents-service';

// Text Services
export {
  QuranTextDataService,
  createQuranTextDataService,
} from './text/quran-text-data-service';

export {
  ShareableVerseTextRetriever,
  createShareableVerseTextRetriever,
} from './text/shareable-verse-text-retriever';

export {
  LocalTranslationsRetriever,
  createLocalTranslationsRetriever,
} from './text/local-translations-retriever';

