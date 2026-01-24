/**
 * TranslationsVersionUpdater.swift → translations-version-updater.ts
 *
 * Updates installed version of translations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Translation } from '../../model/quran-text';
import { createTranslation } from '../../model/quran-text';
import type { ActiveTranslationsPersistence } from '../../data/translation-persistence';
import type { DatabaseVersionPersistence } from '../../data/verse-text-persistence';
import { SQLiteDatabaseVersionPersistence } from '../../data/verse-text-persistence';
import type { TranslationUnzipper } from './translation-unzipper';
import { DefaultTranslationUnzipper } from './translation-unzipper';
import { SelectedTranslationsPreferences } from './selected-translations-preferences';

// ============================================================================
// Types
// ============================================================================

/**
 * Factory function to create version persistence for a translation.
 */
export type VersionPersistenceFactory = (
  translation: Translation
) => DatabaseVersionPersistence;

// ============================================================================
// TranslationsVersionUpdater
// ============================================================================

/**
 * Updates the installed version of translations.
 */
export class TranslationsVersionUpdater {
  private readonly persistence: ActiveTranslationsPersistence;
  private readonly versionPersistenceFactory: VersionPersistenceFactory;
  private readonly unzipper: TranslationUnzipper;

  constructor(
    persistence: ActiveTranslationsPersistence,
    versionPersistenceFactory?: VersionPersistenceFactory,
    unzipper?: TranslationUnzipper
  ) {
    this.persistence = persistence;
    this.versionPersistenceFactory =
      versionPersistenceFactory ?? this.defaultVersionPersistenceFactory;
    this.unzipper = unzipper ?? new DefaultTranslationUnzipper();
  }

  /**
   * Updates the installed version for a translation.
   */
  async updateInstalledVersion(translation: Translation): Promise<Translation> {
    // Unzip if needed
    await this.unzipper.unzipIfNeeded(translation);

    // Update versions
    return this.doUpdateInstalledVersion(translation);
  }

  /**
   * Default factory for version persistence.
   */
  private defaultVersionPersistenceFactory = (
    translation: Translation
  ): DatabaseVersionPersistence => {
    const localPath = this.getLocalPath(translation);
    return SQLiteDatabaseVersionPersistence.fromPath(localPath);
  };

  /**
   * Updates the installed version in the database.
   */
  private async doUpdateInstalledVersion(
    translation: Translation
  ): Promise<Translation> {
    const localPath = this.getLocalPath(translation);
    const isReachable = await this.fileExists(localPath);
    const previousInstalledVersion = translation.installedVersion;

    let newInstalledVersion = translation.installedVersion;

    // Installed on the latest version & the db file exists
    if (translation.version !== translation.installedVersion && isReachable) {
      try {
        const versionPersistence = this.versionPersistenceFactory(translation);
        const version = await versionPersistence.getTextVersion();
        newInstalledVersion = version;
      } catch {
        // If an error occurred while getting the version
        // that means the db file is corrupted.
        newInstalledVersion = undefined;
      }
    } else if (translation.installedVersion !== undefined && !isReachable) {
      newInstalledVersion = undefined;
    }

    // Create updated translation
    const updatedTranslation = createTranslation({
      ...translation,
      installedVersion: newInstalledVersion,
    });

    if (previousInstalledVersion !== newInstalledVersion) {
      await this.persistence.update(updatedTranslation);

      // Remove the translation from selected translations if uninstalled
      if (newInstalledVersion === undefined) {
        SelectedTranslationsPreferences.shared.remove(translation.id);
      }
    }

    return updatedTranslation;
  }

  /**
   * Gets the local path for a translation.
   */
  private getLocalPath(translation: Translation): string {
    // Replace .zip extension with .db if needed
    const fileName = translation.fileName.replace(/\.zip$/, '.db');
    return `${LegacyFS.documentDirectory}translations/${fileName}`;
  }

  /**
   * Checks if a file exists.
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      const info = await LegacyFS.getInfoAsync(path);
      return info.exists;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a translations version updater.
 */
export function createTranslationsVersionUpdater(
  persistence: ActiveTranslationsPersistence
): TranslationsVersionUpdater {
  return new TranslationsVersionUpdater(persistence);
}

