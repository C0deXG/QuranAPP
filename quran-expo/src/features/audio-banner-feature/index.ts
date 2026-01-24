/**
 * AudioBannerFeature - Audio controls
 *
 * Translated from quran-ios/Features/AudioBannerFeature
 *
 * This module provides:
 * - AudioBannerBuilder for creating the audio banner
 * - AudioBannerViewModel for managing audio playback state
 * - AudioBannerScreen component for rendering
 * - AudioBannerListener for playback callbacks
 * - RemoteCommandsHandler for lock screen controls
 */

// Remote Commands
export {
  RemoteCommandsHandler,
  type RemoteCommandActions,
} from './remote-commands-handler';

// View Model
export {
  AudioBannerViewModel,
  type AudioBannerListener,
  type AdvancedAudioOptions,
  type AudioBannerViewState,
  initialAudioBannerViewState,
} from './audio-banner-view-model';

// Screen
export { AudioBannerScreen, type AudioBannerScreenProps } from './AudioBannerScreen';

// Builder
export { AudioBannerBuilder } from './audio-banner-builder';

