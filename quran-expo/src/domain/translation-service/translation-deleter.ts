/**
 * TranslationDeleter.swift → translation-deleter.ts
 *
 * Deletes translation files.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Translation } from '../../model/quran-text';
import { createTranslation } from '../../model/quran-text';
import type { ActiveTranslationsPersistence } from '../../data/translation-persistence';
import { SQLiteActiveTranslationsPersistence } from '../../data/translation-persistence';
import { SelectedTranslationsPreferences } from './selected-translations-preferences';

// ============================================================================
// TranslationDeleter
// ============================================================================

/**
 * Deletes translation files and updates persistence.
 */
export class TranslationDeleter {
  private readonly persistence: ActiveTranslationsPersistence;

  constructor(databasesPath?: string) {
    const dbPath = databasesPath ?? `${LegacyFS.documentDirectory}translations/`;
    this.persistence = SQLiteActiveTranslationsPersistence.fromDirectory(dbPath);
  }

  /**
   * Deletes a translation and updates the database.
   */
  async deleteTranslation(translation: Translation): Promise<Translation> {
    // Update the selected translations
    SelectedTranslationsPreferences.shared.remove(translation.id);

    // Delete from disk
    const localFiles = this.getLocalFiles(translation);
    for (const file of localFiles) {
      try {
        await LegacyFS.deleteAsync(file, { idempotent: true });
      } catch {
        // Ignore deletion errors
      }
    }

    // Update the database
    const updatedTranslation = createTranslation({
      ...translation,
      installedVersion: undefined,
    });

    await this.persistence.update(updatedTranslation);

    return updatedTranslation;
  }

  /**
   * Gets all local files for a translation.
   */
  private getLocalFiles(translation: Translation): string[] {
    const basePath = `${LegacyFS.documentDirectory}translations/`;
    const files: string[] = [];

    // Add the main database file
    const dbFileName = translation.fileName.replace(/\.zip$/, '.db');
    files.push(`${basePath}${dbFileName}`);

    // Add the zip file if it exists
    if (translation.fileName.endsWith('.zip')) {
      files.push(`${basePath}${translation.fileName}`);
    }

    return files;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a translation deleter.
 */
export function createTranslationDeleter(
  databasesPath?: string
): TranslationDeleter {
  return new TranslationDeleter(databasesPath);
}

