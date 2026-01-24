/**
 * ReadingResourceDownloader.swift → reading-resource-downloader.ts
 *
 * Downloads reading resources.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Reading } from '../../model/quran-kit';
import type {
  DownloadManager,
  DownloadBatchResponse,
  DownloadProgress,
} from '../../data/batch-downloader';
import {
  createDownloadRequest,
  createDownloadBatchRequest,
} from '../../data/batch-downloader';
import { RelativeFilePath } from '../../core/utilities';
import type { ReadingRemoteResources, RemoteResource } from './reading-remote-resources';
import {
  isDownloadDestinationPath,
  resourceMatchesBatch,
} from './reading-remote-resources';

// ============================================================================
// ReadingResourceDownloader
// ============================================================================

/**
 * Downloads reading resources.
 */
export class ReadingResourceDownloader {
  private readonly downloader: DownloadManager;
  private readonly remoteResources: ReadingRemoteResources | null;

  constructor(
    downloader: DownloadManager,
    remoteResources: ReadingRemoteResources | null
  ) {
    this.downloader = downloader;
    this.remoteResources = remoteResources;
  }

  /**
   * Downloads a reading resource.
   */
  async download(
    reading: Reading,
    onProgressChange: (progress: number) => void
  ): Promise<void> {
    // If null, then it's a local resource
    const remoteResource = this.remoteResources?.resource(reading);
    if (!remoteResource) {
      return;
    }

    let download: DownloadBatchResponse;

    // Check if already downloading
    const runningReadings = await this.runningReadings();
    const existingDownload = runningReadings.find((batch) =>
      resourceMatchesBatch(remoteResource, batch.requests)
    );

    if (existingDownload) {
      download = existingDownload;
    } else {
      const request = createDownloadRequest(
        remoteResource.url,
        RelativeFilePath.file(remoteResource.zipFile)
      );
      download = await this.downloader.download(
        createDownloadBatchRequest([request])
      );
    }

    // Track progress
    return new Promise<void>((resolve, reject) => {
      const unsubscribe = download.addProgressListener((progress: DownloadProgress) => {
        const progressFraction = progress.total > 0 ? progress.completed / progress.total : 0;
        onProgressChange(progressFraction);
      });
      download.addCompleteListener((error?: Error) => {
        unsubscribe();
        if (!error) {
          resolve();
        } else {
          reject(error ?? new Error('Download failed'));
        }
      });
    });
  }

  /**
   * Cancels all downloads except for the specified reading.
   */
  async cancelDownload(excludeReading: Reading): Promise<void> {
    const excludedResource = this.remoteResources?.resource(excludeReading);
    const runningReadings = await this.runningReadings();

    for (const batch of runningReadings) {
      if (excludedResource && resourceMatchesBatch(excludedResource, batch.requests)) {
        continue;
      }
      await batch.cancel();
    }
  }

  /**
   * Gets all running reading downloads.
   */
  private async runningReadings(): Promise<DownloadBatchResponse[]> {
    const allDownloads = await this.downloader.getOngoingDownloads();
    return Array.from(allDownloads).filter((batch) => this.isReadingDownload(batch));
  }

  /**
   * Checks if a download is for a reading.
   */
  private isReadingDownload(response: DownloadBatchResponse): boolean {
    return (
      response.requests.length === 1 &&
      response.requests.some((req) => isDownloadDestinationPath(req.destination.path))
    );
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a reading resource downloader.
 */
export function createReadingResourceDownloader(
  downloader: DownloadManager,
  remoteResources: ReadingRemoteResources | null
): ReadingResourceDownloader {
  return new ReadingResourceDownloader(downloader, remoteResources);
}

