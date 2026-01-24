/**
 * QuranAudio - Audio-related models
 *
 * Translated from quran-ios/Model/QuranAudio
 *
 * This module provides:
 * - Reciter model and URL utilities
 * - Timing structures for audio playback
 * - Audio download tracking
 * - Audio ending scope options
 */

// Timing
export type { Timing } from './timing';
export {
  createTiming,
  createTimingFromSeconds,
  timingSeconds,
  timingsEqual,
  compareTimings,
  addTimings,
  subtractTimings,
  timingDuration,
} from './timing';

// Ayah timing
export type { AyahTiming } from './ayah-timing';
export {
  createAyahTiming,
  ayahTimingsEqual,
  compareAyahTimings,
} from './ayah-timing';

// Sura timing
export type { SuraTiming } from './sura-timing';
export {
  createSuraTiming,
  getAyahTiming,
  suraDuration,
} from './sura-timing';

// Range timing
export type { RangeTiming } from './range-timing';
export {
  createRangeTiming,
  createRangeTimingFromSuras,
  getSuraTiming,
  getSuraTimingBySura,
  rangeTimingSuras,
} from './range-timing';

// Reciter
export type { Reciter } from './reciter';
export { AudioType, AudioTypeGapped, AudioTypeGapless, isGapped } from './reciter';
export {
  ReciterCategory,
  gaplessAudioType,
  gappedAudioType,
  isGapless,
  createReciter,
  audioFilesPath,
  audioFilesPath as getAudioFilesPath,
  reciterLocalFolder,
  reciterLocalFolder as getReciterLocalFolder,
  reciterOldLocalFolder,
  reciterLocalDatabasePath,
  reciterLocalDatabasePath as getReciterLocalDatabasePath,
  reciterLocalZipPath,
  reciterLocalZipPath as getReciterLocalZipPath,
  reciterDatabaseRemoteURL,
  reciterRemoteURLForSura,
  reciterLocalURLForSura,
  reciterLocalURLForSura as getReciterLocalSuraPath,
  reciterRemoteURLForAyah,
  reciterLocalURLForAyah,
  reciterLocalURLForAyah as getReciterLocalAyahPath,
  isReciterDirectory,
  recitersEqual,
  reciterHashCode,
  getReciterAudioFiles,
} from './reciter';

// Audio end
export { AudioEnd, ALL_AUDIO_ENDS } from './audio-end';
export { audioEndDescription } from './audio-end';

// Audio downloaded size
export type { AudioDownloadedSize } from './audio-downloaded-size';
export {
  createAudioDownloadedSize,
  zeroAudioDownloadedSize,
  isAudioFullyDownloaded,
  audioDownloadProgress,
  formatDownloadedSize,
  audioDownloadedSizesEqual,
  audioDownloadedSizeHashCode,
} from './audio-downloaded-size';

