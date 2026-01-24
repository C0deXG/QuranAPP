/**
 * RelativeFilePath.swift → relative-file-path.ts
 *
 * Relative file path utility translated from quran-ios Core/Utilities
 *
 * Quran.com. All rights reserved.
 */

import * as LegacyFS from 'expo-file-system/legacy';
import {
  stringByAppendingPath,
  stringByDeletingLastPathComponent,
  stringByDeletingPathExtension,
  lastPathComponent,
} from './string';

/**
 * Gets the base documents directory URL.
 */
function getDocumentsURL(): string {
  return LegacyFS.documentDirectory ?? '';
}

/**
 * Represents a file path relative to the documents directory.
 */
export class RelativeFilePath {
  readonly path: string;
  readonly isDirectory: boolean;

  constructor(path: string, isDirectory: boolean) {
    this.path = path;
    this.isDirectory = isDirectory;
  }

  /**
   * Creates a file path.
   */
  static file(path: string): RelativeFilePath {
    return new RelativeFilePath(path, false);
  }

  /**
   * Creates a directory path.
   */
  static directory(path: string): RelativeFilePath {
    return new RelativeFilePath(path, true);
  }

  /**
   * Creates from an absolute URL.
   */
  static fromURL(url: string, isDirectory: boolean): RelativeFilePath | null {
    const documentsURL = getDocumentsURL();
    if (!url.startsWith(documentsURL)) {
      return null;
    }
    const relativePath = url.slice(documentsURL.length);
    return new RelativeFilePath(relativePath, isDirectory);
  }

  /**
   * Gets the absolute URL.
   */
  get url(): string {
    return stringByAppendingPath(getDocumentsURL(), this.path);
  }

  /**
   * Appends a path component.
   */
  appendingPathComponent(component: string, isDirectory: boolean = false): RelativeFilePath {
    const newPath = stringByAppendingPath(this.path, component);
    return new RelativeFilePath(newPath, isDirectory);
  }

  /**
   * Gets the parent directory.
   */
  get deletingLastPathComponent(): RelativeFilePath {
    const newPath = stringByDeletingLastPathComponent(this.path);
    return new RelativeFilePath(newPath, true);
  }

  /**
   * Gets path without extension.
   */
  get deletingPathExtension(): RelativeFilePath {
    const newPath = stringByDeletingPathExtension(this.path);
    return new RelativeFilePath(newPath, this.isDirectory);
  }

  /**
   * Appends a path extension.
   */
  appendingPathExtension(ext: string): RelativeFilePath {
    const newPath = `${this.path}.${ext}`;
    return new RelativeFilePath(newPath, this.isDirectory);
  }

  /**
   * Checks if the path starts with a prefix.
   */
  startsWith(prefix: string): boolean {
    return this.path.startsWith(prefix);
  }

  /**
   * Splits the path by a separator.
   */
  split(separator: string): string[] {
    return this.path.split(separator);
  }

  /**
   * Converts to string.
   */
  toString(): string {
    return this.path;
  }

  /**
   * Gets the last path component.
   */
  get lastPathComponent(): string {
    return lastPathComponent(this.path);
  }

  /**
   * Checks if the file/directory exists.
   */
  async exists(): Promise<boolean> {
    try {
      const info = await LegacyFS.getInfoAsync(this.url);
      return info.exists;
    } catch {
      return false;
    }
  }

  /**
   * Creates the directory (if this represents a directory).
   */
  async createDirectory(): Promise<void> {
    if (this.isDirectory) {
      await LegacyFS.makeDirectoryAsync(this.url, { intermediates: true });
    }
  }

  /**
   * Deletes the file or directory.
   */
  async delete(): Promise<void> {
    await LegacyFS.deleteAsync(this.url, { idempotent: true });
  }

  /**
   * Copies to another location.
   */
  async copy(to: RelativeFilePath): Promise<void> {
    await LegacyFS.copyAsync({ from: this.url, to: to.url });
  }

  /**
   * Moves to another location.
   */
  async move(to: RelativeFilePath): Promise<void> {
    await LegacyFS.moveAsync({ from: this.url, to: to.url });
  }

  /**
   * Gets file size.
   */
  async fileSize(): Promise<number> {
    try {
      const info = await LegacyFS.getInfoAsync(this.url);
      return (info as any).size ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Lists contents if this is a directory.
   */
  async contentsOfDirectory(): Promise<RelativeFilePath[]> {
    if (!this.isDirectory) return [];
    try {
      const contents = await LegacyFS.readDirectoryAsync(this.url);
      return contents.map(name => this.appendingPathComponent(name, false));
    } catch {
      return [];
    }
  }

  /**
   * Reads file content as string.
   */
  async readString(): Promise<string> {
    return LegacyFS.readAsStringAsync(this.url, {
      encoding: LegacyFS.EncodingType.UTF8,
    });
  }

  /**
   * Writes string content to file.
   */
  async writeString(content: string): Promise<void> {
    await LegacyFS.writeAsStringAsync(this.url, content, {
      encoding: LegacyFS.EncodingType.UTF8,
    });
  }

  /**
   * Reads file as base64.
   */
  async readBase64(): Promise<string> {
    return LegacyFS.readAsStringAsync(this.url, {
      encoding: LegacyFS.EncodingType.Base64,
    });
  }

  /**
   * Writes base64 content to file.
   */
  async writeBase64(content: string): Promise<void> {
    await LegacyFS.writeAsStringAsync(this.url, content, {
      encoding: LegacyFS.EncodingType.Base64,
    });
  }

  /**
   * Equality check.
   */
  equals(other: RelativeFilePath): boolean {
    return this.path === other.path && this.isDirectory === other.isDirectory;
  }
}

/**
 * Helper to create paths for common directories.
 */
export const RelativePaths = {
  databases: RelativeFilePath.directory('databases'),
  audio: RelativeFilePath.directory('audio'),
  images: RelativeFilePath.directory('images'),
  logs: RelativeFilePath.directory('logs'),
  temp: RelativeFilePath.directory('temp'),
};
