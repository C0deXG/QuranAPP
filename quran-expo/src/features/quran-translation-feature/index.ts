/**
 * QuranTranslationFeature - Translation content display
 *
 * Translated from quran-ios/Features/QuranTranslationFeature
 *
 * This module provides:
 * - ContentTranslationBuilder for creating the translation view model
 * - ContentTranslationViewModel for managing translation state
 * - ContentTranslationView component for rendering translations
 * - TranslationItem models for list items
 * - TranslationFootnote for footnote display
 * - TranslationURL for URL encoding/decoding
 * - Translation UI utilities
 */

// Translation URL
export {
  type TranslationURL,
  translationURLToString,
  parseTranslationURL,
  createFootnoteURL,
  createReadMoreURL,
} from './translation-url';

// Translation UI
export {
  type TranslationTextFont,
  type CharacterDirection,
  getTranslationTextFont,
  getTranslationCharacterDirection,
} from './translation-ui';

// Translation Item
export {
  type TranslationItemId,
  translationItemIdKey,
  translationItemIdAyah,
  type TranslationPageHeader,
  type TranslationPageFooter,
  type TranslationVerseSeparator,
  type TranslationSuraName,
  type TranslationArabicText,
  type TranslationTextChunk,
  type TranslationReferenceVerse,
  type TranslatorText,
  type TranslationItem,
  createTranslationPageHeader,
  createTranslationPageFooter,
  createTranslationVerseSeparator,
  createTranslationSuraName,
  createTranslationArabicText,
  createTranslationTextChunk,
  createTranslationReferenceVerse,
  createTranslatorText,
  getTranslationItemId,
  getTranslationItemColor,
} from './translation-item';

// Translation Footnote
export {
  type TranslationFootnote,
  getFootnoteText,
  getFootnoteId,
} from './translation-footnote';

// View Model
export {
  ContentTranslationViewModel,
  type ContentTranslationViewState,
  CollectionTracker,
} from './content-translation-view-model';

// View
export {
  ContentTranslationView,
  type ContentTranslationViewProps,
} from './ContentTranslationView';

// Builder
export { ContentTranslationBuilder } from './content-translation-builder';

