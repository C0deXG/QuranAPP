/**
 * QuranAudioKit - Quran audio playback
 *
 * Translated from quran-ios/Domain/QuranAudioKit
 *
 * This module provides:
 * - Quran audio player with playback controls
 * - Audio request builders for gapless and gapped reciters
 * - Audio download management
 * - Audio preferences (end scope, playback rate)
 * - Preferences-based last ayah finder
 */

// Dependencies
export type { QueuingPlayer } from './dependencies/queuing-player';

// Re-export AudioEnd from model for convenience
export { AudioEnd, ALL_AUDIO_ENDS } from '../../model/quran-audio';

// Preferences
export { AudioPreferences } from './preferences/audio-preferences';
export {
  getAudioEndName,
  getAudioEndLocalizedName,
  getAllAudioEndOptions,
} from './preferences/audio-end-localization';
export { PreferencesLastAyahFinder } from './preferences/preferences-last-ayah-finder';

// Downloads
export {
  isAudioDownload,
  isAudioBatch,
  getReciterPath,
  reciterMatchesRequest,
  findBatchForReciter,
  findReciterForBatch,
} from './downloads/download-types';
export {
  QuranAudioDownloader,
  createQuranAudioDownloader,
} from './downloads/quran-audio-downloader';

// Audio Player
export type {
  QuranAudioRequest,
  QuranAudioRequestBuilder,
} from './audio-player/quran-audio-request';
export { GaplessAudioRequestBuilder } from './audio-player/gapless-audio-request-builder';
export { GappedAudioRequestBuilder } from './audio-player/gapped-audio-request-builder';
export type { QuranAudioPlayerActions } from './audio-player/quran-audio-player';
export {
  QuranAudioPlayer,
  createQuranAudioPlayer,
} from './audio-player/quran-audio-player';

