/**
 * database-setup.ts
 *
 * Sets up the Quran database by copying from assets to document directory.
 * expo-sqlite requires database files to be in the document directory.
 *
 * Quran.com. All rights reserved.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

// Database paths
export const QURAN_DB_NAME = 'quran.ar.uthmani.v2.db';
export const WORDS_DB_NAME = 'words.db';
export const AYAHINFO_DB_NAME = 'ayahinfo.db';

/**
 * Gets the SQLite directory (where expo-sqlite looks for databases).
 */
/**
 * Gets the SQLite directory (where expo-sqlite looks for databases).
 */
export function getSQLiteDirectory(): string {
  return `${FileSystem.documentDirectory}SQLite/`;
}

/**
 * Gets the path where additional databases are stored.
 * NOTE: For expo-sqlite to find them by name, they must be in the SQLite directory.
 */
export function getDatabaseDirectory(): string {
  return getSQLiteDirectory();
}

/**
 * Gets the full path to the Quran database in SQLite directory.
 */
export function getQuranDatabasePath(): string {
  return `${getSQLiteDirectory()}${QURAN_DB_NAME}`;
}

/**
 * Gets the full path to the words database.
 */
export function getWordsDatabasePath(): string {
  return `${getSQLiteDirectory()}${WORDS_DB_NAME}`;
}

/**
 * Gets the full path to the ayah info database.
 */
export function getAyahInfoDatabasePath(): string {
  return `${getSQLiteDirectory()}${AYAHINFO_DB_NAME}`;
}

/**
 * Ensures a directory exists.
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(dirPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Copies a database from assets to the destination if needed.
 * Uses size check to ensure the database is complete.
 */
async function copyDatabaseIfNeeded(
  assetModule: number,
  destinationPath: string,
  expectedSize: number
): Promise<void> {
  const fileInfo = await FileSystem.getInfoAsync(destinationPath);

  // Check if file exists and has correct size
  if (fileInfo.exists && fileInfo.size !== undefined && fileInfo.size >= expectedSize) {
    console.log(`Database already exists with correct size: ${destinationPath} (${fileInfo.size} bytes)`);
    return;
  }

  // If file exists but is too small (likely empty/corrupted), delete it
  if (fileInfo.exists) {
    console.log(`Removing incomplete/corrupted database: ${destinationPath} (size: ${fileInfo.size}, expected: ${expectedSize})`);
    await FileSystem.deleteAsync(destinationPath, { idempotent: true });
  }

  console.log(`Copying database to: ${destinationPath}`);

  // Load the asset
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error(`Failed to download asset for ${destinationPath}`);
  }

  console.log(`Asset downloaded: ${asset.localUri}`);

  // Copy to destination
  await FileSystem.copyAsync({
    from: asset.localUri,
    to: destinationPath,
  });

  // Verify copy
  const newInfo = await FileSystem.getInfoAsync(destinationPath);
  if (newInfo.exists) {
    console.log(`Database copied: ${destinationPath} (${newInfo.size} bytes)`);
    if (newInfo.size !== undefined && newInfo.size < expectedSize) {
      console.warn(`WARNING: Copied database is smaller than expected! (${newInfo.size} < ${expectedSize})`);
    }
  } else {
    console.warn(`Database copy failed or file not found: ${destinationPath}`);
  }
}

/**
 * Sets up all required databases.
 * Call this during app initialization.
 */

/**
 * Sets up all required databases.
 * Call this during app initialization.
 */
export async function setupDatabases(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('Setting up databases for Web...');
    try {
      // Helper to import DB on web
      const importWebDb = async (module: number, dbName: string) => {
        const asset = Asset.fromModule(module);
        await asset.downloadAsync();

        // Use importDatabaseFromUrlAsync if available (Expo SQLite 14+)
        if (typeof (SQLite as any).importDatabaseFromUrlAsync === 'function') {
          console.log(`Importing ${dbName} for web...`);
          await (SQLite as any).importDatabaseFromUrlAsync(asset.uri, dbName);
        } else {
          console.warn('importDatabaseFromUrlAsync not found. Database might be empty on web.');
        }
      };

      await importWebDb(require('../../assets/databases/quran.ar.uthmani.v2.db'), QURAN_DB_NAME);
      await importWebDb(require('../../assets/databases/words.db'), WORDS_DB_NAME);
      await importWebDb(require('../../assets/databases/ayahinfo.db'), AYAHINFO_DB_NAME);

      console.log('Web databases setup complete');
    } catch (e) {
      console.error('Web DB setup failed', e);
    }
    return;
  }

  try {
    // Ensure directories exist
    await ensureDirectoryExists(getSQLiteDirectory());
    await ensureDirectoryExists(getDatabaseDirectory());

    // Copy Quran database to SQLite directory (where expo-sqlite looks)
    await copyDatabaseIfNeeded(
      require('../../assets/databases/quran.ar.uthmani.v2.db'),
      getQuranDatabasePath(),
      5198848 // Expected size of quran.ar.uthmani.v2.db
    );

    // Copy words database to databases directory
    await copyDatabaseIfNeeded(
      require('../../assets/databases/words.db'),
      getWordsDatabasePath(),
      458752 // Expected size of words.db
    );

    // Copy ayah info database to databases directory
    await copyDatabaseIfNeeded(
      require('../../assets/databases/ayahinfo.db'),
      getAyahInfoDatabasePath(),
      6356992 // Expected size of ayahinfo.db
    );

    // Verify databases are set up correctly
    console.log('[DatabaseSetup] Verifying database setup...');

    // Log directory contents
    const sqliteDir = getSQLiteDirectory();
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (dirInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(sqliteDir);
      console.log(`[DatabaseSetup] SQLite directory contents (${sqliteDir}):`, files);

      // Log size of ayahinfo.db
      const dbPath = getAyahInfoDatabasePath();
      const dbInfo = await FileSystem.getInfoAsync(dbPath);
      console.log(`[DatabaseSetup] ayahinfo.db info:`, JSON.stringify(dbInfo));

      // Try to open and query immediately
      try {
        console.log('[DatabaseSetup] Attempting to open ayahinfo.db for test query...');
        // Use just the filename as expo-sqlite expects
        const db = await SQLite.openDatabaseAsync(AYAHINFO_DB_NAME);
        const result = await db.getAllAsync('SELECT count(*) as count FROM glyphs WHERE page_number = 1');
        console.log('[DatabaseSetup] Test query result:', JSON.stringify(result));
        await db.closeAsync();
      } catch (e) {
        console.error('[DatabaseSetup] Test query failed:', e);
        // If the DB is corrupt/empty, force re-copy from bundled asset
        try {
          console.log('[DatabaseSetup] Re-copying ayahinfo.db from bundled asset after failed test query...');
          await FileSystem.deleteAsync(getAyahInfoDatabasePath(), { idempotent: true });
          await copyDatabaseIfNeeded(
            require('../../assets/databases/ayahinfo.db'),
            getAyahInfoDatabasePath(),
            6356992
          );
        } catch (copyError) {
          console.error('[DatabaseSetup] Failed to re-copy ayahinfo.db:', copyError);
        }
      }
    } else {
      console.warn(`[DatabaseSetup] SQLite directory does not exist! (${sqliteDir})`);
    }

    console.log('All databases set up successfully');
  } catch (error) {
    console.error('Failed to setup databases:', error);
    throw error;
  }
}

/**
 * Checks if databases are ready.
 */
export async function areDatabasesReady(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // On web, we assume they are ready after setup called, 
    // or we could check SQLite.exists but the FS paths are different.
    // Returning true allows the app to proceed to load data.
    return true;
  }

  try {
    const quranInfo = await FileSystem.getInfoAsync(getQuranDatabasePath());
    const wordsInfo = await FileSystem.getInfoAsync(getWordsDatabasePath());
    const ayahInfo = await FileSystem.getInfoAsync(getAyahInfoDatabasePath());

    const isQuranReady = quranInfo.exists && (quranInfo.size ?? 0) > 1000000;
    const isWordsReady = wordsInfo.exists && (wordsInfo.size ?? 0) > 100000;
    const isAyahReady = ayahInfo.exists && (ayahInfo.size ?? 0) > 1000000;

    return isQuranReady && isWordsReady && isAyahReady;
  } catch {
    return false;
  }
}

