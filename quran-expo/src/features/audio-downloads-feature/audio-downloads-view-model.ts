/**
 * AudioDownloadsViewModel.swift → audio-downloads-view-model.ts
 *
 * View model for audio downloads management.
 *
 * Quran.com. All rights reserved.
 */

import type { AnalyticsLibrary } from '../../core/analytics';
import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { Quran } from '../../model/quran-kit';
import type { AudioDownloadedSize, Reciter } from '../../model/quran-audio';
import { ReadingPreferences } from '../../domain/reading-service';
import { type Reading, quranForReading } from '../../model/quran-kit';
import type { ReciterDataRetriever } from '../../domain/reciter-service';
import type { QuranAudioDownloader } from '../../domain/quran-audio-kit';
import {
  type AudioDownloadItem,
  createAudioDownloadItem,
  sortAudioDownloadItems,
  canDelete,
} from './audio-download-item';

// ============================================================================
// EditMode
// ============================================================================

export type EditMode = 'inactive' | 'active';

// ============================================================================
// ReciterAudioDeleter Interface
// ============================================================================

export interface ReciterAudioDeleter {
  deleteAudioFiles(reciter: Reciter): Promise<void>;
}

// ============================================================================
// ReciterSizeInfoRetriever Interface
// ============================================================================

export interface ReciterSizeInfoRetriever {
  getDownloadedSizes(
    reciters: Reciter[],
    quran: Quran
  ): Promise<Map<number, AudioDownloadedSize>>;
  getDownloadedSize(
    reciter: Reciter,
    quran: Quran
  ): Promise<AudioDownloadedSize>;
}

// ============================================================================
// AudioDownloadsViewState
// ============================================================================

export interface AudioDownloadsViewState {
  editMode: EditMode;
  error: Error | null;
  items: AudioDownloadItem[];
  isLoading: boolean;
}

// ============================================================================
// AudioDownloadsViewModel
// ============================================================================

/**
 * View model for audio downloads management.
 *
 * 1:1 translation of iOS AudioDownloadsViewModel.
 */
export class AudioDownloadsViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  private quran: Quran;
  private readonly analytics: AnalyticsLibrary;
  private readonly readingPreferences = ReadingPreferences.shared;
  private readonly deleter: ReciterAudioDeleter;
  private readonly ayahsDownloader: QuranAudioDownloader;
  private readonly sizeInfoRetriever: ReciterSizeInfoRetriever;
  private readonly recitersRetriever: ReciterDataRetriever;

  private reciters: Reciter[] = [];
  private sizes: Map<number, AudioDownloadedSize> = new Map();
  private progress: Map<number, number> = new Map();

  private _state: AudioDownloadsViewState;
  private stateListeners: ((state: AudioDownloadsViewState) => void)[] = [];

  private downloadCancelTokens: Map<number, AbortController> = new Map();

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    analytics: AnalyticsLibrary,
    deleter: ReciterAudioDeleter,
    ayahsDownloader: QuranAudioDownloader,
    sizeInfoRetriever: ReciterSizeInfoRetriever,
    recitersRetriever: ReciterDataRetriever
  ) {
    this.quran = quranForReading(this.readingPreferences.reading);
    this.analytics = analytics;
    this.deleter = deleter;
    this.ayahsDownloader = ayahsDownloader;
    this.sizeInfoRetriever = sizeInfoRetriever;
    this.recitersRetriever = recitersRetriever;

    this._state = {
      editMode: 'inactive',
      error: null,
      items: [],
      isLoading: true,
    };
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): AudioDownloadsViewState {
    return this._state;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  addListener(listener: (state: AudioDownloadsViewState) => void): void {
    this.stateListeners.push(listener);
  }

  removeListener(listener: (state: AudioDownloadsViewState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  private setState(updates: Partial<AudioDownloadsViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.stateListeners) {
      listener(this._state);
    }
  }

  private updateItems(): void {
    const items = this.reciters.map((reciter) => {
      const size = this.sizes.get(reciter.id) ?? null;
      const progressValue = this.progress.get(reciter.id);
      const downloadProgress: AudioDownloadItem['progress'] =
        progressValue !== undefined
          ? { type: 'downloading', progress: progressValue }
          : { type: 'notDownloading' };

      return createAudioDownloadItem(reciter, size, downloadProgress);
    });

    this.setState({ items: sortAudioDownloadItems(items) });
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start the view model.
   */
  async start(): Promise<void> {
    this.setState({ isLoading: true });

    try {
      // Initial load
      await this.update(this.quran);

      // Set up reading preference listener
      this.readingPreferences.addListener('reading', async (reading: Reading) => {
        await this.update(quranForReading(reading));
      });
    } catch (error) {
      this.setState({ error: error as Error });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Toggle edit mode.
   */
  toggleEditMode(): void {
    this.setState({
      editMode: this._state.editMode === 'inactive' ? 'active' : 'inactive',
    });
  }

  /**
   * Set edit mode.
   */
  setEditMode(mode: EditMode): void {
    this.setState({ editMode: mode });
  }

  /**
   * Delete reciter audio files.
   */
  async deleteReciterFiles(reciter: Reciter): Promise<void> {
    logger.info(`Downloads: deleting reciter ${reciter.id}`);
    this.logDeletingQuran(reciter);

    await this.cancelDownloading(reciter);

    try {
      await this.deleter.deleteAudioFiles(reciter);
      this.sizes.set(reciter.id, {
        downloadedSizeInBytes: 0,
        downloadedSuraCount: 0,
        surasCount: this.quran.suras.length,
      });
      this.updateItems();
    } catch (error) {
      this.setState({ error: error as Error });
    }
  }

  /**
   * Start downloading audio for a reciter.
   */
  async startDownloading(reciter: Reciter): Promise<void> {
    logger.info(`Downloads: start downloading reciter ${reciter.id}`);
    this.logDownloadingQuran(reciter);

    this.progress.set(reciter.id, 0);
    this.updateItems();

    try {
      const abortController = new AbortController();
      this.downloadCancelTokens.set(reciter.id, abortController);

      await this.ayahsDownloader.download(
        this.quran.firstVerse,
        this.quran.lastVerse,
        reciter,
        (downloadProgress: number) => {
          this.progress.set(reciter.id, downloadProgress);
          this.updateItems();

          // Reload size periodically
          if (this.shouldReloadSizeInfo(reciter.id, downloadProgress)) {
            this.reloadDownloadedSize(reciter);
          }
        },
        abortController.signal
      );

      // Download completed
      this.progress.delete(reciter.id);
      this.downloadCancelTokens.delete(reciter.id);
      await this.reloadDownloadedSize(reciter);
      this.updateItems();
    } catch (error) {
      this.progress.delete(reciter.id);
      this.downloadCancelTokens.delete(reciter.id);
      this.updateItems();

      if ((error as Error).name !== 'AbortError') {
        crasher.recordError(
          error as Error,
          'Failed to start the reciter download'
        );
        this.setState({ error: error as Error });
      }
    }
  }

  /**
   * Cancel downloading audio for a reciter.
   */
  async cancelDownloading(reciter: Reciter): Promise<void> {
    logger.info(`Downloads: cancel downloading reciter ${reciter.id}`);

    const abortController = this.downloadCancelTokens.get(reciter.id);
    if (abortController) {
      abortController.abort();
      this.downloadCancelTokens.delete(reciter.id);
    }

    this.progress.delete(reciter.id);
    this.updateItems();
  }

  /**
   * Check if any items can be deleted (for edit button visibility).
   */
  hasDeleteableItems(): boolean {
    return this._state.items.some((item) => canDelete(item));
  }

  /**
   * Clear error.
   */
  clearError(): void {
    this.setState({ error: null });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async update(quran: Quran): Promise<void> {
    this.quran = quran;
    this.sizes.clear();

    // Get new data
    this.reciters = await this.recitersRetriever.getReciters();
    this.sizes = await this.sizeInfoRetriever.getDownloadedSizes(
      this.reciters,
      quran
    );
    this.updateItems();
  }

  private lastProgressForReload: Map<number, number> = new Map();

  private shouldReloadSizeInfo(reciterId: number, newProgress: number): boolean {
    const oldProgress = this.lastProgressForReload.get(reciterId) ?? 0;
    const scale = 2000;
    const oldValue = Math.floor(oldProgress * scale);
    const newValue = Math.floor(newProgress * scale);

    if (newValue - oldValue > 0.9) {
      this.lastProgressForReload.set(reciterId, newProgress);
      return true;
    }
    return false;
  }

  private async reloadDownloadedSize(reciter: Reciter): Promise<void> {
    const size = await this.sizeInfoRetriever.getDownloadedSize(
      reciter,
      this.quran
    );
    this.sizes.set(reciter.id, size);
    this.updateItems();
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  private logDeletingQuran(reciter: Reciter): void {
    this.analytics.logEvent('AudioDeletionReciterId', reciter.id.toString());
    this.analytics.logEvent('AudioDeletionReciterName', reciter.nameKey);
  }

  private logDownloadingQuran(reciter: Reciter): void {
    this.analytics.logEvent(
      'QuranDownloadingReciterId',
      reciter.id.toString()
    );
    this.analytics.logEvent('QuranDownloadingReciterName', reciter.nameKey);
  }
}

