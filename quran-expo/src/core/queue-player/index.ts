/**
 * Core QueuePlayer
 *
 * Translated from quran-ios/Core/QueuePlayer
 * Provides audio playback with frame-by-frame tracking, repeat support,
 * and interruption handling.
 */

// Runs (repeat count)
export {
  Runs,
  getMaxRuns,
  runsFromCount,
  allRuns,
} from './runs';

// Audio request types
export {
  type AudioFrame,
  type AudioFile,
  type AudioRequest,
  createAudioFrame,
  createAudioFile,
  createAudioRequest,
  getTotalFrameCount,
  getTotalFileCount,
  audioRequestsEqual,
} from './audio-request';

// Audio playing state
export { AudioPlaying } from './audio-playing';

// Player item info
export {
  type PlayerItemInfo,
  createPlayerItemInfo,
  setDefaultArtworkUri,
  getArtworkUri,
} from './player-item-info';

// Low-level player
export {
  Player,
  createPlayer,
} from './player';

// Audio interruption
export {
  AudioInterruptionType,
  AudioInterruptionMonitor,
  createAudioInterruptionMonitor,
} from './audio-interruption-monitor';

// Now playing updater
export {
  NowPlayingUpdater,
  createNowPlayingUpdater,
  nowPlayingUpdater,
} from './now-playing-updater';

// Audio player (internal, but exported for testing)
export { AudioPlayer } from './audio-player';

// Main queue player
export {
  type QueuePlayerActions,
  QueuePlayer,
  createQueuePlayer,
  createQueuePlayerActions,
} from './queue-player';

