/**
 * DownloadedRecitersService.swift, RecentRecitersService.swift,
 * AudioUnzipper.swift, ReciterAudioDeleter.swift, ReciterSizeInfoRetriever.swift
 * → reciter-services.ts
 *
 * Various reciter-related services.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Reciter, AudioDownloadedSize } from '../../model/quran-audio';
import {
  audioFilesPath,
  createAudioDownloadedSize,
  reciterLocalDatabasePath,
  reciterLocalFolder,
  reciterLocalZipPath,
} from '../../model/quran-audio';
import type { IQuran } from '../../model/quran-kit/types';
import { ReciterPreferences } from './reciter-preferences';
import { createLogger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { Zipper } from '../../core/system-dependencies';
import { DefaultZipper } from '../../core/system-dependencies';

const logger = createLogger('ReciterService');

// ============================================================================
// DownloadedRecitersService
// ============================================================================

/**
 * Service for finding downloaded reciters.
 */
export class DownloadedRecitersService {
  /**
   * Gets reciters that have been downloaded.
   */
  async downloadedReciters(allReciters: Reciter[]): Promise<Reciter[]> {
    const audioFilesDir = audioFilesPath();

    try {
      const dirInfo = await LegacyFS.getInfoAsync(audioFilesDir.url);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        return [];
      }

      const downloadedReciters: Reciter[] = [];

      for (const reciter of allReciters) {
        const reciterDir = reciterLocalFolder(reciter);
        const isDownloaded = await this.isReciterDownloaded(reciterDir);
        if (isDownloaded) {
          downloadedReciters.push(reciter);
        }
      }

      return downloadedReciters;
    } catch (error) {
      logger.error('Error getting downloaded reciters', { error });
      return [];
    }
  }

  private async isReciterDownloaded(reciterDir: ReturnType<typeof reciterLocalFolder>): Promise<boolean> {
    try {
      const dirInfo = await LegacyFS.getInfoAsync(reciterDir.url);
      if (!dirInfo.exists || !dirInfo.isDirectory) return false;

      const contents = await reciterDir.contentsOfDirectory();
      return contents.length > 0;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// RecentRecitersService
// ============================================================================

const MAX_RECENT_RECITERS = 3;

/**
 * Service for managing recent reciters.
 */
export class RecentRecitersService {
  /**
   * Gets recent reciters from the list of all reciters.
   */
  recentReciters(allReciters: Reciter[]): Reciter[] {
    const recentIds = ReciterPreferences.shared.recentReciterIds;
    const recentReciters: Reciter[] = [];

    for (const id of recentIds) {
      const reciter = allReciters.find((r) => r.id === id);
      if (reciter) {
        recentReciters.push(reciter);
      }
    }

    // Reverse to show most recent first
    return recentReciters.reverse();
  }

  /**
   * Updates the recent reciters list with a newly selected reciter.
   */
  updateRecentRecitersList(reciter: Reciter): void {
    let recentIds = [...ReciterPreferences.shared.recentReciterIds];

    // Remove from the set if it exists so it can go to the front
    recentIds = recentIds.filter((id) => id !== reciter.id);

    // Remove the least recently selected if at max
    if (recentIds.length >= MAX_RECENT_RECITERS) {
      recentIds.shift();
    }

    recentIds.push(reciter.id);
    ReciterPreferences.shared.recentReciterIds = recentIds;
  }
}

// ============================================================================
// AudioUnzipper
// ============================================================================

/**
 * Service for unzipping gapless audio databases.
 */
export class AudioUnzipper {
  private readonly zipper: Zipper;

  constructor(zipper: Zipper = new DefaultZipper()) {
    this.zipper = zipper;
  }

  /**
   * Unzips a reciter's audio database.
   */
  async unzip(reciter: Reciter): Promise<void> {
    const dbPath = reciterLocalDatabasePath(reciter);
    const zipPath = reciterLocalZipPath(reciter);

    if (!dbPath || !zipPath) {
      return;
    }

    // Check if already unzipped
    const dbInfo = await LegacyFS.getInfoAsync(dbPath.url);
    if (dbInfo.exists) {
      return;
    }

    logger.info('Unzipping audio file', { reciter: reciter.nameKey, zipPath: zipPath.url });

    try {
      const destDir = reciterLocalFolder(reciter);
      await this.zipper.unzip(zipPath.url, destDir.url);

      // Some hosted zips include nested folders; ensure the .db lands where we expect it.
      const dbInfo = await LegacyFS.getInfoAsync(dbPath.url);
      if (!dbInfo.exists) {
        try {
          const zipContent = await LegacyFS.readAsStringAsync(zipPath.url, {
            encoding: LegacyFS.EncodingType.Base64,
          });
          const zip = await JSZip.loadAsync(zipContent, { base64: true });
          const dbEntry = Object.values(zip.files).find(
            (entry: any) => !entry.dir && entry.name.toLowerCase().endsWith('.db')
          ) as JSZip.JSZipObject | undefined;

          if (dbEntry) {
            const base64 = await dbEntry.async('base64');
            const parentDir = dbPath.url.substring(0, dbPath.url.lastIndexOf('/'));
            await LegacyFS.makeDirectoryAsync(parentDir, { intermediates: true });
            await LegacyFS.writeAsStringAsync(dbPath.url, base64, {
              encoding: LegacyFS.EncodingType.Base64,
            });
          }
        } catch (extractionError) {
          logger.warning(`Failed fallback extraction of timing DB: ${extractionError}`);
        }
      }

      // Final check: if DB still missing, delete zip to force re-download next attempt.
      const finalInfo = await LegacyFS.getInfoAsync(dbPath.url);
      if (!finalInfo.exists) {
        await LegacyFS.deleteAsync(zipPath.url, { idempotent: true });
        throw new Error(`Timing database not found after unzip for reciter ${reciter.nameKey}`);
      }
    } catch (error) {
      crasher.recordError(error as Error, `Cannot unzip file '${zipPath.url}'`);
      // Delete the zip so it can be re-downloaded
      try {
        await LegacyFS.deleteAsync(zipPath.url, { idempotent: true });
      } catch {}
      throw error;
    }
  }
}

// ============================================================================
// ReciterAudioDeleter
// ============================================================================

/**
 * Service for deleting reciter audio files.
 */
export class ReciterAudioDeleter {
  /**
   * Deletes all audio files for a reciter.
   */
  async deleteAudioFiles(reciter: Reciter): Promise<void> {
    const reciterDir = reciterLocalFolder(reciter);
    await LegacyFS.deleteAsync(reciterDir.url, { idempotent: true });
  }
}

// ============================================================================
// ReciterSizeInfoRetriever
// ============================================================================

/**
 * Service for retrieving reciter download size information.
 */
export class ReciterSizeInfoRetriever {
  private readonly baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Gets download sizes for multiple reciters.
   */
  async getDownloadedSizes(
    reciters: Reciter[],
    quran: IQuran
  ): Promise<Map<number, AudioDownloadedSize>> {
    const results = new Map<number, AudioDownloadedSize>();

    await Promise.all(
      reciters.map(async (reciter) => {
        const size = await this.getDownloadedSize(reciter, quran);
        results.set(reciter.id, size);
      })
    );

    return results;
  }

  /**
   * Gets download size for a single reciter.
   */
  async getDownloadedSize(reciter: Reciter, quran: IQuran): Promise<AudioDownloadedSize> {
    const reciterDir = reciterLocalFolder(reciter);

    try {
      const dirInfo = await LegacyFS.getInfoAsync(reciterDir.url);
      if (!dirInfo.exists) {
        return createAudioDownloadedSize({
          downloadedSizeInBytes: 0,
          downloadedSuraCount: 0,
          surasCount: quran.suras.length,
        });
      }

      const reciterDirUrl = reciterDir.url.endsWith('/')
        ? reciterDir.url
        : `${reciterDir.url}/`;
      const files = await LegacyFS.readDirectoryAsync(reciterDirUrl);
      let totalSize = 0;
      const downloadedSuras = new Set<number>();

      for (const file of files) {
        const filePath = `${reciterDirUrl}${file}`;
        const fileInfo = await LegacyFS.getInfoAsync(filePath);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size ?? 0;
        }

        // Extract sura number from filename (format: 001.mp3 or 001001.mp3)
        const suraMatch = file.match(/^(\d{3})/);
        if (suraMatch) {
          downloadedSuras.add(parseInt(suraMatch[1], 10));
        }
      }

      return createAudioDownloadedSize({
        downloadedSizeInBytes: totalSize,
        downloadedSuraCount: downloadedSuras.size,
        surasCount: quran.suras.length,
      });
    } catch (error) {
      logger.error('Error getting downloaded size', { error, reciter: reciter.nameKey });
      return createAudioDownloadedSize({
        downloadedSizeInBytes: 0,
        downloadedSuraCount: 0,
        surasCount: quran.suras.length,
      });
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createDownloadedRecitersService(): DownloadedRecitersService {
  return new DownloadedRecitersService();
}

export function createRecentRecitersService(): RecentRecitersService {
  return new RecentRecitersService();
}

export function createAudioUnzipper(): AudioUnzipper {
  return new AudioUnzipper();
}

export function createReciterAudioDeleter(): ReciterAudioDeleter {
  return new ReciterAudioDeleter();
}

export function createReciterSizeInfoRetriever(baseURL: string): ReciterSizeInfoRetriever {
  return new ReciterSizeInfoRetriever(baseURL);
}
