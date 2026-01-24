/**
 * TranslationsDownloader.swift → translations-downloader.ts
 *
 * Downloads translation files.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Translation } from '../../model/quran-text';
import type {
  DownloadManager,
  DownloadBatchResponse,
} from '../../data/batch-downloader';
import {
  createDownloadRequest,
  createDownloadBatchRequest,
} from '../../data/batch-downloader';
import { RelativeFilePath } from '../../core/utilities';

// ============================================================================
// Types
// ============================================================================

/**
 * Checks if a download request is for a translation.
 */
function isTranslationDownload(destination: string): boolean {
  return destination.includes('/translations/');
}

/**
 * Checks if a download batch is for a translation.
 */
function isTranslationBatch(batch: DownloadBatchResponse): boolean {
  if (batch.requests.length !== 1) return false;
  const request = batch.requests[0];
  return isTranslationDownload(request.destination.path);
}

// ============================================================================
// TranslationsDownloader
// ============================================================================

/**
 * Downloads translation files.
 */
export class TranslationsDownloader {
  private readonly downloader: DownloadManager;

  constructor(downloader: DownloadManager) {
    this.downloader = downloader;
  }

  /**
   * Downloads a translation.
   */
  async download(translation: Translation): Promise<DownloadBatchResponse> {
    const unprocessedPath = this.getUnprocessedLocalPath(translation);

    const downloadRequest = createDownloadRequest(
      translation.fileURL,
      unprocessedPath
    );

    const batchRequest = createDownloadBatchRequest([downloadRequest]);

    return this.downloader.download(batchRequest);
  }

  /**
   * Gets all running translation downloads.
   */
  async runningTranslationDownloads(): Promise<DownloadBatchResponse[]> {
    const allDownloads = await this.downloader.getOngoingDownloads();
    return Array.from(allDownloads).filter(isTranslationBatch);
  }

  /**
   * Gets the unprocessed local path for a translation.
   */
  private getUnprocessedLocalPath(translation: Translation): RelativeFilePath {
    return RelativeFilePath.file(`translations/${translation.fileName}`);
  }
}

// ============================================================================
// Extension Functions
// ============================================================================

/**
 * Finds the first matching download batch for a translation.
 */
export function findMatchingDownload(
  downloads: Set<DownloadBatchResponse> | DownloadBatchResponse[],
  translation: Translation
): DownloadBatchResponse | undefined {
  const unprocessedPath = `translations/${translation.fileName}`;

  for (const batch of downloads) {
    const request = batch.requests[0];
    if (request && request.destination.path === unprocessedPath) {
      return batch;
    }
  }

  return undefined;
}

/**
 * Finds the first matching translation for a download batch.
 */
export function findMatchingTranslation(
  translations: Translation[],
  batch: DownloadBatchResponse
): Translation | undefined {
  const request = batch.requests[0];
  if (!request) return undefined;

  return translations.find((translation) => {
    const unprocessedPath = `translations/${translation.fileName}`;
    return request.destination.path === unprocessedPath;
  });
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a translations downloader.
 */
export function createTranslationsDownloader(
  downloader: DownloadManager
): TranslationsDownloader {
  return new TranslationsDownloader(downloader);
}

