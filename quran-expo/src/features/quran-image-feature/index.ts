/**
 * QuranImageFeature - Quran page image display
 *
 * Translated from quran-ios/Features/QuranImageFeature
 *
 * This module provides:
 * - ContentImageBuilder for creating the image view model
 * - ContentImageViewModel for managing image state
 * - ContentImageView component for rendering page images
 * - ImageDecorations for rendering highlights and decorations
 */

// View Model
export {
  ContentImageViewModel,
  type ContentImageViewState,
  type ImageDecorations,
} from './content-image-view-model';

// View
export {
  ContentImageView,
  type ContentImageViewProps,
} from './ContentImageView';

// Builder
export { ContentImageBuilder } from './content-image-builder';

