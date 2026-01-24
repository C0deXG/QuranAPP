/**
 * Zipper.swift → zipper.ts
 *
 * Zip file handling translated from quran-ios Core/SystemDependencies
 *
 * Uses jszip for zip operations and expo-file-system/legacy for file access.
 *
 * Quran.com. All rights reserved.
 */

import * as LegacyFS from 'expo-file-system/legacy';
import JSZip from 'jszip';

/**
 * Interface for zip file operations.
 */
export interface Zipper {
  unzipFile(
    zipFileUri: string,
    destinationUri: string,
    overwrite: boolean,
    password?: string
  ): Promise<void>;

  /** Alias for unzipFile */
  unzip(
    zipFileUri: string,
    destinationUri: string,
    overwrite?: boolean
  ): Promise<void>;

  zipDirectory(sourceUri: string, destinationUri: string): Promise<void>;

  listContents(zipFileUri: string): Promise<string[]>;
}

/**
 * Default implementation using jszip.
 */
export class DefaultZipper implements Zipper {
  async unzip(
    zipFileUri: string,
    destinationUri: string,
    overwrite: boolean = true
  ): Promise<void> {
    return this.unzipFile(zipFileUri, destinationUri, overwrite);
  }

  async unzipFile(
    zipFileUri: string,
    destinationUri: string,
    overwrite: boolean,
    password?: string
  ): Promise<void> {
    if (password) {
      throw new Error('Password-protected zip files are not supported');
    }

    const zipContent = await LegacyFS.readAsStringAsync(zipFileUri, {
      encoding: LegacyFS.EncodingType.Base64,
    });

    const zip = await JSZip.loadAsync(zipContent, { base64: true });

    await LegacyFS.makeDirectoryAsync(destinationUri, { intermediates: true });

    const entries = Object.entries(zip.files);

    for (const [relativePath, zipEntry] of entries) {
      const fullPath = `${destinationUri}/${relativePath}`;
      const entry = zipEntry as JSZip.JSZipObject;

      if (entry.dir) {
        await LegacyFS.makeDirectoryAsync(fullPath, { intermediates: true });
      } else {
        if (!overwrite) {
          const info = await LegacyFS.getInfoAsync(fullPath);
          if (info.exists) continue;
        }

        const parentDir = fullPath.substring(0, fullPath.lastIndexOf('/'));
        await LegacyFS.makeDirectoryAsync(parentDir, { intermediates: true });

        const content = await entry.async('base64');
        await LegacyFS.writeAsStringAsync(fullPath, content, {
          encoding: LegacyFS.EncodingType.Base64,
        });
      }
    }
  }

  async zipDirectory(sourceUri: string, destinationUri: string): Promise<void> {
    const zip = new JSZip();
    await this.addDirectoryToZip(zip, sourceUri, '');
    const zipContent = await zip.generateAsync({ type: 'base64' });
    await LegacyFS.writeAsStringAsync(destinationUri, zipContent, {
      encoding: LegacyFS.EncodingType.Base64,
    });
  }

  async listContents(zipFileUri: string): Promise<string[]> {
    const zipContent = await LegacyFS.readAsStringAsync(zipFileUri, {
      encoding: LegacyFS.EncodingType.Base64,
    });
    const zip = await JSZip.loadAsync(zipContent, { base64: true });
    return Object.keys(zip.files);
  }

  private async addDirectoryToZip(zip: JSZip, dirUri: string, relativePath: string): Promise<void> {
    const contents = await LegacyFS.readDirectoryAsync(dirUri);

    for (const item of contents) {
      const itemUri = `${dirUri}/${item}`;
      const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
      const info = await LegacyFS.getInfoAsync(itemUri);

      if (info.isDirectory) {
        await this.addDirectoryToZip(zip, itemUri, itemRelativePath);
      } else {
        const content = await LegacyFS.readAsStringAsync(itemUri, {
          encoding: LegacyFS.EncodingType.Base64,
        });
        zip.file(itemRelativePath, content, { base64: true });
      }
    }
  }
}

/**
 * Mock zipper for testing.
 */
export class MockZipper implements Zipper {
  private extractedFiles: Map<string, Map<string, string>> = new Map();
  private zipContents: Map<string, string[]> = new Map();

  async unzip(
    zipFileUri: string,
    destinationUri: string,
    overwrite: boolean = true
  ): Promise<void> {
    return this.unzipFile(zipFileUri, destinationUri, overwrite);
  }

  async unzipFile(
    zipFileUri: string,
    destinationUri: string,
    _overwrite: boolean,
    _password?: string
  ): Promise<void> {
    this.extractedFiles.set(zipFileUri, new Map([['destination', destinationUri]]));
  }

  async zipDirectory(sourceUri: string, destinationUri: string): Promise<void> {
    this.zipContents.set(destinationUri, [sourceUri]);
  }

  async listContents(zipFileUri: string): Promise<string[]> {
    return this.zipContents.get(zipFileUri) ?? [];
  }

  setZipContents(zipUri: string, contents: string[]): void {
    this.zipContents.set(zipUri, contents);
  }

  getExtractedDestination(zipUri: string): string | undefined {
    return this.extractedFiles.get(zipUri)?.get('destination');
  }

  clear(): void {
    this.extractedFiles.clear();
    this.zipContents.clear();
  }
}

export const zipper: Zipper = new DefaultZipper();
