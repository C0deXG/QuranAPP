/**
 * ReciterService - Reciter management
 *
 * Translated from quran-ios/Domain/ReciterService
 *
 * This module provides:
 * - Reciter data retrieval from bundled resources
 * - Reciter preferences (selected, recent)
 * - Downloaded reciters tracking
 * - Audio file list generation
 * - Audio unzipping and deletion
 * - Download size calculation
 */

// Preferences
export {
  ReciterPreferences,
  lastSelectedReciterIdKey,
  recentReciterIdsKey,
  useLastSelectedReciterId,
  useRecentReciterIds,
} from './reciter-preferences';

// Data retrieval
export {
  ReciterDataRetriever,
  createReciterDataRetriever,
  getReciterLocalizedName,
} from './reciter-data-retriever';

// Audio files
export type { ReciterAudioFile } from './audio-file-list-retriever';
export {
  getAudioFiles,
  createReciterAudioFile,
} from './audio-file-list-retriever';

// Services
export {
  DownloadedRecitersService,
  RecentRecitersService,
  AudioUnzipper,
  ReciterAudioDeleter,
  ReciterSizeInfoRetriever,
  createDownloadedRecitersService,
  createRecentRecitersService,
  createAudioUnzipper,
  createReciterAudioDeleter,
  createReciterSizeInfoRetriever,
} from './reciter-services';

