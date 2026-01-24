/**
 * AdvancedAudioOptionsFeature - Audio settings
 *
 * Translated from quran-ios/Features/AdvancedAudioOptionsFeature
 *
 * This module provides:
 * - AdvancedAudioOptionsBuilder for creating the audio options screen
 * - AdvancedAudioOptionsViewModel for managing audio options state
 * - AdvancedAudioOptionsScreen component for rendering
 * - AdvancedAudioOptions data model
 * - Runs localization utilities
 */

// Data Model
export {
  type AdvancedAudioOptions,
  createAdvancedAudioOptions,
} from './advanced-audio-options';

// Runs Localization
export {
  sortedRuns,
  getRunsLocalizedDescription,
  runsEqual,
  getRunsKey,
} from './runs-localization';

// View Model
export {
  AdvancedAudioOptionsViewModel,
  type AdvancedAudioOptionsListener,
  type AdvancedAudioOptionsViewState,
} from './advanced-audio-options-view-model';

// Screen
export {
  AdvancedAudioOptionsScreen,
  type AdvancedAudioOptionsScreenProps,
} from './AdvancedAudioOptionsScreen';

// Builder
export { AdvancedAudioOptionsBuilder } from './advanced-audio-options-builder';

