/**
 * TranslationUnzipper.swift → translation-unzipper.ts
 *
 * Unzips translation database files.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Translation } from '../../model/quran-text';
import { attemptAsync } from '../../core/utilities/attempt';
import type { Zipper } from '../../core/system-dependencies';
import { DefaultZipper } from '../../core/system-dependencies';

// ============================================================================
// TranslationUnzipper Interface
// ============================================================================

/**
 * Interface for unzipping translation files.
 */
export interface TranslationUnzipper {
  unzipIfNeeded(translation: Translation): Promise<void>;
}

// ============================================================================
// Default Implementation
// ============================================================================

/**
 * Default implementation of TranslationUnzipper.
 */
export class DefaultTranslationUnzipper implements TranslationUnzipper {
  private readonly zipper: Zipper;

  constructor(zipper?: Zipper) {
    this.zipper = zipper ?? new DefaultZipper();
  }

  /**
   * Unzips the translation if needed.
   *
   * States:
   * - Is Zip, zip exists, db exists
   * - false,  x,          false     // Not Downloaded
   * - false,  x,          true      // need to check version (might be download/upgrade)
   * - true,   false,      false     // Not Downloaded
   * - true,   false,      true      // need to check version (might be download/upgrade)
   * - true,   true,       false     // Unzip, delete zip, check version
   * - true,   true,       true      // Unzip, delete zip, check version | Probably upgrade
   */
  async unzipIfNeeded(translation: Translation): Promise<void> {
    // Already installed at latest version
    if (translation.version === translation.installedVersion) {
      return;
    }

    // Check if this is a zip file that needs unzipping
    if (!this.isUnprocessedFileZip(translation)) {
      return;
    }

    const zipPath = this.getUnprocessedLocalPath(translation);

    // Check if zip file exists
    const zipInfo = await LegacyFS.getInfoAsync(zipPath);
    if (!zipInfo.exists) {
      return;
    }

    try {
      // Attempt to unzip with retries
      await attemptAsync(3, async () => {
        const destDir = this.getDestinationDirectory(zipPath);
        await this.zipper.unzip(zipPath, destDir);
      });
    } finally {
      // Delete the zip in both cases (success or failure)
      // success: to save space
      // failure: to redownload it again
      try {
        await LegacyFS.deleteAsync(zipPath, { idempotent: true });
      } catch {
        // Ignore deletion errors
      }
    }
  }

  /**
   * Checks if the unprocessed file is a zip file.
   */
  private isUnprocessedFileZip(translation: Translation): boolean {
    const fileName = translation.fileName;
    return fileName.endsWith('.zip');
  }

  /**
   * Gets the unprocessed local path for a translation.
   */
  private getUnprocessedLocalPath(translation: Translation): string {
    return `${LegacyFS.documentDirectory}translations/${translation.fileName}`;
  }

  /**
   * Gets the destination directory from a zip path.
   */
  private getDestinationDirectory(zipPath: string): string {
    const lastSlash = zipPath.lastIndexOf('/');
    return lastSlash !== -1 ? zipPath.substring(0, lastSlash + 1) : zipPath;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a translation unzipper.
 */
export function createTranslationUnzipper(): TranslationUnzipper {
  return new DefaultTranslationUnzipper();
}

