/**
 * WordPointerFeature - Word-by-word translation pointer
 *
 * Translated from quran-ios/Features/WordPointerFeature
 *
 * This feature provides:
 * - Draggable pointer overlay for word-by-word translation
 * - Pan gesture handling with velocity-based animation
 * - Magnifying glass effect during panning
 * - Popover display for word translation text
 * - Word highlight integration with parent view
 *
 * This is one of the most technically complex features because it:
 * - Handles complex gesture interactions
 * - Communicates with parent view for word detection
 * - Manages multiple layers of UI (pointer, magnifying glass, popover)
 * - Animates with spring physics for natural feel
 * - Supports RTL layouts and safe area insets
 */

// Listener
export { type WordPointerListener } from './word-pointer-listener';

// View Model
export {
  WordPointerViewModel,
  type PanResult,
} from './word-pointer-view-model';

// View
export {
  WordPointerView,
  type WordPointerViewProps,
  type WordPointerHandle,
} from './WordPointerView';

// Builder
export { WordPointerBuilder } from './word-pointer-builder';

