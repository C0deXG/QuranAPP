/**
 * QuranViewFeature - Main Quran reading screen
 *
 * Translated from quran-ios/Features/QuranViewFeature
 *
 * This is the CENTRAL feature of the entire app. It controls:
 * - Page navigation and display (image mode and translation mode)
 * - Reading pointer / word pointer
 * - Notes and highlighting
 * - Audio banner and playback
 * - Long press selection / ayah menu
 * - Search highlight and scrolling
 * - Deep linking behavior
 * - More menu
 * - Bookmark state
 * - Content status (downloading/error)
 *
 * Almost every other feature depends on or enters through QuranViewFeature.
 */

// Interactor
export {
  QuranInteractor,
  type QuranInteractorDeps,
  type QuranInteractorState,
  type QuranPresentable,
  type ContentStatus,
} from './quran-interactor';

// Screen
export {
  QuranScreen,
  type QuranScreenProps,
} from './QuranScreen';

// Builder
export { QuranBuilder } from './quran-builder';

