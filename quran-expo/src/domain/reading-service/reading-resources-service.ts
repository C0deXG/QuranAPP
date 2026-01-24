/**
 * ReadingResourcesService.swift → reading-resources-service.ts
 *
 * Service for managing reading resources (download, unzip, status).
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import { Reading } from '../../model/quran-kit';
import type { DownloadManager } from '../../data/batch-downloader';
import type { Zipper, FileSystem as IFileSystem } from '../../core/system-dependencies';
import { DefaultZipper, DefaultFileSystem } from '../../core/system-dependencies';
import { crasher } from '../../core/crashing';
import { createLogger } from '../../core/logging';
import { CancellableTask } from '../../core/utilities/task';
import { AsyncPublisher } from '../../core/utilities/async-publisher';
import { ReadingPreferences } from './reading-preferences';
import { ReadingResourceDownloader } from './reading-resource-downloader';
import type { ReadingRemoteResources, RemoteResource } from './reading-remote-resources';
import { getLocalPath } from './reading-remote-resources';

const logger = createLogger('ReadingResourcesService');

// ============================================================================
// Types
// ============================================================================

/**
 * Status of resource loading.
 */
export type ResourceStatus =
  | { type: 'downloading'; progress: number }
  | { type: 'ready' }
  | { type: 'error'; error: Error };

/**
 * Creates a downloading status.
 */
export function downloadingStatus(progress: number): ResourceStatus {
  return { type: 'downloading', progress };
}

/**
 * Creates a ready status.
 */
export function readyStatus(): ResourceStatus {
  return { type: 'ready' };
}

/**
 * Creates an error status.
 */
export function errorStatus(error: Error): ResourceStatus {
  return { type: 'error', error };
}

// ============================================================================
// ReadingResourcesService
// ============================================================================

/**
 * Service for managing reading resources.
 */
export class ReadingResourcesService {
  private readonly zipper: Zipper;
  private readonly fileSystem: IFileSystem;
  private readonly downloader: ReadingResourceDownloader;
  private readonly remoteResources: ReadingRemoteResources | null;
  private readonly preferences = ReadingPreferences.shared;

  private readingTask: CancellableTask | null = null;
  private readingsTask: CancellableTask | null = null;

  private readonly statusPublisher = new AsyncPublisher<ResourceStatus>();
  private lastStatus: ResourceStatus | null = null;
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    downloadManager: DownloadManager,
    remoteResources: ReadingRemoteResources | null,
    fileSystem?: IFileSystem,
    zipper?: Zipper
  ) {
    this.fileSystem = fileSystem ?? new DefaultFileSystem();
    this.zipper = zipper ?? new DefaultZipper();
    this.remoteResources = remoteResources;
    this.downloader = new ReadingResourceDownloader(downloadManager, remoteResources);
  }

  /**
   * Gets the status publisher for subscribing to status changes.
   */
  get status(): AsyncIterable<ResourceStatus> {
    return this.statusPublisher;
  }

  /**
   * Starts loading resources for the current reading preference.
   */
  startLoadingResources(): void {
    const initialReading = this.preferences.reading;

    this.readingsTask = new CancellableTask(async (signal: AbortSignal) => {
      // Load initial reading
      await this.loadResourceInTask(initialReading, signal);

      // Observe preference changes
      const unsubscribe = this.preferences.observeReading((reading) => {
        if (!signal.aborted) {
          this.loadResourceInTask(reading, signal);
        }
      });

      // Wait indefinitely until cancelled
      await new Promise<void>((_, reject) => {
        signal.addEventListener('abort', () => {
          unsubscribe();
          reject(new Error('Cancelled'));
        });
      });
    });
  }

  /**
   * Stops loading resources.
   */
  stopLoadingResources(): void {
    this.readingsTask?.cancel();
    this.readingsTask = null;
    this.readingTask?.cancel();
    this.readingTask = null;
  }

  /**
   * Retries loading the current reading.
   */
  async retry(): Promise<void> {
    const reading = this.preferences.reading;
    await this.loadResource(reading);
  }

  /**
   * Loads resource in a cancellable task.
   */
  private loadResourceInTask(reading: Reading, signal: AbortSignal): void {
    this.readingTask?.cancel();
    this.readingTask = new CancellableTask(async () => {
      if (signal.aborted) return;
      const status = await this.loadResource(reading);
      this.send(status, reading);
    });
  }

  /**
   * Loads the resource for a reading.
   */
  private async loadResource(reading: Reading): Promise<ResourceStatus> {
    // Remove previously downloaded resources
    this.removePreviouslyDownloadedResources(reading);
    await this.downloader.cancelDownload(reading);

    logger.info(`Resources: Start loading reading resources of: ${reading}`);

    const remoteResource = this.remoteResources?.resource(reading);
    if (!remoteResource) {
      logger.info(`Resources: Reading ${reading} is bundled with the app.`);
      return readyStatus();
    }

    // Check if already downloaded
    if (await this.fileSystem.fileExists(remoteResource.successFilePath)) {
      logger.info(`Resources: Reading ${reading} has been downloaded and saved locally before`);
      return readyStatus();
    }

    // Remove any partial download
    this.removeDownloadedResource(reading);

    try {
      // Start the download
      await this.downloader.download(reading, (progress) => {
        this.send(downloadingStatus(progress), reading);
      });

      // Unzip file after download completes
      await this.unzipFileIfNeeded(remoteResource);

      return readyStatus();
    } catch (error) {
      crasher.recordError(error as Error, `Failed to download ${reading}`);
      return errorStatus(error as Error);
    }
  }

  /**
   * Unzips the downloaded file if needed.
   */
  private async unzipFileIfNeeded(remoteResource: RemoteResource): Promise<void> {
    const zipFile = remoteResource.zipFile;
    const zipFileName = zipFile.substring(zipFile.lastIndexOf('/') + 1);
    const baseName = zipFileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const destination = `${remoteResource.downloadDestination}${baseName}/`;

    try {
      await this.zipper.unzip(zipFile, destination);

      // Write success marker file
      await this.fileSystem.writeToFile(remoteResource.successFilePath, 'Downloaded');
    } catch (error) {
      crasher.recordError(error as Error, `Cannot unzip file '${zipFile}'`);
      throw error;
    } finally {
      // Delete the zip file
      try {
        await this.fileSystem.removeItem(zipFile);
      } catch {
        // Ignore deletion errors
      }
    }
  }

  /**
   * Removes previously downloaded resources except the specified reading.
   */
  private removePreviouslyDownloadedResources(excludeReading: Reading): void {
    const allReadings = [
      Reading.hafs_1405,
      Reading.hafs_1440,
      Reading.hafs_1421,
      Reading.tajweed,
    ];

    for (const reading of allReadings) {
      if (reading !== excludeReading) {
        this.removeDownloadedResource(reading);
      }
    }
  }

  /**
   * Removes the downloaded resource for a reading.
   */
  private removeDownloadedResource(reading: Reading): void {
    const resource = this.remoteResources?.resource(reading);
    if (!resource) return;

    try {
      this.fileSystem.removeItem(resource.downloadDestination);
    } catch {
      // Ignore errors
    }
  }

  /**
   * Sends a status update (throttled).
   */
  private send(status: ResourceStatus, reading: Reading): void {
    // Don't send if reading has changed
    if (this.preferences.reading !== reading) {
      return;
    }

    // Throttle updates
    if (this.throttleTimer) {
      this.lastStatus = status;
      return;
    }

    this.statusPublisher.send(status);

    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null;
      if (this.lastStatus) {
        this.statusPublisher.send(this.lastStatus);
        this.lastStatus = null;
      }
    }, 100);
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    this.stopLoadingResources();
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
    }
    this.statusPublisher.complete();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a reading resources service.
 */
export function createReadingResourcesService(
  downloadManager: DownloadManager,
  remoteResources: ReadingRemoteResources | null
): ReadingResourcesService {
  return new ReadingResourcesService(downloadManager, remoteResources);
}

