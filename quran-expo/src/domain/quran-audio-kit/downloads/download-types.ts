/**
 * Download+Types.swift → download-types.ts
 *
 * Download type extensions for audio.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { DownloadRequest, DownloadBatchResponse } from '../../../data/batch-downloader';
import type { Reciter } from '../../../model/quran-audio';
import { audioFilesPath, reciterLocalFolder } from '../../../model/quran-audio';

// ============================================================================
// DownloadRequest Extensions
// ============================================================================

/**
 * Checks if a download request is for audio.
 */
export function isAudioDownload(request: DownloadRequest): boolean {
  const audioFilesRoot = audioFilesPath();
  const destination = request.destination.path;
  return destination.startsWith(audioFilesRoot.path);
}

/**
 * Checks if a download batch is for audio.
 */
export function isAudioBatch(batch: DownloadBatchResponse): boolean {
  return batch.requests.some(isAudioDownload);
}

/**
 * Gets the reciter path from a download request.
 */
export function getReciterPath(request: DownloadRequest): string {
  return request.destination.deletingLastPathComponent.path;
}

// ============================================================================
// Reciter Matching
// ============================================================================

/**
 * Checks if a reciter matches a download request.
 */
export function reciterMatchesRequest(reciter: Reciter, request: DownloadRequest): boolean {
  const reciterPath = reciterLocalFolder(reciter).path;
  const requestPath = getReciterPath(request);
  return reciterPath === requestPath;
}

/**
 * Finds the first matching batch for a reciter.
 */
export function findBatchForReciter(
  batches: Set<DownloadBatchResponse> | DownloadBatchResponse[],
  reciter: Reciter
): DownloadBatchResponse | undefined {
  const batchArray = Array.isArray(batches) ? batches : Array.from(batches);
  
  for (const batch of batchArray) {
    if (batch.requests.length > 0 && reciterMatchesRequest(reciter, batch.requests[0])) {
      return batch;
    }
  }
  return undefined;
}

/**
 * Finds the first matching reciter for a batch.
 */
export function findReciterForBatch(
  reciters: Reciter[],
  batch: DownloadBatchResponse
): Reciter | undefined {
  if (batch.requests.length === 0) return undefined;
  
  return reciters.find((reciter) => reciterMatchesRequest(reciter, batch.requests[0]));
}
