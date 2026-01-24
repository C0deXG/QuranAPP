/**
 * ReciterDataRetriever.swift → reciter-data-retriever.ts
 *
 * Retrieves reciter data from bundled resources.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { Reciter, AudioType, ReciterCategory } from '../../model/quran-audio';
import {
  createReciter,
  AudioTypeGapped,
  AudioTypeGapless,
  reciterLocalDatabasePath,
  reciterLocalFolder,
  reciterLocalZipPath,
} from '../../model/quran-audio';
import { l, type TranslationTable } from '../../core/localization';

/**
 * Table namespace for translation tables (iOS pattern compatibility).
 */
const Table = {
  common: 'common' as TranslationTable,
  android: 'android' as TranslationTable,
  suras: 'suras' as TranslationTable,
  readers: 'readers' as TranslationTable,
};

// ============================================================================
// Reciter Data Type
// ============================================================================

/**
 * Raw reciter data from bundled JSON.
 */
interface ReciterData {
  id: number;
  name: string;
  path: string;
  url: string;
  databaseName: string;
  hasGaplessAlternative: boolean;
  category: string;
}

// ============================================================================
// ReciterDataRetriever
// ============================================================================

/**
 * Retrieves reciter data from bundled resources.
 */
export class ReciterDataRetriever {
  /**
   * Gets all available reciters.
   */
  async getReciters(): Promise<Reciter[]> {
    const recitersData = await this.loadRecitersData();

    const reciters = recitersData.map((item) => {
      const reciter = createReciter({
        id: item.id,
        nameKey: item.name,
        directory: item.path,
        audioURL: item.url,
        audioType: this.parseAudioType(item.databaseName),
        hasGaplessAlternative: item.hasGaplessAlternative,
        category: item.category as ReciterCategory,
      });

      return this.attachLocalPaths({
        ...reciter,
        localizedName: this.getLocalizedName(reciter),
      });
    });

    const filtered: Reciter[] = [];
    for (const reciter of reciters) {
      if (!reciter.hasGaplessAlternative) {
        filtered.push(reciter);
        continue;
      }

      // Only keep gapped reciters with gapless alternatives if already downloaded (iOS behavior)
      const isDownloaded = await reciterLocalFolder(reciter).exists();
      if (isDownloaded) {
        filtered.push(reciter);
      }
    }

    return filtered.sort((a, b) => {
      const nameA = this.getLocalizedName(a);
      const nameB = this.getLocalizedName(b);
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }

  /**
   * Gets the localized name for a reciter.
   */
  getLocalizedName(reciter: Reciter): string {
    return l(reciter.nameKey, Table.readers);
  }

  /**
   * Loads reciter data from bundled JSON.
   */
  private async loadRecitersData(): Promise<ReciterData[]> {
    try {
      // Use the bundled catalog (same content as iOS Reciters.plist)
      const recitersModule = await import('../../../assets/reciters.json');
      return (recitersModule as any).default as ReciterData[];
    } catch (error) {
      // Fall back to a minimal set if the bundled catalog fails to load
      console.warn('[ReciterDataRetriever] Failed to load bundled reciters.json, using fallback set', error);
      return this.getDefaultReciters();
    }
  }

  /**
   * Parses audio type from database name.
   */
  private parseAudioType(databaseName: string): AudioType {
    if (!databaseName || databaseName === '') {
      return AudioTypeGapped;
    }
    return AudioTypeGapless(databaseName);
  }

  /**
   * Attaches commonly used local paths to the reciter.
   */
  private attachLocalPaths(reciter: Reciter): Reciter {
    const localFolder = reciterLocalFolder(reciter);
    const localDatabasePath = reciterLocalDatabasePath(reciter);
    const localZipPath = reciterLocalZipPath(reciter);

    return {
      ...reciter,
      localFolder: localFolder.path,
      localDatabasePath: localDatabasePath?.url,
      localZipPath: localZipPath?.url,
    };
  }

  /**
   * Returns default reciters for fallback.
   */
  private getDefaultReciters(): ReciterData[] {
    // Minimal set of popular reciters
    return [
      {
        id: 41,
        name: 'mishary_alafasy',
        path: 'mishaari_raashid_al_3afaasee',
        url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/',
        databaseName: 'mishaari_raashid_al_3afaasee',
        hasGaplessAlternative: false,
        category: 'arabic',
      },
      {
        id: 4,
        name: 'abdul_basit_murattal',
        path: 'abdul_basit_murattal',
        url: 'https://download.quranicaudio.com/quran/abdul_basit_murattal/',
        databaseName: 'abdul_basit_murattal',
        hasGaplessAlternative: false,
        category: 'arabic',
      },
      {
        id: 26,
        name: 'al_husary',
        path: 'mahmoud_khaleel_al-husary',
        url: 'https://download.quranicaudio.com/quran/mahmoud_khaleel_al-husary/',
        databaseName: 'mahmoud_khaleel_al-husary',
        hasGaplessAlternative: false,
        category: 'arabic',
      },
    ];
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a reciter data retriever.
 */
export function createReciterDataRetriever(): ReciterDataRetriever {
  return new ReciterDataRetriever();
}

// ============================================================================
// Reciter Localization Extension
// ============================================================================

/**
 * Gets the localized name for a reciter.
 */
export function getReciterLocalizedName(reciter: Reciter): string {
  return l(reciter.nameKey, Table.readers);
}
