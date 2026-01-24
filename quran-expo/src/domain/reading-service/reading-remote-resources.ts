/**
 * ReadingRemoteResources.swift → reading-remote-resources.ts
 *
 * Remote resource definitions for different reading styles.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import { Reading } from '../../model/quran-kit';

// ============================================================================
// Constants
// ============================================================================

const READINGS_PATH = 'readings';

// ============================================================================
// Types
// ============================================================================

/**
 * Remote resource for downloading a reading.
 */
export interface RemoteResource {
  /** URL to download from */
  url: string;
  /** Version of the resource */
  version: number;
  /** Local destination path */
  downloadDestination: string;
  /** Path to the zip file */
  zipFile: string;
  /** Path to the success marker file */
  successFilePath: string;
}

/**
 * Creates a remote resource.
 */
export function createRemoteResource(
  url: string,
  reading: Reading,
  version: number
): RemoteResource {
  const downloadDestination = `${LegacyFS.documentDirectory}${READINGS_PATH}/${getLocalPath(reading)}/`;
  const lastPathComponent = url.substring(url.lastIndexOf('/') + 1);

  return {
    url,
    version,
    downloadDestination,
    zipFile: `${downloadDestination}${lastPathComponent}`,
    successFilePath: `${downloadDestination}success-v${version}.txt`,
  };
}

// ============================================================================
// ReadingRemoteResources Interface
// ============================================================================

/**
 * Interface for getting remote resources.
 */
export interface ReadingRemoteResources {
  resource(reading: Reading): RemoteResource | null;
}

// ============================================================================
// Reading Path Extensions
// ============================================================================

/**
 * Gets the local path name for a reading.
 */
export function getLocalPath(reading: Reading): string {
  switch (reading) {
    case Reading.hafs_1405:
      return 'hafs_1405';
    case Reading.hafs_1440:
      return 'hafs_1440';
    case Reading.hafs_1421:
      return 'hafs_1421';
    case Reading.tajweed:
      return 'tajweed';
    default:
      return 'hafs_1405';
  }
}

/**
 * Checks if a path is a reading download destination.
 */
export function isDownloadDestinationPath(path: string): boolean {
  const readingsDir = `${LegacyFS.documentDirectory}${READINGS_PATH}/`;
  return path.startsWith(readingsDir);
}

/**
 * Gets the readings directory path.
 */
export function getReadingsPath(): string {
  return `${LegacyFS.documentDirectory}${READINGS_PATH}/`;
}

// ============================================================================
// RemoteResource Utilities
// ============================================================================

/**
 * Checks if a batch matches this resource.
 */
export function resourceMatchesBatch(
  resource: RemoteResource,
  batchRequests: readonly { destination: string | { path: string } }[]
): boolean {
  if (batchRequests.length !== 1) return false;
  const request = batchRequests[0];
  const dest = typeof request.destination === 'string' 
    ? request.destination 
    : request.destination.path;
  return dest === resource.downloadDestination;
}

/**
 * Checks if a request matches this resource.
 */
export function resourceMatchesRequest(
  resource: RemoteResource,
  request: { destination: string }
): boolean {
  return request.destination === resource.downloadDestination;
}

