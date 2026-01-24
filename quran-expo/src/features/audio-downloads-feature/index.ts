/**
 * AudioDownloadsFeature - Audio downloads management
 *
 * Translated from quran-ios/Features/AudioDownloadsFeature
 *
 * This module provides:
 * - AudioDownloadsBuilder for creating the audio downloads screen
 * - AudioDownloadsViewModel for managing download state
 * - AudioDownloadsScreen component for rendering
 * - AudioDownloadItem data model
 */

// Data Model
export {
  type AudioDownloadItem,
  type DownloadingProgress,
  createAudioDownloadItem,
  getAudioDownloadItemId,
  isDownloaded,
  canDelete,
  compareAudioDownloadItems,
  sortAudioDownloadItems,
  formatDownloadedSize,
} from './audio-download-item';

// View Model
export {
  AudioDownloadsViewModel,
  type AudioDownloadsViewState,
  type EditMode,
  type ReciterAudioDeleter,
  type ReciterSizeInfoRetriever,
} from './audio-downloads-view-model';

// Screen
export {
  AudioDownloadsScreen,
  type AudioDownloadsScreenProps,
} from './AudioDownloadsScreen';

// Builder
export { AudioDownloadsBuilder } from './audio-downloads-builder';

