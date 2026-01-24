/**
 * AudioDownloadedSize.swift → audio-downloaded-size.ts
 *
 * Tracks downloaded audio size for a reciter.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran } from '../quran-kit/types';

/**
 * Represents the download status of audio files.
 */
export interface AudioDownloadedSize {
  /** Total downloaded size in bytes */
  readonly downloadedSizeInBytes: number;
  /** Number of downloaded suras */
  readonly downloadedSuraCount: number;
  /** Total number of suras */
  readonly surasCount: number;
}

/**
 * Creates an AudioDownloadedSize.
 */
export function createAudioDownloadedSize(params: {
  downloadedSizeInBytes: number;
  downloadedSuraCount: number;
  surasCount: number;
}): AudioDownloadedSize {
  return {
    downloadedSizeInBytes: params.downloadedSizeInBytes,
    downloadedSuraCount: params.downloadedSuraCount,
    surasCount: params.surasCount,
  };
}

/**
 * Creates a zero AudioDownloadedSize for a Quran.
 */
export function zeroAudioDownloadedSize(quran: IQuran): AudioDownloadedSize {
  return {
    downloadedSizeInBytes: 0,
    downloadedSuraCount: 0,
    surasCount: quran.suras.length,
  };
}

/**
 * Checks if all audio is downloaded.
 */
export function isAudioFullyDownloaded(size: AudioDownloadedSize): boolean {
  return size.downloadedSuraCount === size.surasCount;
}

/**
 * Gets the download progress as a percentage (0-100).
 */
export function audioDownloadProgress(size: AudioDownloadedSize): number {
  if (size.surasCount === 0) return 100;
  return (size.downloadedSuraCount / size.surasCount) * 100;
}

/**
 * Formats the downloaded size for display.
 */
export function formatDownloadedSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }
  if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Checks if two AudioDownloadedSizes are equal.
 */
export function audioDownloadedSizesEqual(
  a: AudioDownloadedSize,
  b: AudioDownloadedSize
): boolean {
  return (
    a.downloadedSizeInBytes === b.downloadedSizeInBytes &&
    a.downloadedSuraCount === b.downloadedSuraCount &&
    a.surasCount === b.surasCount
  );
}

/**
 * Gets a hash code for an AudioDownloadedSize.
 */
export function audioDownloadedSizeHashCode(size: AudioDownloadedSize): number {
  return (
    size.downloadedSizeInBytes * 31 +
    size.downloadedSuraCount * 17 +
    size.surasCount
  );
}

