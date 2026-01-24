/**
 * DownloadProgress.swift → download-progress.ts
 *
 * Progress tracking for downloads.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Represents the progress of a download operation.
 */
export interface DownloadProgress {
  /** Total bytes or items to download */
  readonly total: number;
  /** Bytes or items completed */
  readonly completed: number;
}

/**
 * Creates a new DownloadProgress.
 */
export function createDownloadProgress(
  total: number,
  completed: number = 0
): DownloadProgress {
  return { total, completed };
}

/**
 * Gets the progress as a fraction (0 to 1).
 */
export function getProgressFraction(progress: DownloadProgress): number {
  if (progress.total <= 0) {
    return 0;
  }
  return Math.min(1, progress.completed / progress.total);
}

/**
 * Gets the progress as a percentage (0 to 100).
 */
export function getProgressPercentage(progress: DownloadProgress): number {
  return getProgressFraction(progress) * 100;
}

/**
 * Checks if the download is complete.
 */
export function isDownloadComplete(progress: DownloadProgress): boolean {
  return progress.completed >= progress.total;
}

/**
 * Creates a completed progress.
 */
export function createCompletedProgress(total: number = 1): DownloadProgress {
  return { total, completed: total };
}

/**
 * Creates an initial (zero) progress.
 */
export function createInitialProgress(total: number = 1): DownloadProgress {
  return { total, completed: 0 };
}

/**
 * Combines multiple progresses into an overall progress.
 */
export function combineProgress(progresses: readonly DownloadProgress[]): DownloadProgress {
  if (progresses.length === 0) {
    return { total: 1, completed: 0 };
  }

  const totalFraction = progresses.reduce(
    (sum, p) => sum + getProgressFraction(p),
    0
  );
  const averageFraction = totalFraction / progresses.length;

  return { total: 1, completed: averageFraction };
}

/**
 * Formats progress as a human-readable string.
 */
export function formatProgress(progress: DownloadProgress): string {
  const percentage = getProgressPercentage(progress).toFixed(1);
  return `${percentage}%`;
}

/**
 * Formats bytes as a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Formats progress with byte sizes.
 */
export function formatProgressWithBytes(progress: DownloadProgress): string {
  return `${formatBytes(progress.completed)} / ${formatBytes(progress.total)}`;
}

