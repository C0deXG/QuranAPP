/**
 * QuranAudioDownloader.swift → quran-audio-downloader.ts
 *
 * Downloads audio files for reciters.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../../../model/quran-kit/types';
import type { Reciter } from '../../../model/quran-audio';
import type {
  DownloadManager,
  DownloadRequest,
  DownloadBatchRequest,
  DownloadBatchResponse,
} from '../../../data/batch-downloader';
import type { FileSystem } from '../../../core/system-dependencies';
import { DefaultFileSystem } from '../../../core/system-dependencies';
import { isAudioBatch } from './download-types';
import { RelativeFilePath } from '../../../core/utilities';
import { getAudioFiles, type ReciterAudioFile } from '../../reciter-service';
import { reciterLocalFolder } from '../../../model/quran-audio';

// ============================================================================
// QuranAudioDownloader
// ============================================================================

/**
 * Downloads audio files for Quran recitation.
 */
export class QuranAudioDownloader {
  private readonly baseURL: string;
  private readonly downloader: DownloadManager;
  private readonly fileSystem: FileSystem;

  constructor(
    baseURL: string,
    downloader: DownloadManager,
    fileSystem: FileSystem = new DefaultFileSystem()
  ) {
    this.baseURL = baseURL;
    this.downloader = downloader;
    this.fileSystem = fileSystem;
  }

  /**
   * Checks if audio is downloaded for the given range.
   */
  async downloaded(
    reciter: Reciter,
    from: IAyahNumber,
    to: IAyahNumber
  ): Promise<boolean> {
    const files = this.filesForReciter(reciter, from, to);
    
    for (const file of files) {
      const destination = typeof file.destination === 'string' 
        ? file.destination 
        : file.destination.url;
      const exists = await this.fileSystem.fileExists(destination);
      if (!exists) {
        return false;
      }
    }
    return true;
  }

  /**
   * Downloads audio for the given range.
   */
  async download(
    from: IAyahNumber,
    to: IAyahNumber,
    reciter: Reciter
  ): Promise<DownloadBatchResponse> {
    // Ensure the reciter directory exists before starting any downloads.
    // Expo's DownloadResumable does not create intermediate folders.
    try {
      const reciterDir = reciterLocalFolder(reciter);
      await reciterDir.createDirectory();
    } catch {
      // If we fail to create the directory, downloads will still error; let the caller handle/log.
    }

    // Get audio files for the range
    const audioFiles = getAudioFiles(reciter, this.baseURL, from, to);
    
    // Filter out already downloaded files
    const filesToDownload: DownloadRequest[] = [];
    for (const file of audioFiles) {
      const destination = RelativeFilePath.file(file.local);
      const exists = await this.fileSystem.fileExists(destination.url);
      if (!exists) {
        filesToDownload.push({
          url: file.remote,
          destination,
        });
      }
    }
    
    // Create batch request
    const request: DownloadBatchRequest = {
      requests: filesToDownload,
    };
    
    // Start download
    return this.downloader.download(request);
  }

  /**
   * Cancels all audio downloads.
   */
  async cancelAllAudioDownloads(): Promise<void> {
    const downloads = await this.runningAudioDownloads();
    
    for (const download of downloads) {
      await download.cancel();
    }
  }

  /**
   * Gets currently running audio downloads.
   */
  async runningAudioDownloads(): Promise<DownloadBatchResponse[]> {
    const batches = await this.downloader.getOngoingDownloads();
    return batches.filter(isAudioBatch);
  }

  /**
   * Gets download requests for a reciter range.
   */
  private filesForReciter(
    reciter: Reciter,
    from: IAyahNumber,
    to: IAyahNumber
  ): DownloadRequest[] {
    const audioFiles = getAudioFiles(reciter, this.baseURL, from, to);
    
    return audioFiles.map((file: ReciterAudioFile) => ({
      url: file.remote,
      destination: RelativeFilePath.file(file.local),
    }));
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a QuranAudioDownloader.
 */
export function createQuranAudioDownloader(
  baseURL: string,
  downloader: DownloadManager,
  fileSystem?: FileSystem
): QuranAudioDownloader {
  return new QuranAudioDownloader(baseURL, downloader, fileSystem);
}
