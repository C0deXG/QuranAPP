/**
 * DownloadManager.swift → download-manager.ts
 *
 * Manages batch downloads using expo-file-system.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import { ManagedCriticalState } from '../../core/utilities/locking';
import type { DownloadBatchRequest, DownloadRequest } from './download-request';
import { downloadRequestKey } from './download-request';
import type { Download, DownloadBatch } from './download';
import { DownloadStatus, createDownload, createDownloadBatch } from './download';
import type { DownloadProgress } from './download-progress';
import {
  createDownloadProgress,
  combineProgress,
  getProgressFraction,
} from './download-progress';
import type { DownloadsPersistence } from './downloads-persistence';
import { SQLiteDownloadsPersistence } from './downloads-persistence';
import { FileSystemError } from './file-system-error';
import { NetworkError } from '../network-support';

// Type alias for DownloadResumable from legacy API
type DownloadResumable = ReturnType<typeof LegacyFS.createDownloadResumable>;

// ============================================================================
// Types
// ============================================================================

/**
 * State of a download response.
 */
type ResponseState =
  | { type: 'inProgress' }
  | { type: 'finished' }
  | { type: 'failed'; error: Error };

/**
 * Internal response data for tracking a single download.
 */
interface ResponseData {
  request: DownloadRequest;
  state: ResponseState;
  progress: DownloadProgress;
  taskId?: string;
  downloadResumable?: DownloadResumable;
}

/**
 * Listener for download progress updates.
 */
export type DownloadProgressListener = (progress: DownloadProgress) => void;

/**
 * Listener for download completion.
 */
export type DownloadCompleteListener = (error?: Error) => void;

// ============================================================================
// Download Batch Response
// ============================================================================

/**
 * Represents an ongoing or completed batch download.
 */
export class DownloadBatchResponse {
  readonly batchId: number;
  readonly requests: readonly DownloadRequest[];

  private responses = new Map<string, ResponseData>();
  private progressListeners = new Set<DownloadProgressListener>();
  private completeListeners = new Set<DownloadCompleteListener>();
  private _currentProgress: DownloadProgress = createDownloadProgress(1, 0);

  constructor(batch: DownloadBatch) {
    this.batchId = batch.id;
    this.requests = batch.downloads.map((d) => d.request);

    // Initialize response data for each download
    for (const download of batch.downloads) {
      const state: ResponseState =
        download.status === DownloadStatus.Completed
          ? { type: 'finished' }
          : { type: 'inProgress' };

      this.responses.set(downloadRequestKey(download.request), {
        request: download.request,
        state,
        progress: createDownloadProgress(1, state.type === 'finished' ? 1 : 0),
        taskId: download.taskId,
      });
    }

    this.updateOverallProgress();
  }

  /**
   * Gets the current overall progress.
   */
  get currentProgress(): DownloadProgress {
    return this._currentProgress;
  }

  /**
   * Checks if all downloads are complete.
   */
  get isComplete(): boolean {
    for (const response of this.responses.values()) {
      if (response.state.type !== 'finished') {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if any download has failed.
   */
  get hasFailed(): boolean {
    for (const response of this.responses.values()) {
      if (response.state.type === 'failed') {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the first error if any.
   */
  get firstError(): Error | undefined {
    for (const response of this.responses.values()) {
      if (response.state.type === 'failed') {
        return response.state.error;
      }
    }
    return undefined;
  }

  /**
   * Adds a progress listener.
   */
  addProgressListener(listener: DownloadProgressListener): () => void {
    this.progressListeners.add(listener);
    // Immediately call with current progress
    listener(this._currentProgress);
    return () => this.progressListeners.delete(listener);
  }

  /**
   * Adds a completion listener.
   */
  addCompleteListener(listener: DownloadCompleteListener): () => void {
    this.completeListeners.add(listener);
    // If already complete, call immediately
    if (this.isComplete || this.hasFailed) {
      listener(this.firstError);
    }
    return () => this.completeListeners.delete(listener);
  }

  /**
   * Cancels all downloads in this batch.
   */
  async cancel(): Promise<void> {
    for (const response of this.responses.values()) {
      if (response.downloadResumable) {
        try {
          await response.downloadResumable.pauseAsync();
        } catch (error) {
          logger.warning(`Error pausing download: ${error}`, 'DownloadBatchResponse');
        }
      }
      this.completeRequest(response.request, new Error('Cancelled'));
    }
  }

  // ============================================================================
  // Internal Methods
  // ============================================================================

  /**
   * Gets a download for persistence.
   */
  getDownload(request: DownloadRequest): Download {
    const key = downloadRequestKey(request);
    const response = this.responses.get(key);
    if (!response) {
      throw new Error(`No response for request: ${request.url}`);
    }

    return createDownload({
      batchId: this.batchId,
      request,
      status:
        response.state.type === 'finished'
          ? DownloadStatus.Completed
          : DownloadStatus.Downloading,
      taskId: response.taskId,
    });
  }

  /**
   * Gets all downloads for persistence.
   */
  getAllDownloads(): Download[] {
    return this.requests.map((r) => this.getDownload(r));
  }

  /**
   * Gets the next request that needs to be started.
   */
  getNextUnstartedRequest(): DownloadRequest | undefined {
    for (const response of this.responses.values()) {
      if (response.state.type === 'inProgress' && !response.taskId) {
        return response.request;
      }
    }
    return undefined;
  }

  /**
   * Gets running task count.
   */
  getRunningTaskCount(): number {
    let count = 0;
    for (const response of this.responses.values()) {
      if (response.state.type === 'inProgress' && response.taskId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Sets the task ID and resumable for a request.
   */
  setTask(
    request: DownloadRequest,
    taskId: string,
    downloadResumable: DownloadResumable
  ): void {
    const key = downloadRequestKey(request);
    const response = this.responses.get(key);
    if (response) {
      response.taskId = taskId;
      response.downloadResumable = downloadResumable;
    }
  }

  /**
   * Updates progress for a request.
   */
  updateProgress(
    request: DownloadRequest,
    totalBytesWritten: number,
    totalBytesExpectedToWrite: number
  ): void {
    const key = downloadRequestKey(request);
    const response = this.responses.get(key);
    if (response && response.state.type === 'inProgress') {
      response.progress = createDownloadProgress(
        totalBytesExpectedToWrite,
        totalBytesWritten
      );
      this.updateOverallProgress();
    }
  }

  /**
   * Marks a request as complete.
   */
  completeRequest(request: DownloadRequest, error?: Error): void {
    const key = downloadRequestKey(request);
    const response = this.responses.get(key);
    if (!response) return;

    if (error) {
      response.state = { type: 'failed', error };
    } else {
      response.state = { type: 'finished' };
      response.progress = createDownloadProgress(1, 1);
    }

    this.updateOverallProgress();
    this.checkCompletion();
  }

  private updateOverallProgress(): void {
    const progresses = Array.from(this.responses.values()).map((r) => r.progress);
    this._currentProgress = combineProgress(progresses);

    for (const listener of this.progressListeners) {
      try {
        listener(this._currentProgress);
      } catch (error) {
        logger.warning(`Progress listener error: ${error}`, 'DownloadBatchResponse');
      }
    }
  }

  private checkCompletion(): void {
    const isComplete = this.isComplete;
    const hasFailed = this.hasFailed;

    if (isComplete || hasFailed) {
      const error = this.firstError;

      if (error) {
        crasher.recordError(error, `Download failed batch ${this.batchId}`);

        // Cancel other downloads if one failed
        for (const response of this.responses.values()) {
          if (response.state.type === 'inProgress' && response.downloadResumable) {
            response.downloadResumable.pauseAsync().catch(() => {});
          }
        }
      }

      for (const listener of this.completeListeners) {
        try {
          listener(error);
        } catch (e) {
          logger.warning(`Complete listener error: ${e}`, 'DownloadBatchResponse');
        }
      }
    }
  }
}

// ============================================================================
// Download Manager
// ============================================================================

interface DownloadManagerState {
  responses: Map<number, DownloadBatchResponse>;
  started: boolean;
}

/**
 * Manages batch downloads.
 */
export class DownloadManager {
  private readonly maxSimultaneousDownloads: number;
  private readonly persistence: DownloadsPersistence;
  private readonly state = new ManagedCriticalState<DownloadManagerState>({
    responses: new Map(),
    started: false,
  });

  constructor(options?: {
    maxSimultaneousDownloads?: number;
    persistence?: DownloadsPersistence;
  }) {
    this.maxSimultaneousDownloads = options?.maxSimultaneousDownloads ?? 3;
    this.persistence = options?.persistence ?? new SQLiteDownloadsPersistence();
  }

  /**
   * Starts the download manager and resumes any pending downloads.
   */
  async start(): Promise<void> {
    logger.info('Starting download manager', 'DownloadManager');

    await this.state.withCriticalRegion(async (state) => {
      if (state.started) return;
      state.started = true;

      // Load persisted downloads
      const batches = await this.persistence.retrieveAll();

      for (const batch of batches) {
        // Skip completed batches
        if (batch.downloads.every((d) => d.status === DownloadStatus.Completed)) {
          continue;
        }

        const response = new DownloadBatchResponse(batch);
        state.responses.set(batch.id, response);
      }
    });

    // Start downloading
    await this.startNextDownloads();

    logger.info('Download manager started', 'DownloadManager');
  }

  /**
   * Gets all ongoing downloads.
   */
  async getOngoingDownloads(): Promise<DownloadBatchResponse[]> {
    logger.info('getOngoingDownloads requested', 'DownloadManager');

    return this.state.withCriticalRegion(async (state) => {
      const responses = Array.from(state.responses.values()).filter(
        (r) => !r.isComplete
      );
      logger.debug(`Found ${responses.length} ongoing downloads`, 'DownloadManager');
      return responses;
    });
  }

  /**
   * Starts a new batch download.
   */
  async download(batch: DownloadBatchRequest): Promise<DownloadBatchResponse> {
    logger.debug(
      `Requested to download ${batch.requests.map((r) => r.url)}`,
      'DownloadManager'
    );

    // Insert into persistence
    const downloadBatch = await this.persistence.insert(batch);

    // Create response
    const response = new DownloadBatchResponse(downloadBatch);

    await this.state.withCriticalRegion(async (state) => {
      state.responses.set(downloadBatch.id, response);
    });

    // Start downloading
    await this.startNextDownloads();

    return response;
  }

  /**
   * Cancels a batch download.
   */
  async cancelBatch(batchId: number): Promise<void> {
    const response = await this.state.withCriticalRegion(async (state) => {
      return state.responses.get(batchId);
    });

    if (response) {
      await response.cancel();
      await this.removeBatch(batchId);
    }
  }

  /**
   * Removes a completed or cancelled batch.
   */
  private async removeBatch(batchId: number): Promise<void> {
    await this.state.withCriticalRegion(async (state) => {
      state.responses.delete(batchId);
    });

    await this.persistence.delete([batchId]);
  }

  /**
   * Starts the next available downloads.
   */
  private async startNextDownloads(): Promise<void> {
    await this.state.withCriticalRegion(async (state) => {
      // Count running tasks
      let runningCount = 0;
      for (const response of state.responses.values()) {
        runningCount += response.getRunningTaskCount();
      }

      // Start new downloads if we have capacity
      for (const response of state.responses.values()) {
        while (runningCount < this.maxSimultaneousDownloads) {
          const request = response.getNextUnstartedRequest();
          if (!request) break;

          this.startDownload(response, request);
          runningCount++;
        }
      }
    });
  }

  /**
   * Starts a single download.
   */
  private startDownload(
    response: DownloadBatchResponse,
    request: DownloadRequest
  ): void {
    const taskId = `${response.batchId}-${Date.now()}-${Math.random()}`;
    const destinationUri = request.destination.url;

    const callback = (data: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
      response.updateProgress(
        request,
        data.totalBytesWritten,
        data.totalBytesExpectedToWrite
      );
    };

    const downloadResumable = LegacyFS.createDownloadResumable(
      request.url,
      destinationUri,
      {},
      callback
    );

    response.setTask(request, taskId, downloadResumable);

    // Start the download
    downloadResumable
      .downloadAsync()
      .then(async (result) => {
        if (result) {
          logger.debug(`Download complete: ${request.url}`, 'DownloadManager');
          response.completeRequest(request);

          // Update persistence
          await this.persistence.update([response.getDownload(request)]);

          // Check if batch is complete
          if (response.isComplete) {
            await this.removeBatch(response.batchId);
          }
        } else {
          // Download was cancelled/paused
          response.completeRequest(request, new Error('Download cancelled'));
        }

        // Start next downloads
        await this.startNextDownloads();
      })
      .catch(async (error) => {
        logger.error(`Download failed: ${request.url} - ${error}`, 'DownloadManager');

        const wrappedError = this.wrapError(error);
        response.completeRequest(request, wrappedError);

        // Remove failed batch
        await this.removeBatch(response.batchId);

        // Start next downloads
        await this.startNextDownloads();
      });
  }

  /**
   * Wraps errors in appropriate error types.
   */
  private wrapError(error: unknown): Error {
    if (error instanceof FileSystemError || error instanceof NetworkError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for file system errors
      const message = error.message.toLowerCase();
      if (
        message.includes('disk') ||
        message.includes('space') ||
        message.includes('quota')
      ) {
        return FileSystemError.fromError(error);
      }

      // Check for network errors
      if (
        message.includes('network') ||
        message.includes('internet') ||
        message.includes('connection')
      ) {
        return NetworkError.fromError(error);
      }

      return error;
    }

    return new Error(String(error));
  }
}

// ============================================================================
// Factory
// ============================================================================

let sharedDownloadManager: DownloadManager | null = null;

/**
 * Gets or creates the shared download manager.
 */
export function getDownloadManager(): DownloadManager {
  if (!sharedDownloadManager) {
    sharedDownloadManager = new DownloadManager();
  }
  return sharedDownloadManager;
}

/**
 * Sets the shared download manager.
 */
export function setDownloadManager(manager: DownloadManager): void {
  sharedDownloadManager = manager;
}

