/**
 * TranslationsFeature - Translations list
 *
 * Translated from quran-ios/Features/TranslationsFeature
 *
 * This module provides:
 * - TranslationsBuilder for creating the translations list screen
 * - TranslationsViewModel for managing translations state
 * - TranslationsScreen component for rendering
 * - TranslationItem data model
 */

// Translation Item
export {
  type TranslationItem,
  type DownloadingProgress,
  DownloadingProgress as DownloadingProgressFactory,
  createTranslationItem,
  getTranslationItemId,
  translationItemsEqual,
  getLocalizedLanguage,
  localizedLanguageForCode,
  getDisplayName,
  getLanguageCode,
  getItemLocalizedLanguage,
} from './translation-item';

// View Model
export {
  TranslationsViewModel,
  type TranslationsViewState,
  initialTranslationsViewState,
} from './translations-view-model';

// Screen
export { TranslationsScreen, type TranslationsScreenProps } from './TranslationsScreen';

// Builder
export { TranslationsBuilder } from './translations-builder';

