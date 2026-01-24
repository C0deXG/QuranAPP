/**
 * QuranContentFeature - Quran content display
 *
 * Translated from quran-ios/Features/QuranContentFeature
 *
 * This module provides:
 * - ContentBuilder for creating the content view model
 * - ContentViewModel for managing content state
 * - ContentScreen component for rendering pages
 * - QuranInput for input data
 * - ContentListener for event callbacks
 * - PageGeometryActions for hit testing
 */

// Input
export {
  type QuranInput,
  createQuranInput,
} from './quran-input';

// Listener
export { type ContentListener } from './content-listener';

// View Model
export {
  ContentViewModel,
  type ContentViewModelDeps,
  type ContentViewState,
  type PagingStrategy,
  type PageGeometryActions,
} from './content-view-model';

// Screen
export {
  ContentScreen,
  type ContentScreenProps,
} from './ContentScreen';

// Builder
export { ContentBuilder } from './content-builder';

