/**
 * FileSystem.swift → file-system.ts
 *
 * File system abstraction translated from quran-ios Core/SystemDependencies
 *
 * Uses expo-file-system/legacy for file operations.
 *
 * Quran.com. All rights reserved.
 */

import * as LegacyFS from 'expo-file-system/legacy';
import { RelativeFilePath } from '../utilities/relative-file-path';

/**
 * Resource values for a file.
 * Equivalent to Swift's ResourceValues protocol.
 */
export interface ResourceValues {
  fileSize?: number;
  isDirectory?: boolean;
  modificationDate?: Date;
}

/**
 * Interface for file system operations.
 * Equivalent to Swift's FileSystem protocol.
 */
export interface FileSystem {
  /**
   * Checks if a file exists at the given URI.
   */
  fileExists(uri: string): Promise<boolean>;

  /**
   * Creates a directory at the given URI.
   */
  createDirectory(uri: string, withIntermediateDirectories: boolean): Promise<void>;

  /**
   * Copies a file from source to destination.
   */
  copyItem(srcUri: string, dstUri: string): Promise<void>;

  /**
   * Removes a file or directory.
   */
  removeItem(uri: string): Promise<void>;

  /**
   * Moves a file from source to destination.
   */
  moveItem(srcUri: string, dstUri: string): Promise<void>;

  /**
   * Lists contents of a directory.
   */
  contentsOfDirectory(uri: string): Promise<string[]>;

  /**
   * Gets resource values for a file.
   */
  resourceValues(uri: string): Promise<ResourceValues>;

  /**
   * Writes string content to a file.
   */
  writeToFile(uri: string, content: string): Promise<void>;

  /**
   * Reads string content from a file.
   */
  readFromFile(uri: string): Promise<string>;
}

/**
 * Default implementation using expo-file-system/legacy.
 */
export class DefaultFileSystem implements FileSystem {
  async fileExists(uri: string): Promise<boolean> {
    try {
      const info = await LegacyFS.getInfoAsync(uri);
      return info.exists;
    } catch {
      return false;
    }
  }

  async createDirectory(uri: string, withIntermediateDirectories: boolean): Promise<void> {
    await LegacyFS.makeDirectoryAsync(uri, { intermediates: withIntermediateDirectories });
  }

  async copyItem(srcUri: string, dstUri: string): Promise<void> {
    await LegacyFS.copyAsync({ from: srcUri, to: dstUri });
  }

  async removeItem(uri: string): Promise<void> {
    await LegacyFS.deleteAsync(uri, { idempotent: true });
  }

  async moveItem(srcUri: string, dstUri: string): Promise<void> {
    await LegacyFS.moveAsync({ from: srcUri, to: dstUri });
  }

  async contentsOfDirectory(uri: string): Promise<string[]> {
    const contents = await LegacyFS.readDirectoryAsync(uri);
    return contents.map(name => `${uri}${uri.endsWith('/') ? '' : '/'}${name}`);
  }

  async resourceValues(uri: string): Promise<ResourceValues> {
    const info = await LegacyFS.getInfoAsync(uri);

    if (!info.exists) {
      throw new Error(`File not found: ${uri}`);
    }

    return {
      fileSize: (info as any).size,
      isDirectory: info.isDirectory,
      modificationDate: (info as any).modificationTime 
        ? new Date((info as any).modificationTime * 1000) 
        : undefined,
    };
  }

  async writeToFile(uri: string, content: string): Promise<void> {
    await LegacyFS.writeAsStringAsync(uri, content, { encoding: LegacyFS.EncodingType.UTF8 });
  }

  async readFromFile(uri: string): Promise<string> {
    return LegacyFS.readAsStringAsync(uri, { encoding: LegacyFS.EncodingType.UTF8 });
  }
}

/**
 * Mock file system for testing.
 */
export class MockFileSystem implements FileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  async fileExists(uri: string): Promise<boolean> {
    return this.files.has(uri) || this.directories.has(uri);
  }

  async createDirectory(uri: string, _withIntermediateDirectories: boolean): Promise<void> {
    this.directories.add(uri);
  }

  async copyItem(srcUri: string, dstUri: string): Promise<void> {
    const content = this.files.get(srcUri);
    if (content !== undefined) {
      this.files.set(dstUri, content);
    }
  }

  async removeItem(uri: string): Promise<void> {
    this.files.delete(uri);
    this.directories.delete(uri);
  }

  async moveItem(srcUri: string, dstUri: string): Promise<void> {
    const content = this.files.get(srcUri);
    if (content !== undefined) {
      this.files.set(dstUri, content);
      this.files.delete(srcUri);
    }
  }

  async contentsOfDirectory(uri: string): Promise<string[]> {
    const result: string[] = [];
    const prefix = uri.endsWith('/') ? uri : `${uri}/`;

    for (const path of this.files.keys()) {
      if (path.startsWith(prefix)) {
        const remaining = path.slice(prefix.length);
        const firstSlash = remaining.indexOf('/');
        if (firstSlash === -1) {
          result.push(path);
        } else {
          const dir = `${prefix}${remaining.slice(0, firstSlash)}`;
          if (!result.includes(dir)) {
            result.push(dir);
          }
        }
      }
    }
    return result;
  }

  async resourceValues(uri: string): Promise<ResourceValues> {
    const content = this.files.get(uri);
    if (content !== undefined) {
      return {
        fileSize: content.length,
        isDirectory: false,
        modificationDate: new Date(),
      };
    }
    if (this.directories.has(uri)) {
      return {
        isDirectory: true,
        modificationDate: new Date(),
      };
    }
    throw new Error(`File not found: ${uri}`);
  }

  async writeToFile(uri: string, content: string): Promise<void> {
    this.files.set(uri, content);
  }

  async readFromFile(uri: string): Promise<string> {
    const content = this.files.get(uri);
    if (content === undefined) {
      throw new Error(`File not found: ${uri}`);
    }
    return content;
  }

  // Test helpers
  setFile(uri: string, content: string): void {
    this.files.set(uri, content);
  }

  clear(): void {
    this.files.clear();
    this.directories.clear();
  }
}

// Export types
export { RelativeFilePath };
