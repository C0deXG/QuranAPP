/**
 * TranslationNetworkManager.swift → translation-network-manager.ts
 *
 * Fetches translations from the network.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { Translation } from '../../model/quran-text';
import type { NetworkManager } from '../../data/network-support';
import { createNetworkManager } from '../../data/network-support';
import type { TranslationsParser } from './translations-parser';
import { JSONTranslationsParser } from './translations-parser';

// ============================================================================
// Constants
// ============================================================================

const TRANSLATIONS_PATH = '/data/translations.php';
const API_VERSION = '5';

// ============================================================================
// TranslationNetworkManager
// ============================================================================

/**
 * Network manager for fetching translations.
 */
export class TranslationNetworkManager {
  private readonly networkManager: NetworkManager;
  private readonly parser: TranslationsParser;

  constructor(networkManager: NetworkManager, parser?: TranslationsParser) {
    this.networkManager = networkManager;
    this.parser = parser ?? new JSONTranslationsParser();
  }

  /**
   * Fetches translations from the API.
   */
  async getTranslations(): Promise<Translation[]> {
    const data = await this.networkManager.request(TRANSLATIONS_PATH, [
      ['v', API_VERSION],
    ]);
    return this.parser.parse(data);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a translation network manager.
 */
export function createTranslationNetworkManager(
  baseURL: string
): TranslationNetworkManager {
  const networkManager = createNetworkManager(baseURL);
  return new TranslationNetworkManager(networkManager);
}

