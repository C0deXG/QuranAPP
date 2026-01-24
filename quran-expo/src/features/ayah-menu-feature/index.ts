/**
 * AyahMenuFeature - Ayah context menu
 *
 * Translated from quran-ios/Features/AyahMenuFeature
 *
 * This module provides:
 * - AyahMenuBuilder for creating the ayah menu
 * - AyahMenuViewModel for managing menu state and actions
 * - AyahMenuScreen component for rendering
 * - AyahMenuInput and AyahMenuListener interfaces
 */

// Input
export {
  type AyahMenuInput,
  createAyahMenuInput,
} from './ayah-menu-input';

// Listener
export { type AyahMenuListener } from './ayah-menu-listener';

// View Model
export {
  AyahMenuViewModel,
  type AyahMenuViewModelDeps,
} from './ayah-menu-view-model';

// Screen
export {
  AyahMenuScreen,
  type AyahMenuScreenProps,
} from './AyahMenuScreen';

// Builder
export { AyahMenuBuilder } from './ayah-menu-builder';

