/**
 * Features/AudioBanner - Audio playback control UI
 *
 * Translated from quran-ios/UI/NoorUI/Features/AudioBanner
 *
 * This module provides:
 * - Audio banner states (playing, ready to play, downloading)
 * - Audio control actions
 * - Speed selection menu
 * - Progress indicator for downloads
 */

// State and Actions
export {
  type AudioBannerState,
  type AudioBannerActions,
  playingState,
  readyToPlayState,
  downloadingState,
  SPEED_VALUES,
  formatSpeed,
} from './AudioBannerState';

// Banner View
export { AudioBannerView, type AudioBannerViewProps } from './AudioBannerView';

