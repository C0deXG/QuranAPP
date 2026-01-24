/**
 * TranslationVerseFeature - Single verse translation display
 *
 * Translated from quran-ios/Features/TranslationVerseFeature
 *
 * This feature provides:
 * - Single verse translation display
 * - Next/previous verse navigation
 * - Integration with more menu (limited options)
 * - Integration with translations selection
 * - Two-line navigation title (sura name + verse number)
 *
 * Used when the user taps "Show Translation" from the ayah menu.
 */

// Actions
export { type TranslationVerseActions } from './translation-verse-actions';

// View Model
export {
  TranslationVerseViewModel,
  type TranslationVerseViewModelState,
} from './translation-verse-view-model';

// Screen
export {
  TranslationVerseScreen,
  type TranslationVerseScreenProps,
} from './TranslationVerseScreen';

// Builder
export { TranslationVerseBuilder } from './translation-verse-builder';

