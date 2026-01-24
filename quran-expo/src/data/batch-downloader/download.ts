/**
 * Download.swift → download.ts
 *
 * Download and batch data structures.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { DownloadRequest } from './download-request';

/**
 * Status of a download.
 */
export enum DownloadStatus {
  /** Downloading or not started */
  Downloading = 0,
  /** Download completed */
  Completed = 1,
}

/**
 * Represents a single download.
 */
export interface Download {
  /** The batch this download belongs to */
  readonly batchId: number;
  /** The download request */
  readonly request: DownloadRequest;
  /** Current status */
  status: DownloadStatus;
  /** Task identifier (for tracking active downloads) */
  taskId?: string;
}

/**
 * Creates a new Download.
 */
export function createDownload(params: {
  batchId: number;
  request: DownloadRequest;
  status?: DownloadStatus;
  taskId?: string;
}): Download {
  return {
    batchId: params.batchId,
    request: params.request,
    status: params.status ?? DownloadStatus.Downloading,
    taskId: params.taskId,
  };
}

/**
 * Updates a download's status.
 */
export function updateDownloadStatus(
  download: Download,
  status: DownloadStatus
): Download {
  return { ...download, status };
}

/**
 * Updates a download's task ID.
 */
export function updateDownloadTaskId(
  download: Download,
  taskId: string | undefined
): Download {
  return { ...download, taskId };
}

/**
 * Checks if a download is in progress.
 */
export function isDownloadInProgress(download: Download): boolean {
  return download.status === DownloadStatus.Downloading;
}

/**
 * Checks if a download is completed.
 */
export function isDownloadCompleted(download: Download): boolean {
  return download.status === DownloadStatus.Completed;
}

/**
 * Represents a batch of downloads.
 */
export interface DownloadBatch {
  /** Unique batch identifier */
  readonly id: number;
  /** Downloads in this batch */
  readonly downloads: readonly Download[];
}

/**
 * Creates a new DownloadBatch.
 */
export function createDownloadBatch(
  id: number,
  downloads: Download[]
): DownloadBatch {
  return { id, downloads };
}

/**
 * Checks if a batch is fully completed.
 */
export function isBatchCompleted(batch: DownloadBatch): boolean {
  return batch.downloads.every(isDownloadCompleted);
}

/**
 * Checks if a batch is in progress.
 */
export function isBatchInProgress(batch: DownloadBatch): boolean {
  return batch.downloads.some(isDownloadInProgress);
}

/**
 * Gets the number of completed downloads in a batch.
 */
export function getCompletedCount(batch: DownloadBatch): number {
  return batch.downloads.filter(isDownloadCompleted).length;
}

/**
 * Gets the progress of a batch as a fraction.
 */
export function getBatchProgress(batch: DownloadBatch): number {
  if (batch.downloads.length === 0) {
    return 0;
  }
  return getCompletedCount(batch) / batch.downloads.length;
}

