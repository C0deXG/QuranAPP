/**
 * String+Extension.swift → string.ts
 *
 * String utility functions translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2/25/17.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Returns the last component of a path string.
 * @example lastPathComponent('/path/to/file.txt') // 'file.txt'
 */
export function lastPathComponent(path: string): string {
  const components = path.split('/').filter(Boolean);
  return components[components.length - 1] ?? '';
}

/**
 * Returns the path extension of a file path.
 * @example pathExtension('/path/to/file.txt') // 'txt'
 */
export function pathExtension(path: string): string {
  const filename = lastPathComponent(path);
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.slice(dotIndex + 1) : '';
}

/**
 * Returns the path with the last component removed.
 * @example stringByDeletingLastPathComponent('/path/to/file.txt') // '/path/to'
 */
export function stringByDeletingLastPathComponent(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return '';
  if (lastSlash === 0) return '/';
  return path.slice(0, lastSlash);
}

/**
 * Returns the path with the extension removed.
 * @example stringByDeletingPathExtension('/path/to/file.txt') // '/path/to/file'
 */
export function stringByDeletingPathExtension(path: string): string {
  const ext = pathExtension(path);
  if (!ext) return path;
  return path.slice(0, -(ext.length + 1));
}

/**
 * Returns an array of path components.
 * @example pathComponents('/path/to/file.txt') // ['/', 'path', 'to', 'file.txt']
 */
export function pathComponents(path: string): string[] {
  if (!path) return [];
  const components = path.split('/').filter(Boolean);
  if (path.startsWith('/')) {
    return ['/', ...components];
  }
  return components;
}

/**
 * Appends a path component to a path.
 * @example stringByAppendingPath('/path/to', 'file.txt') // '/path/to/file.txt'
 */
export function stringByAppendingPath(basePath: string, component: string): string {
  const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const comp = component.startsWith('/') ? component.slice(1) : component;
  return `${base}/${comp}`;
}

/**
 * Appends a file extension to a path.
 * @example stringByAppendingExtension('/path/to/file', 'txt') // '/path/to/file.txt'
 */
export function stringByAppendingExtension(path: string, extension: string): string {
  return `${path}.${extension}`;
}

// ============================================================================
// Regex Utilities
// ============================================================================

/**
 * Range interface representing a substring position
 */
export interface StringRange {
  start: number;
  end: number;
}

/**
 * Finds all ranges where a regex matches in the string.
 * @param str - The string to search
 * @param regex - The regular expression to match
 * @returns Array of ranges where matches occur
 */
export function ranges(str: string, regex: RegExp): StringRange[] {
  const results: StringRange[] = [];
  const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');

  let match: RegExpExecArray | null;
  while ((match = globalRegex.exec(str)) !== null) {
    results.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return results;
}

/**
 * Replaces occurrences matching a pattern using a replacement provider function.
 * @param str - The string to process
 * @param pattern - The regex pattern to match
 * @param replacementProvider - Function that receives matched string and returns replacement (or null to skip)
 * @returns The string with replacements applied
 */
export function replacingOccurrences(
  str: string,
  pattern: string | RegExp,
  replacementProvider: (match: string) => string | null
): string {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : new RegExp(pattern.source, 'g');

  return str.replace(regex, (match) => {
    const replacement = replacementProvider(match);
    return replacement !== null ? replacement : match;
  });
}

/**
 * Replaces matches of a regex and returns both the new string and the ranges of replacements.
 * @param str - The string to process
 * @param regex - The regular expression to match
 * @param replace - Function that receives the matched substring and its index, returns replacement
 * @returns Tuple of [new string, array of ranges where replacements occurred]
 */
export function replaceMatches(
  str: string,
  regex: RegExp,
  replace: (match: string, index: number) => string
): [string, StringRange[]] {
  const matchRanges = ranges(str, regex);
  return replacingSortedRanges(str, matchRanges, replace);
}

/**
 * Replaces content at sorted ranges and returns the new string with updated ranges.
 * @param str - The original string
 * @param sortedRanges - Array of ranges to replace, must be sorted by start position
 * @param body - Function to generate replacement for each range
 * @returns Tuple of [new string, array of ranges where replacements now exist]
 */
export function replacingSortedRanges(
  str: string,
  sortedRanges: StringRange[],
  body: (match: string, index: number) => string
): [string, StringRange[]] {
  let newText = str;
  const offsets: Array<{ start: number; length: number; offset: number }> = [];
  let replacementIndex = sortedRanges.length - 1;

  // Process ranges in reverse order to maintain correct positions
  for (const range of [...sortedRanges].reverse()) {
    const match = str.slice(range.start, range.end);
    const replacement = body(match, replacementIndex);

    newText = newText.slice(0, range.start) + replacement + newText.slice(range.end);

    offsets.push({
      start: range.start,
      length: replacement.length,
      offset: match.length - replacement.length,
    });

    replacementIndex -= 1;
  }

  // Calculate the new ranges in the modified string
  let accumulatedOffset = 0;
  const newRanges: StringRange[] = offsets.reverse().map((data) => {
    const start = data.start - accumulatedOffset;
    const end = start + data.length;
    accumulatedOffset += data.offset;
    return { start, end };
  });

  return [newText, newRanges];
}

// ============================================================================
// Byte Offset Utilities
// ============================================================================

/**
 * Converts a byte offset to a string character index.
 * Useful when working with UTF-8 encoded strings where byte positions
 * don't correspond directly to character positions.
 *
 * @param str - The string to work with
 * @param byteOffset - The byte offset in UTF-8 encoding
 * @returns The character index, or undefined if invalid
 */
export function byteOffsetToStringIndex(str: string, byteOffset: number): number | undefined {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  if (byteOffset < 0 || byteOffset > bytes.length) {
    return undefined;
  }

  // Decode bytes up to the offset to get the character count
  const decoder = new TextDecoder();
  const partialBytes = bytes.slice(0, byteOffset);

  try {
    const decodedString = decoder.decode(partialBytes);
    return decodedString.length;
  } catch {
    return undefined;
  }
}

