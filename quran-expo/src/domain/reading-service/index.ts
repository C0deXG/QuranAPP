/**
 * ReadingService - Reading resources management
 *
 * Translated from quran-ios/Domain/ReadingService
 *
 * This module provides:
 * - Reading preferences (selected reading style)
 * - Remote resource definitions
 * - Resource downloading
 * - Resource status tracking
 */

// Preferences
export {
  ReadingPreferences,
  readingKey,
  useReading,
} from './reading-preferences';

// Remote Resources
export type { RemoteResource, ReadingRemoteResources } from './reading-remote-resources';
export {
  createRemoteResource,
  getLocalPath,
  isDownloadDestinationPath,
  getReadingsPath,
  resourceMatchesBatch,
  resourceMatchesRequest,
} from './reading-remote-resources';

// Downloader
export {
  ReadingResourceDownloader,
  createReadingResourceDownloader,
} from './reading-resource-downloader';

// Service
export type { ResourceStatus } from './reading-resources-service';
export {
  ReadingResourcesService,
  createReadingResourcesService,
  downloadingStatus,
  readyStatus,
  errorStatus,
} from './reading-resources-service';

