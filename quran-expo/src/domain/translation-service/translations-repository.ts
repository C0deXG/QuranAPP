/**
 * TranslationsRepository.swift → translations-repository.ts
 *
 * Repository for syncing translations between local and remote.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Translation } from '../../model/quran-text';
import { createTranslation } from '../../model/quran-text';
import type { ActiveTranslationsPersistence } from '../../data/translation-persistence';
import { SQLiteActiveTranslationsPersistence } from '../../data/translation-persistence';
import { TranslationNetworkManager } from './translation-network-manager';
import { createNetworkManager } from '../../data/network-support';
import { JSONTranslationsParser } from './translations-parser';

// ============================================================================
// TranslationsRepository
// ============================================================================

/**
 * Repository for syncing translations with remote API.
 */
export class TranslationsRepository {
  private readonly networkManager: TranslationNetworkManager;
  private readonly persistence: ActiveTranslationsPersistence;

  constructor(databasesPath: string, baseURL: string) {
    const netManager = createNetworkManager(baseURL);
    this.networkManager = new TranslationNetworkManager(
      netManager,
      new JSONTranslationsParser()
    );
    this.persistence = SQLiteActiveTranslationsPersistence.fromDirectory(databasesPath);
  }

  /**
   * Downloads translations from the API and syncs with local storage.
   */
  async downloadAndSyncTranslations(): Promise<void> {
    // Fetch local and remote in parallel
    const [local, remote] = await Promise.all([
      this.persistence.retrieveAll(),
      this.networkManager.getTranslations(),
    ]);

    const { translations, localMap } = this.combine(local, remote);
    await this.saveCombined(translations, localMap);
  }

  /**
   * Combines local and remote translations.
   */
  private combine(
    local: Translation[],
    remote: Translation[]
  ): { translations: Translation[]; localMap: Map<string, Translation> } {
    // Create a map of local translations by filename
    const localMapConstant = new Map<string, Translation>(
      local.map((t) => [t.fileName, t])
    );
    const localMap = new Map(localMapConstant);

    const combinedList: Translation[] = [];

    for (const remoteTranslation of remote) {
      const localTranslation = localMap.get(remoteTranslation.fileName);

      if (localTranslation) {
        // Combine: keep remote data but preserve installed version
        const combined = createTranslation({
          ...remoteTranslation,
          installedVersion: localTranslation.installedVersion,
        });
        combinedList.push(combined);
        localMap.delete(remoteTranslation.fileName);
      } else {
        combinedList.push(remoteTranslation);
      }
    }

    // Add any remaining local translations not in remote
    for (const [, translation] of localMap) {
      combinedList.push(translation);
    }

    return { translations: combinedList, localMap: localMapConstant };
  }

  /**
   * Saves combined translations to persistence.
   */
  private async saveCombined(
    translations: Translation[],
    localMap: Map<string, Translation>
  ): Promise<void> {
    for (const translation of translations) {
      const oldTranslation = localMap.get(translation.fileName);
      if (oldTranslation) {
        await this.persistence.remove(oldTranslation);
      }
      await this.persistence.insert(translation);
    }
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
 * Creates a translations repository.
 */
export function createTranslationsRepository(
  databasesPath?: string,
  baseURL?: string
): TranslationsRepository {
  const dbPath = databasesPath ?? `${LegacyFS.documentDirectory}translations/`;
  const url = baseURL ?? 'https://api.qurancdn.com';
  return new TranslationsRepository(dbPath, url);
}

