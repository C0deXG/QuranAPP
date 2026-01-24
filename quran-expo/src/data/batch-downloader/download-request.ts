/**
 * DownloadRequest.swift → download-request.ts
 *
 * Download request and batch request types.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { RelativeFilePath } from '../../core/utilities/relative-file-path';

/** Extension for resume data files */
const DOWNLOAD_RESUME_DATA_EXTENSION = 'resume';

/**
 * Represents a single download request.
 */
export interface DownloadRequest {
  /** URL to download from */
  readonly url: string;
  /** Destination path relative to documents directory */
  readonly destination: RelativeFilePath;
}

/**
 * Creates a new DownloadRequest.
 */
export function createDownloadRequest(
  url: string,
  destination: RelativeFilePath
): DownloadRequest {
  return { url, destination };
}

/**
 * Gets the resume data path for a download request.
 */
export function getResumePath(request: DownloadRequest): RelativeFilePath {
  return request.destination.appendingPathExtension(DOWNLOAD_RESUME_DATA_EXTENSION);
}

/**
 * Checks if two download requests are equal.
 */
export function downloadRequestsEqual(
  a: DownloadRequest,
  b: DownloadRequest
): boolean {
  return (
    a.url === b.url &&
    a.destination.path === b.destination.path
  );
}

/**
 * Gets a unique key for a download request.
 */
export function downloadRequestKey(request: DownloadRequest): string {
  return `${request.url}|${request.destination.path}`;
}

/**
 * Represents a batch of download requests.
 */
export interface DownloadBatchRequest {
  /** List of download requests in this batch */
  readonly requests: readonly DownloadRequest[];
}

/**
 * Creates a new DownloadBatchRequest.
 */
export function createDownloadBatchRequest(
  requests: DownloadRequest[]
): DownloadBatchRequest {
  return { requests };
}

/**
 * Creates a single-item batch request.
 */
export function createSingleDownloadBatchRequest(
  url: string,
  destination: RelativeFilePath
): DownloadBatchRequest {
  return {
    requests: [createDownloadRequest(url, destination)],
  };
}

/**
 * Checks if two batch requests are equal.
 */
export function downloadBatchRequestsEqual(
  a: DownloadBatchRequest,
  b: DownloadBatchRequest
): boolean {
  if (a.requests.length !== b.requests.length) {
    return false;
  }

  for (let i = 0; i < a.requests.length; i++) {
    if (!downloadRequestsEqual(a.requests[i], b.requests[i])) {
      return false;
    }
  }

  return true;
}

