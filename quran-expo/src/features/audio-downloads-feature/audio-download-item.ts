/**
 * AudioDownloadItem.swift → audio-download-item.ts
 *
 * Audio download item model.
 *
 * Quran.com. All rights reserved.
 */

import { lFormat } from '../../core/localization';
import type { AudioDownloadedSize, Reciter } from '../../model/quran-audio';

// ============================================================================
// DownloadingProgress
// ============================================================================

/**
 * Represents the downloading progress state.
 *
 * 1:1 translation of iOS AudioDownloadItem.DownloadingProgress.
 */
export type DownloadingProgress =
  | { type: 'notDownloading' }
  | { type: 'downloading'; progress: number };

// ============================================================================
// AudioDownloadItem
// ============================================================================

/**
 * Represents an audio download item for a reciter.
 *
 * 1:1 translation of iOS AudioDownloadItem.
 */
export interface AudioDownloadItem {
  reciter: Reciter;
  size: AudioDownloadedSize | null;
  progress: DownloadingProgress;
}

/**
 * Create an AudioDownloadItem.
 */
export function createAudioDownloadItem(
  reciter: Reciter,
  size: AudioDownloadedSize | null,
  progress: DownloadingProgress
): AudioDownloadItem {
  return { reciter, size, progress };
}

/**
 * Get the ID for an AudioDownloadItem.
 */
export function getAudioDownloadItemId(item: AudioDownloadItem): number {
  return item.reciter.id;
}

/**
 * Check if the audio is fully downloaded.
 */
export function isDownloaded(item: AudioDownloadItem): boolean {
  if (!item.size) return false;
  return item.size.downloadedSuraCount === item.size.surasCount;
}

/**
 * Check if the audio can be deleted.
 */
export function canDelete(item: AudioDownloadItem): boolean {
  if (!item.size) return false;
  return item.size.downloadedSizeInBytes !== 0;
}

/**
 * Compare two AudioDownloadItems for sorting.
 * Items with more downloaded size come first, then alphabetically.
 */
export function compareAudioDownloadItems(
  lhs: AudioDownloadItem,
  rhs: AudioDownloadItem
): number {
  if (!lhs.size || !rhs.size) {
    return lhs.reciter.localizedName.localeCompare(rhs.reciter.localizedName);
  }

  if (lhs.size.downloadedSizeInBytes !== rhs.size.downloadedSizeInBytes) {
    // Larger downloaded size first
    return rhs.size.downloadedSizeInBytes - lhs.size.downloadedSizeInBytes;
  }

  return lhs.reciter.localizedName.localeCompare(rhs.reciter.localizedName);
}

/**
 * Sort AudioDownloadItems.
 */
export function sortAudioDownloadItems(
  items: AudioDownloadItem[]
): AudioDownloadItem[] {
  return [...items].sort(compareAudioDownloadItems);
}

// ============================================================================
// Size Formatting
// ============================================================================

/**
 * Format file size to human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(2)} ${units[i]}`;
}

/**
 * Format AudioDownloadedSize to a human-readable string.
 */
export function formatDownloadedSize(size: AudioDownloadedSize | null): string {
  if (!size) {
    return ' ';
  }

  const suraCount = size.downloadedSuraCount;
  const filesDownloaded = lFormat('audio_manager_files_downloaded', suraCount);

  if (suraCount === 0) {
    return filesDownloaded;
  } else {
    const formattedSize = formatBytes(size.downloadedSizeInBytes);
    return `${formattedSize} - ${filesDownloaded}`;
  }
}

