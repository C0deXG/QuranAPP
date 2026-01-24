/**
 * FileManager+Extension.swift → file-manager.ts
 *
 * File system utility functions translated from quran-ios Core/Utilities
 * 
 * Quran.com. All rights reserved.
 */

import { Paths, File, Directory } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';

/**
 * Standard directories available in Expo
 */
export const Directories = {
  /**
   * Documents directory - persistent storage, backed up
   */
  get documents(): string {
    return Paths.document.uri;
  },

  /**
   * Cache directory - temporary storage, may be cleared by OS
   */
  get cache(): string {
    return Paths.cache.uri;
  },

  /**
   * Bundle directory - read-only app assets
   */
  get bundle(): string {
    return Paths.bundle.uri;
  },
} as const;

/**
 * Removes all contents of a directory without removing the directory itself.
 */
export async function removeDirectoryContents(directoryPath: string): Promise<void> {
  try {
    const files = await LegacyFS.readDirectoryAsync(directoryPath);
    for (const file of files) {
      await LegacyFS.deleteAsync(`${directoryPath}/${file}`, { idempotent: true });
    }
  } catch {
    // Directory may not exist
  }
}

/**
 * Moves a file or directory from one location to another.
 */
export async function moveItem(from: string, to: string): Promise<void> {
  await LegacyFS.moveAsync({ from, to });
}

/**
 * Copies a file or directory from one location to another.
 */
export async function copyItem(from: string, to: string): Promise<void> {
  await LegacyFS.copyAsync({ from, to });
}

/**
 * Checks if a file or directory exists at the given path.
 */
export async function exists(path: string): Promise<boolean> {
  try {
    const info = await LegacyFS.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Creates a directory at the given path, including intermediate directories.
 */
export async function createDirectory(path: string): Promise<void> {
  await LegacyFS.makeDirectoryAsync(path, { intermediates: true });
}

/**
 * Removes the file or directory at the given path.
 */
export async function removeItem(path: string): Promise<void> {
  try {
    await LegacyFS.deleteAsync(path, { idempotent: true });
  } catch {
    // Item may not exist
  }
}

/**
 * Alias for removeItem for backward compatibility
 */
export const deleteItem = removeItem;

/**
 * Returns the contents of a directory.
 */
export async function listDirectory(path: string): Promise<string[]> {
  try {
    return await LegacyFS.readDirectoryAsync(path);
  } catch {
    return [];
  }
}

/**
 * Gets information about a file or directory.
 */
export async function getInfo(path: string): Promise<{
  exists: boolean;
  isDirectory: boolean;
  size?: number;
  modificationTime?: number;
}> {
  try {
    const info = await LegacyFS.getInfoAsync(path);
    return {
      exists: info.exists,
      isDirectory: info.isDirectory ?? false,
      size: (info as any).size,
      modificationTime: (info as any).modificationTime,
    };
  } catch {
    return { exists: false, isDirectory: false };
  }
}

/**
 * Reads the contents of a file as a string.
 */
export async function readFile(path: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<string> {
  return LegacyFS.readAsStringAsync(path, {
    encoding: encoding === 'base64' 
      ? LegacyFS.EncodingType.Base64 
      : LegacyFS.EncodingType.UTF8,
  });
}

/**
 * Writes content to a file.
 */
export async function writeFile(
  path: string,
  content: string,
  encoding: 'utf8' | 'base64' = 'utf8'
): Promise<void> {
  await LegacyFS.writeAsStringAsync(path, content, {
    encoding: encoding === 'base64' 
      ? LegacyFS.EncodingType.Base64 
      : LegacyFS.EncodingType.UTF8,
  });
}

/**
 * Downloads a file from a URL to the local filesystem.
 */
export async function downloadFile(
  url: string,
  destination: string,
  options?: {
    onProgress?: (progress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void;
  }
): Promise<{ uri: string; status: number; headers: Record<string, string> }> {
  return LegacyFS.downloadAsync(url, destination, {});
}

/**
 * Creates a resumable download task.
 */
export function createDownloadResumable(
  url: string,
  destination: string,
  options?: {
    headers?: Record<string, string>;
    md5?: boolean;
  },
  callback?: (progress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void
) {
  return LegacyFS.createDownloadResumable(url, destination, options, callback);
}

/**
 * Returns the file size in bytes.
 */
export async function getFileSize(path: string): Promise<number> {
  try {
    const info = await LegacyFS.getInfoAsync(path);
    return (info as any).size ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Returns available disk space in bytes.
 */
export async function getFreeDiskStorage(): Promise<number> {
  return LegacyFS.getFreeDiskStorageAsync();
}

/**
 * Returns total disk capacity in bytes.
 */
export async function getTotalDiskCapacity(): Promise<number> {
  return LegacyFS.getTotalDiskCapacityAsync();
}

/**
 * Gets the total size of a directory recursively.
 */
export async function getDirectorySize(path: string): Promise<number> {
  try {
    const info = await getInfo(path);
    if (!info.exists) return 0;
    if (!info.isDirectory) return info.size ?? 0;

    const files = await listDirectory(path);
    let totalSize = 0;
    for (const file of files) {
      totalSize += await getDirectorySize(`${path}/${file}`);
    }
    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Appends a path component to a base path.
 */
export function appendPath(base: string, component: string): string {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedComponent = component.startsWith('/') ? component.slice(1) : component;
  return `${normalizedBase}/${normalizedComponent}`;
}

/**
 * Gets the file extension from a path.
 */
export function getExtension(path: string): string {
  const filename = path.split('/').pop() || '';
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex) : '';
}

/**
 * Gets the filename from a path.
 */
export function getFilename(path: string): string {
  return path.split('/').pop() || '';
}

/**
 * Gets the parent directory from a path.
 */
export function getParentDirectory(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/');
}

// Re-export legacy API for compatibility
export { LegacyFS };
