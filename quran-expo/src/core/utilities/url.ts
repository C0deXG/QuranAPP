/**
 * URL+Extension.swift → url.ts
 *
 * URL utility functions translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 5/7/16.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';

/**
 * Creates a URL from a string, throwing if invalid.
 * Equivalent to Swift's URL(validURL:) force-unwrapped initializer.
 *
 * @param urlString - The URL string to parse
 * @returns The parsed URL
 * @throws Error if the URL string is invalid
 */
export function validURL(urlString: string): string {
  try {
    // Validate the URL by attempting to parse it
    new URL(urlString);
    return urlString;
  } catch {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

/**
 * Checks if a file or directory exists at the given path.
 * Equivalent to Swift's URL.isReachable property.
 *
 * @param path - The file system path to check
 * @returns Promise that resolves to true if the resource exists
 */
export async function isReachable(path: string): Promise<boolean> {
  try {
    const info = await LegacyFS.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Synchronous version of isReachable for cases where async isn't possible.
 * Note: This should be used sparingly as it may not be accurate for all file types.
 *
 * @param path - The file system path to check
 * @returns true if the path looks valid (basic validation only)
 */
export function isReachableSync(path: string): boolean {
  // In React Native, we can't do synchronous file system checks.
  // This is a basic validation that the path is non-empty and well-formed.
  return path.length > 0 && (path.startsWith('/') || path.startsWith('file://'));
}

/**
 * Checks if a path is a parent directory of another path.
 *
 * @param parent - The potential parent path
 * @param child - The potential child path
 * @returns true if parent is an ancestor of child
 *
 * @example
 * isParent('/path/to', '/path/to/file.txt') // true
 * isParent('/path/to', '/other/path') // false
 */
export function isParent(parent: string, child: string): boolean {
  // Normalize paths to ensure consistent comparison
  const normalizedParent = parent.endsWith('/') ? parent : parent + '/';
  return child.startsWith(normalizedParent) || child === parent;
}

/**
 * Joins URL/path components together.
 *
 * @param base - The base URL or path
 * @param components - Additional path components to append
 * @returns The joined path
 */
export function joinPath(base: string, ...components: string[]): string {
  let result = base;

  for (const component of components) {
    if (!component) continue;

    const baseEndsWithSlash = result.endsWith('/');
    const componentStartsWithSlash = component.startsWith('/');

    if (baseEndsWithSlash && componentStartsWithSlash) {
      result = result + component.slice(1);
    } else if (!baseEndsWithSlash && !componentStartsWithSlash) {
      result = result + '/' + component;
    } else {
      result = result + component;
    }
  }

  return result;
}

/**
 * Extracts the filename from a URL or path.
 *
 * @param url - The URL or path
 * @returns The filename portion
 */
export function filename(url: string): string {
  // Handle both URLs and file paths
  const path = url.includes('://') ? new URL(url).pathname : url;
  const components = path.split('/').filter(Boolean);
  return components[components.length - 1] ?? '';
}

/**
 * Extracts the directory path from a URL or path.
 *
 * @param url - The URL or path
 * @returns The directory portion
 */
export function directory(url: string): string {
  const file = filename(url);
  if (!file) return url;

  const lastIndex = url.lastIndexOf(file);
  return url.slice(0, lastIndex).replace(/\/$/, '');
}

