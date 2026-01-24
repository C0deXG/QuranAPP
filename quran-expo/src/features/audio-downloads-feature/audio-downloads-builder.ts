/**
 * AudioDownloadsBuilder.swift → audio-downloads-builder.ts
 *
 * Builder for the Audio Downloads feature.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { ReciterDataRetriever } from '../../domain/reciter-service';
import { QuranAudioDownloader } from '../../domain/quran-audio-kit';
import {
  AudioDownloadsViewModel,
  type ReciterAudioDeleter,
  type ReciterSizeInfoRetriever,
} from './audio-downloads-view-model';
import type { AudioDownloadedSize, Reciter } from '../../model/quran-audio';
import { reciterLocalFolder } from '../../model/quran-audio';
import type { Quran } from '../../model/quran-kit';
import * as LegacyFS from 'expo-file-system/legacy';

// ============================================================================
// ReciterAudioDeleterImpl
// ============================================================================

/**
 * Default implementation of ReciterAudioDeleter.
 */
class ReciterAudioDeleterImpl implements ReciterAudioDeleter {
  async deleteAudioFiles(reciter: Reciter): Promise<void> {
    const audioDir = reciterLocalFolder(reciter).url;
    const info = await LegacyFS.getInfoAsync(audioDir);
    if (info.exists) {
      await LegacyFS.deleteAsync(audioDir, { idempotent: true });
    }
  }
}

// ============================================================================
// ReciterSizeInfoRetrieverImpl
// ============================================================================

/**
 * Default implementation of ReciterSizeInfoRetriever.
 */
class ReciterSizeInfoRetrieverImpl implements ReciterSizeInfoRetriever {
  constructor(private readonly baseURL: string) {}

  async getDownloadedSizes(
    reciters: Reciter[],
    quran: Quran
  ): Promise<Map<number, AudioDownloadedSize>> {
    const sizes = new Map<number, AudioDownloadedSize>();

    for (const reciter of reciters) {
      try {
        const size = await this.getDownloadedSize(reciter, quran);
        sizes.set(reciter.id, size);
      } catch {
        // Ignore errors for individual reciters
      }
    }

    return sizes;
  }

  async getDownloadedSize(
    reciter: Reciter,
    quran: Quran
  ): Promise<AudioDownloadedSize> {
    const audioDir = reciterLocalFolder(reciter).url;
    const surasCount = quran.suras.length;

    try {
      const info = await LegacyFS.getInfoAsync(audioDir);
      if (!info.exists) {
        return {
          downloadedSizeInBytes: 0,
          downloadedSuraCount: 0,
          surasCount,
        };
      }

      // Read directory contents
      const files = await LegacyFS.readDirectoryAsync(audioDir);
      let totalSize = 0;
      let suraCount = 0;

      // Count audio files (simplified - just count mp3 files)
      for (const file of files) {
        if (file.endsWith('.mp3')) {
          const filePath = `${audioDir}/${file}`;
          const fileInfo = await LegacyFS.getInfoAsync(filePath);
          if (fileInfo.exists && 'size' in fileInfo) {
            totalSize += fileInfo.size ?? 0;
          }
          // Extract sura number from filename (e.g., "001.mp3" -> 1)
          const match = file.match(/^(\d{3})\.mp3$/);
          if (match) {
            suraCount++;
          }
        }
      }

      // For gapless, each sura has one file
      // For gapped, we need to count differently
      // This is a simplified approach
      return {
        downloadedSizeInBytes: totalSize,
        downloadedSuraCount: Math.min(suraCount, surasCount),
        surasCount,
      };
    } catch {
      return {
        downloadedSizeInBytes: 0,
        downloadedSuraCount: 0,
        surasCount,
      };
    }
  }
}

// ============================================================================
// AudioDownloadsBuilder
// ============================================================================

/**
 * Builder for the Audio Downloads feature.
 *
 * 1:1 translation of iOS AudioDownloadsBuilder.
 */
export class AudioDownloadsBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly container: AppDependencies;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(container: AppDependencies) {
    this.container = container;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the AudioDownloadsViewModel.
   */
  build(): AudioDownloadsViewModel {
    const downloader = new QuranAudioDownloader(
      this.container.filesAppHost,
      this.container.downloadManager
    );

    const sizeInfoRetriever = new ReciterSizeInfoRetrieverImpl(
      this.container.filesAppHost
    );

    const viewModel = new AudioDownloadsViewModel(
      this.container.analytics,
      new ReciterAudioDeleterImpl(),
      downloader,
      sizeInfoRetriever,
      new ReciterDataRetriever()
    );

    return viewModel;
  }
}
