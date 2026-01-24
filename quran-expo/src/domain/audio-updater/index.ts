/**
 * AudioUpdater - Audio file update management
 *
 * Translated from quran-ios/Domain/AudioUpdater
 *
 * This module provides:
 * - Audio update checking and application
 * - Update preferences (revision, last checked)
 * - MD5 calculation for file verification
 * - Network fetching of update manifests
 */

// Types
export type {
  AudioUpdateFile,
  AudioUpdate,
  AudioUpdates,
} from './audio-update';

export { parseAudioUpdates } from './audio-update';

// Preferences
export { AudioUpdatePreferences } from './audio-update-preferences';

// MD5 Calculator
export {
  MD5Calculator,
  createMD5Calculator,
} from './md5-calculator';

// Network Manager
export {
  AudioUpdatesNetworkManager,
  createAudioUpdatesNetworkManager,
} from './audio-updates-network-manager';

// Updater
export {
  AudioUpdater,
  createAudioUpdater,
} from './audio-updater';

