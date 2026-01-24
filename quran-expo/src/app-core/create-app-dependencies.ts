/**
 * create-app-dependencies.ts
 *
 * Factory function to create the AppDependencies container.
 * This is the 1:1 equivalent of iOS's Container setup.
 *
 * Quran.com. All rights reserved.
 */

import { Platform } from 'react-native';
import type { AppDependencies } from '../features/app-dependencies';
import { ConsoleAnalyticsLibrary } from '../core/analytics';
import { logger } from '../core/logging';
import { DownloadManager } from '../data/batch-downloader';
import { getAnnotationsDatabase } from '../data/core-data-persistence/annotations-database';
import { createNotePersistence } from '../data/note-persistence/note-persistence';
import { createNoteService } from '../features/app-dependencies';

// ============================================================================
// Constants
// ============================================================================

const APP_HOST = 'https://api.quran.com';
// Match iOS files host for gapless timing DB zips
const FILES_APP_HOST = 'https://files.quran.app';

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates the AppDependencies container with all required dependencies.
 */
export async function createAppDependencies(): Promise<AppDependencies> {
  logger.info('Creating app dependencies...');

  let documentDirectory: string;
  let databasesDirectory: string;
  let logsDirectory: string;

  // Handle web platform - expo-file-system is not fully supported
  if (Platform.OS === 'web') {
    // On web, use virtual paths (actual file system not available)
    documentDirectory = '/virtual/documents/';
    databasesDirectory = '/virtual/documents/databases/';
    logsDirectory = '/virtual/documents/logs/';
    logger.info('Running on web - using virtual paths');
  } else {
    // On native, use expo-file-system
    try {
      const ExpoFS = await import('expo-file-system/legacy');

      // Use documentDirectory from the legacy API as fallback
      if (ExpoFS.documentDirectory) {
        documentDirectory = ExpoFS.documentDirectory;
      } else if (ExpoFS.Paths?.document?.uri) {
        documentDirectory = ExpoFS.Paths.document.uri;
      } else {
        // Fallback for iOS/Android
        documentDirectory = '';
        logger.warning('Could not determine document directory, using empty path');
      }

      databasesDirectory = `${documentDirectory}SQLite/`;
      logsDirectory = `${documentDirectory}logs/`;

      // Ensure directories exist using legacy API
      if (ExpoFS.makeDirectoryAsync) {
        try {
          await ExpoFS.makeDirectoryAsync(databasesDirectory, { intermediates: true });
          await ExpoFS.makeDirectoryAsync(logsDirectory, { intermediates: true });
        } catch {
          // Directories may already exist
        }
      }
    } catch (fsError) {
      logger.error('Failed to initialize file system:', fsError);
      // Use empty paths as fallback
      documentDirectory = '';
      databasesDirectory = '';
      logsDirectory = '';
    }
  }

  // Database URLs  
  const databasesURL = databasesDirectory;
  const quranUthmaniV2Database = `${databasesDirectory}quran_uthmani_v2.db`;
  const wordsDatabase = `${databasesDirectory}words.db`;
  const ayahInfoDatabase = `${databasesDirectory}ayahinfo.db`;

  // Create analytics
  const analytics = new ConsoleAnalyticsLibrary();

  // Create and initialize download manager
  const downloadManager = new DownloadManager();
  await downloadManager.start();

  logger.info('App dependencies created successfully');

  // Return a minimal working dependencies object
  // Full implementation would include all services
  const dependencies: AppDependencies = {
    databasesURL,
    quranUthmaniV2Database,
    wordsDatabase,
    appHost: APP_HOST,
    filesAppHost: FILES_APP_HOST,
    logsDirectory,
    databasesDirectory,
    supportsCloudKit: false,
    downloadManager,
    analytics,
    readingResources: null as any, // Will be initialized later
    remoteResources: null,
    lastPagePersistence: null as any, // Will be initialized later
    notePersistence: createNotePersistence(getAnnotationsDatabase()),
    noteService: null as any, // Will be initialized later (circular dependency workaround, or init here)
    pageBookmarkPersistence: null as any, // Will be initialized later
    authenticationClient: null,
    ayahInfoDatabase,
  };

  // Initialize NoteService
  const noteService = createNoteService(dependencies);
  (dependencies as any).noteService = noteService;

  return dependencies;
}

/**
 * Ensures a native directory exists, creating it if necessary.
 */
async function ensureNativeDirectoryExists(path: string, Directory: any): Promise<void> {
  try {
    const directory = new Directory(path);
    directory.create();
    logger.debug(`Created directory: ${path}`);
  } catch (error) {
    // Directory may already exist
    logger.debug(`Directory exists or error: ${path}`);
  }
}
