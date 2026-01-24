/**
 * AudioUpdater.swift → audio-updater.ts
 *
 * Checks for and applies audio file updates.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { Reciter } from '../../model/quran-audio';
import { getAudioFilesPath, getReciterLocalFolder, getReciterLocalDatabasePath, getReciterLocalZipPath } from '../../model/quran-audio';
import type { NetworkManager } from '../../data/network-support';
import { createNetworkManager } from '../../data/network-support';
import type { FileSystem, SystemTime } from '../../core/system-dependencies';
import { DefaultFileSystem, DefaultSystemTime } from '../../core/system-dependencies';
import { crasher } from '../../core/crashing';
import { createLogger } from '../../core/logging';
import { ReciterDataRetriever } from '../reciter-service';
import { SQLiteAyahTimingPersistence } from '../../data/audio-timing-persistence';
import type { AudioUpdates, AudioUpdate, AudioUpdateFile } from './audio-update';
import { AudioUpdatePreferences } from './audio-update-preferences';
import { AudioUpdatesNetworkManager } from './audio-updates-network-manager';
import { MD5Calculator } from './md5-calculator';

const logger = createLogger('AudioUpdater');

// ============================================================================
// AudioUpdater
// ============================================================================

/**
 * Checks for and applies audio file updates.
 */
export class AudioUpdater {
  private readonly networkService: AudioUpdatesNetworkManager;
  private readonly recitersRetriever: ReciterDataRetriever;
  private readonly fileSystem: FileSystem;
  private readonly time: SystemTime;
  private readonly preferences = AudioUpdatePreferences.shared;
  private readonly md5Calculator = new MD5Calculator();

  constructor(
    networkManager: NetworkManager,
    recitersRetriever?: ReciterDataRetriever,
    fileSystem?: FileSystem,
    time?: SystemTime
  ) {
    this.networkService = new AudioUpdatesNetworkManager(networkManager);
    this.recitersRetriever = recitersRetriever ?? new ReciterDataRetriever();
    this.fileSystem = fileSystem ?? new DefaultFileSystem();
    this.time = time ?? new DefaultSystemTime();
  }

  /**
   * Creates an AudioUpdater with default configuration.
   */
  static create(baseURL: string): AudioUpdater {
    const networkManager = createNetworkManager(baseURL);
    return new AudioUpdater(networkManager);
  }

  /**
   * Updates audio files if needed.
   */
  async updateAudioIfNeeded(): Promise<void> {
    // Check if any reciters are downloaded
    const audioFilesPath = getAudioFilesPath();
    const downloadedReciters = await this.fileSystem.contentsOfDirectory(audioFilesPath.url);
    
    if (!downloadedReciters || downloadedReciters.length === 0) {
      return;
    }

    // Check if 7 days have passed since last check
    const lastChecked = this.preferences.lastChecked;
    if (lastChecked) {
      const today = this.time.now;
      const daysDiff = Math.floor((today.getTime() - lastChecked.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return;
      }
    }

    const lastRevision = this.preferences.lastRevision;
    logger.notice(`Running AudioUpdater for revision ${lastRevision}`);

    try {
      const updates = await this.networkService.getAudioUpdates(lastRevision);
      this.updateLastChecked();
      await this.update(updates);
    } catch (error) {
      crasher.recordError(error as Error, 'Audio Update request failed.');
    }
  }

  /**
   * Updates the last checked timestamp.
   */
  private updateLastChecked(): void {
    this.preferences.lastChecked = this.time.now;
  }

  /**
   * Applies updates if available.
   */
  private async update(updates: AudioUpdates | null): Promise<void> {
    if (!updates) {
      logger.notice('No new audio updates');
      return;
    }

    const reciters = await this.recitersRetriever.getReciters();
    await this.updateReciters(reciters, updates);
  }

  /**
   * Updates reciters with the given updates.
   */
  private async updateReciters(reciters: Reciter[], updates: AudioUpdates): Promise<void> {
    // Create a map of reciters by audio URL
    const reciterMap = new Map<string, Reciter>();
    for (const reciter of reciters) {
      const url = this.removeTrailingSlash(reciter.audioURL);
      reciterMap.set(url, reciter);
    }

    for (const update of updates.updates) {
      const path = this.removeTrailingSlash(update.path);
      const reciter = reciterMap.get(path);
      
      if (!reciter) {
        logger.warning(`Couldn't find reciter with path: ${update.path}`);
        continue;
      }

      // Check if reciter is downloaded
      const localFolder = getReciterLocalFolder(reciter);
      if (!await this.fileSystem.fileExists(localFolder.url)) {
        continue;
      }

      // Check and delete database if needed
      await this.deleteDatabaseIfNeeded(reciter, update);

      // Check and delete files if needed
      for (const file of update.files) {
        await this.deleteFileIfNeeded(reciter, file);
      }
    }

    this.preferences.lastRevision = updates.currentRevision;
  }

  /**
   * Deletes a file if its MD5 doesn't match.
   */
  private async deleteFileIfNeeded(reciter: Reciter, file: AudioUpdateFile): Promise<void> {
    const directory = getReciterLocalFolder(reciter);
    const localFile = `${directory.url}/${file.filename}`;

    if (!await this.fileSystem.fileExists(localFile)) {
      return;
    }

    try {
      const localMD5 = await this.md5Calculator.stringMD5(localFile);
      if (localMD5 === file.md5) {
        return;
      }
    } catch {
      // If we can't calculate MD5, don't delete
      return;
    }

    this.delete(localFile);
  }

  /**
   * Deletes the database if its version doesn't match.
   */
  private async deleteDatabaseIfNeeded(reciter: Reciter, update: AudioUpdate): Promise<void> {
    const dbFile = getReciterLocalDatabasePath(reciter);
    const zipFile = getReciterLocalZipPath(reciter);

    if (!dbFile || !zipFile) {
      return;
    }

    if (!await this.fileSystem.fileExists(dbFile.url)) {
      // If database doesn't exist, delete zip file (might be corrupted)
      this.delete(zipFile.url);
      return;
    }

    const localVersion = await this.getDatabaseVersion(dbFile.url);
    if (localVersion === update.databaseVersion) {
      return;
    }

    // Delete the reciter timing database
    this.delete(dbFile.url);
    this.delete(zipFile.url);
  }

  /**
   * Gets the database version.
   */
  private async getDatabaseVersion(fileUri: string): Promise<number | null> {
    try {
      const persistence = SQLiteAyahTimingPersistence.fromPath(fileUri);
      return await persistence.getVersion();
    } catch (error) {
      logger.error(`Error accessing the timing database. Error: ${error}`);
      return null;
    }
  }

  /**
   * Deletes a file.
   */
  private delete(filePath: string): void {
    logger.notice(`About to delete old audio file: ${filePath}`);
    try {
      this.fileSystem.removeItem(filePath);
    } catch {
      // Ignore deletion errors
    }
  }

  /**
   * Removes trailing slash from a string.
   */
  private removeTrailingSlash(str: string): string {
    if (str.endsWith('/')) {
      return str.slice(0, -1);
    }
    return str;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an AudioUpdater.
 */
export function createAudioUpdater(baseURL: string): AudioUpdater {
  return AudioUpdater.create(baseURL);
}
