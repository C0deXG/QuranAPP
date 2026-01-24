/**
 * Translation.swift + Translation+URLs.swift → translation.ts
 *
 * Translation model for Quran translations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { RelativeFilePath } from '../../core/utilities/relative-file-path';
import {
  stringByDeletingPathExtension,
  stringByAppendingExtension,
} from '../../core/utilities/string';

const COMPRESSED_FILE_EXTENSION = 'zip';
const TRANSLATIONS_PATH_COMPONENT = 'translations';
const LOCAL_TRANSLATIONS_PATH = new RelativeFilePath(TRANSLATIONS_PATH_COMPONENT, true);

/**
 * Represents a Quran translation.
 */
export interface Translation {
  /** Unique identifier */
  readonly id: number;
  /** Display name of the translation */
  readonly displayName: string;
  /** Translator name (English) */
  readonly translator: string | undefined;
  /** Translator name (foreign language) */
  readonly translatorForeign: string | undefined;
  /** Remote URL to download the translation */
  readonly fileURL: string;
  /** Local file name */
  readonly fileName: string;
  /** Language code (e.g., 'en', 'ar') */
  readonly languageCode: string;
  /** Latest version available */
  readonly version: number;
  /** Installed version, if downloaded */
  installedVersion: number | undefined;
}

/**
 * Creates a Translation object.
 */
export function createTranslation(params: {
  id: number;
  displayName: string;
  translator?: string;
  translatorForeign?: string;
  fileURL: string;
  fileName: string;
  languageCode: string;
  version: number;
  installedVersion?: number;
}): Translation {
  return {
    id: params.id,
    displayName: params.displayName,
    translator: params.translator,
    translatorForeign: params.translatorForeign,
    fileURL: params.fileURL,
    fileName: params.fileName,
    languageCode: params.languageCode,
    version: params.version,
    installedVersion: params.installedVersion,
  };
}

// ============================================================================
// Computed Properties
// ============================================================================

/**
 * Whether this translation is downloaded.
 */
export function isDownloaded(translation: Translation): boolean {
  return translation.installedVersion !== undefined;
}

/**
 * Whether this translation needs an upgrade.
 */
export function needsUpgrade(translation: Translation): boolean {
  return translation.installedVersion !== translation.version;
}

/**
 * The display name for the translation (prefers translatorForeign).
 */
export function translationName(translation: Translation): string {
  return translatorDisplayName(translation) ?? translation.displayName;
}

/**
 * The translator's display name (prefers foreign name).
 */
export function translatorDisplayName(translation: Translation): string | undefined {
  return translation.translatorForeign ?? translation.translator;
}

// ============================================================================
// URL/Path Utilities
// ============================================================================

/**
 * Checks if a path is within the local translations directory.
 */
export function isLocalTranslationPath(path: RelativeFilePath): boolean {
  return LOCAL_TRANSLATIONS_PATH.isParent(path);
}

/**
 * Gets the local path for a translation.
 */
export function translationLocalPath(translation: Translation): RelativeFilePath {
  return LOCAL_TRANSLATIONS_PATH.appendingPathComponent(translation.fileName, false);
}

/**
 * Gets all possible local file paths for a translation.
 */
export function translationLocalFiles(translation: Translation): RelativeFilePath[] {
  const fileNames = possibleFileNames(translation);
  return fileNames.map((name) =>
    LOCAL_TRANSLATIONS_PATH.appendingPathComponent(name, false)
  );
}

/**
 * Gets the unprocessed (raw download) local path.
 */
export function unprocessedLocalPath(translation: Translation): RelativeFilePath {
  return LOCAL_TRANSLATIONS_PATH.appendingPathComponent(
    unprocessedFileName(translation),
    false
  );
}

/**
 * Whether the unprocessed file is a ZIP archive.
 */
export function isUnprocessedFileZip(translation: Translation): boolean {
  return unprocessedFileName(translation).endsWith(COMPRESSED_FILE_EXTENSION);
}

/**
 * Gets the unprocessed file name (may be .zip).
 */
export function unprocessedFileName(translation: Translation): string {
  if (translation.fileURL.endsWith(COMPRESSED_FILE_EXTENSION)) {
    const baseName = stringByDeletingPathExtension(translation.fileName);
    return stringByAppendingExtension(baseName, COMPRESSED_FILE_EXTENSION);
  }
  return translation.fileName;
}

/**
 * Gets all possible file names for a translation.
 */
function possibleFileNames(translation: Translation): string[] {
  const unprocessed = unprocessedFileName(translation);
  if (unprocessed !== translation.fileName) {
    return [translation.fileName, unprocessed];
  }
  return [translation.fileName];
}

// ============================================================================
// Comparison
// ============================================================================

/**
 * Compares two translations for sorting.
 */
export function compareTranslations(a: Translation, b: Translation): number {
  // First compare by display name
  const displayNameComparison = a.displayName.localeCompare(b.displayName);
  if (displayNameComparison !== 0) {
    return displayNameComparison;
  }

  // Then by translation name
  return translationName(a).localeCompare(translationName(b));
}

/**
 * Checks if two translations are equal.
 */
export function translationsEqual(a: Translation, b: Translation): boolean {
  return a.id === b.id;
}

/**
 * Gets a hash code for a translation.
 */
export function translationHashCode(translation: Translation): number {
  return translation.id;
}

