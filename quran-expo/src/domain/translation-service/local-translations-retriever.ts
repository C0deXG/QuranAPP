/**
 * LocalTranslationsRetriever.swift → local-translations-retriever.ts
 *
 * Retrieves locally installed translations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Translation } from '../../model/quran-text';
import type { ActiveTranslationsPersistence } from '../../data/translation-persistence';
import { SQLiteActiveTranslationsPersistence } from '../../data/translation-persistence';
import { TranslationsVersionUpdater } from './translations-version-updater';
import { sortedAs } from '../../core/utilities/array';

// ============================================================================
// LocalTranslationsRetriever
// ============================================================================

/**
 * Retrieves and updates local translations.
 */
export class LocalTranslationsRetriever {
  private readonly persistence: ActiveTranslationsPersistence;
  private readonly versionUpdater: TranslationsVersionUpdater;

  constructor(databasesPath?: string) {
    const dbPath = databasesPath ?? `${LegacyFS.documentDirectory}translations/`;
    this.persistence = SQLiteActiveTranslationsPersistence.fromDirectory(dbPath);
    this.versionUpdater = new TranslationsVersionUpdater(this.persistence);
  }

  /**
   * Gets all local translations with updated installed versions.
   */
  async getLocalTranslations(): Promise<Translation[]> {
    const translations = await this.persistence.retrieveAll();

    // Update installed versions in parallel
    const updatedTranslations = await Promise.all(
      translations.map((translation) =>
        this.updateInstalledVersion(translation)
      )
    );

    // Sort back to original order
    const originalIds = translations.map((t) => t.id);
    return sortedAs(updatedTranslations, originalIds, (t) => t.id);
  }

  /**
   * Updates the installed version of a translation.
   */
  private async updateInstalledVersion(
    translation: Translation
  ): Promise<Translation> {
    return this.versionUpdater.updateInstalledVersion(translation);
  }

  /**
   * Gets the persistence layer.
   */
  getPersistence(): ActiveTranslationsPersistence {
    return this.persistence;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a local translations retriever.
 */
export function createLocalTranslationsRetriever(
  databasesPath?: string
): LocalTranslationsRetriever {
  return new LocalTranslationsRetriever(databasesPath);
}

