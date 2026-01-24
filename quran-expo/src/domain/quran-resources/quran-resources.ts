/**
 * QuranResources.swift → quran-resources.ts
 *
 * Provides paths to bundled Quran database resources.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

// ============================================================================
// Resource Paths
// ============================================================================

/**
 * Quran resources module.
 * Provides access to bundled database files.
 */
export const QuranResources = {
  /**
   * Gets the path to the Quran Uthmani V2 database.
   * The database must be copied from assets to document directory before use.
   */
  async getQuranUthmaniV2DatabasePath(): Promise<string> {
    return getAssetDatabasePath('quran.ar.uthmani.v2.db');
  },

  /**
   * Gets the path to the Quran Uthmani V2 database (synchronous - for when already loaded).
   * Returns the expected path in the document directory.
   */
  get quranUthmaniV2DatabasePath(): string {
    return getDatabasePath('quran.ar.uthmani.v2.db');
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Base directory for database files.
 */
const DATABASE_DIRECTORY = `${LegacyFS.documentDirectory}databases/`;

/**
 * Gets the document directory path for a database file.
 */
function getDatabasePath(filename: string): string {
  return `${DATABASE_DIRECTORY}${filename}`;
}

/**
 * Ensures the databases directory exists.
 */
async function ensureDatabaseDirectory(): Promise<void> {
  const dirInfo = await LegacyFS.getInfoAsync(DATABASE_DIRECTORY);
  if (!dirInfo.exists) {
    await LegacyFS.makeDirectoryAsync(DATABASE_DIRECTORY, { intermediates: true });
  }
}

/**
 * Gets the path to a database asset, copying it to the document directory if needed.
 */
async function getAssetDatabasePath(filename: string): Promise<string> {
  const destPath = getDatabasePath(filename);

  // Check if already copied
  const fileInfo = await LegacyFS.getInfoAsync(destPath);
  if (fileInfo.exists) {
    return destPath;
  }

  // Ensure directory exists
  await ensureDatabaseDirectory();

  // Load asset and copy to document directory
  // Note: In Expo, bundled assets need to be required or imported
  // This is a placeholder - actual implementation depends on how assets are bundled
  const asset = await loadDatabaseAsset(filename);
  if (asset && asset.localUri) {
    await LegacyFS.copyAsync({
      from: asset.localUri,
      to: destPath,
    });
  }

  return destPath;
}

/**
 * Loads a database asset.
 * This is a placeholder - actual implementation depends on asset bundling strategy.
 */
async function loadDatabaseAsset(filename: string): Promise<Asset | null> {
  // In a real implementation, you would use require() with the asset
  // For example: Asset.fromModule(require('../../assets/databases/quran.ar.uthmani.v2.db'))
  // This requires the asset to be bundled with the app

  // Placeholder implementation - will need to be configured per project setup
  console.warn(
    `Database asset loading not configured for: ${filename}. ` +
    `Please configure asset bundling in your Expo project.`
  );
  return null;
}

// ============================================================================
// Database Info
// ============================================================================

/**
 * Information about available Quran databases.
 */
export const QuranDatabaseInfo = {
  /** Arabic Uthmani V2 database filename */
  uthmaniV2: 'quran.ar.uthmani.v2.db',
} as const;

/**
 * Checks if a required database exists.
 */
export async function isDatabaseAvailable(filename: string): Promise<boolean> {
  const path = getDatabasePath(filename);
  const info = await LegacyFS.getInfoAsync(path);
  return info.exists;
}

/**
 * Gets the size of a database file.
 */
export async function getDatabaseSize(filename: string): Promise<number> {
  const path = getDatabasePath(filename);
  const info = await LegacyFS.getInfoAsync(path);
  if (info.exists && 'size' in info) {
    return info.size ?? 0;
  }
  return 0;
}

