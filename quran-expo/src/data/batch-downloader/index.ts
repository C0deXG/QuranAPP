/**
 * BatchDownloader - Download management
 *
 * Translated from quran-ios/Data/BatchDownloader
 *
 * This module provides:
 * - Batch download management with progress tracking
 * - Download persistence for resume support
 * - Error handling for file system and network errors
 */

// File system errors
export {
  FileSystemError,
  FileSystemErrorType,
  isFileSystemError,
  isDiskSpaceError,
} from './file-system-error';

// Download progress
export type { DownloadProgress } from './download-progress';
export {
  createDownloadProgress,
  getProgressFraction,
  getProgressPercentage,
  isDownloadComplete,
  createCompletedProgress,
  createInitialProgress,
  combineProgress,
  formatProgress,
  formatBytes,
  formatProgressWithBytes,
} from './download-progress';

// Download request
export type { DownloadRequest, DownloadBatchRequest } from './download-request';
export {
  createDownloadRequest,
  getResumePath,
  downloadRequestsEqual,
  downloadRequestKey,
  createDownloadBatchRequest,
  createSingleDownloadBatchRequest,
  downloadBatchRequestsEqual,
} from './download-request';

// Download
export type { Download, DownloadBatch } from './download';
export {
  DownloadStatus,
  createDownload,
  updateDownloadStatus,
  updateDownloadTaskId,
  isDownloadInProgress,
  isDownloadCompleted,
  createDownloadBatch,
  isBatchCompleted,
  isBatchInProgress,
  getCompletedCount,
  getBatchProgress,
} from './download';

// Downloads persistence
export type { DownloadsPersistence } from './downloads-persistence';
export {
  SQLiteDownloadsPersistence,
  InMemoryDownloadsPersistence,
} from './downloads-persistence';

// Download manager
export type {
  DownloadProgressListener,
  DownloadCompleteListener,
} from './download-manager';
export {
  DownloadBatchResponse,
  DownloadManager,
  getDownloadManager,
  setDownloadManager,
} from './download-manager';

