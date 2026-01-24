/**
 * TranslationsListViewModel.swift → translations-view-model.ts
 *
 * View model for the Translations list screen.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { AnalyticsLibrary } from '../../core/analytics';
import type { Translation } from '../../model/quran-text';
import type {
  TranslationsRepository,
  LocalTranslationsRetriever,
  TranslationDeleter,
  TranslationsDownloader,
} from '../../domain/translation-service';
import { SelectedTranslationsPreferences } from '../../domain/translation-service';
import {
  type TranslationItem,
  type DownloadingProgress,
  DownloadingProgress as DownloadingProgressFactory,
  createTranslationItem,
} from './translation-item';

// ============================================================================
// TranslationsViewState
// ============================================================================

/**
 * State for the Translations view.
 */
export interface TranslationsViewState {
  isEditing: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  selectedTranslations: TranslationItem[];
  downloadedTranslations: TranslationItem[];
  availableTranslations: TranslationItem[];
}

/**
 * Initial state for the Translations view.
 */
export const initialTranslationsViewState: TranslationsViewState = {
  isEditing: false,
  isLoading: true,
  isRefreshing: false,
  error: null,
  selectedTranslations: [],
  downloadedTranslations: [],
  availableTranslations: [],
};

// ============================================================================
// TranslationsViewModel
// ============================================================================

/**
 * View model for the Translations list screen.
 *
 * 1:1 translation of iOS TranslationsListViewModel.
 */
export class TranslationsViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly analytics: AnalyticsLibrary;
  private readonly translationsRepository: TranslationsRepository;
  private readonly localTranslationsRetriever: LocalTranslationsRetriever;
  private readonly deleter: TranslationDeleter;
  private readonly downloader: TranslationsDownloader;
  private readonly selectedTranslationsPreferences = SelectedTranslationsPreferences.shared;

  private translations: Translation[] = [];
  private selectedTranslationIds: number[] = [];
  private progress: Map<number, number> = new Map();

  /** Current state */
  private _state: TranslationsViewState = { ...initialTranslationsViewState };

  /** State change listeners */
  private listeners: ((state: TranslationsViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    analytics: AnalyticsLibrary,
    translationsRepository: TranslationsRepository,
    localTranslationsRetriever: LocalTranslationsRetriever,
    deleter: TranslationDeleter,
    downloader: TranslationsDownloader
  ) {
    this.analytics = analytics;
    this.translationsRepository = translationsRepository;
    this.localTranslationsRetriever = localTranslationsRetriever;
    this.deleter = deleter;
    this.downloader = downloader;

    // Load initial selected translations
    this.selectedTranslationIds = [...this.selectedTranslationsPreferences.selectedTranslationIds];
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): TranslationsViewState {
    return this._state;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: TranslationsViewState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: TranslationsViewState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<TranslationsViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  /**
   * Rebuild computed lists and update state.
   */
  private updateComputedLists(): void {
    const selectedTranslations = this.selectedTranslationIds
      .map((id) => this.translations.find((t) => t.id === id))
      .filter((t): t is Translation => t !== undefined)
      .map((t) => this.translationItem(t));

    const downloadedTranslations = this.translations
      .filter((t) => t.isDownloaded && !this.selectedTranslationIds.includes(t.id))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((t) => this.translationItem(t));

    const availableTranslations = this.translations
      .filter((t) => !t.isDownloaded)
      .map((t) => this.translationItem(t));

    this.setState({
      selectedTranslations,
      downloadedTranslations,
      availableTranslations,
    });
  }

  /**
   * Create a TranslationItem from a Translation.
   */
  private translationItem(translation: Translation): TranslationItem {
    const progressValue = this.progress.get(translation.id);
    const progress: DownloadingProgress =
      progressValue !== undefined
        ? DownloadingProgressFactory.downloading(progressValue)
        : DownloadingProgressFactory.notDownloading();
    return createTranslationItem(translation, progress);
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start loading translations.
   */
  async start(): Promise<void> {
    this.setState({ isLoading: true });

    try {
      await this.loadLocalTranslations();
      await this.loadFromServer();
    } catch (error) {
      this.setState({ error: error as Error });
    }

    this.setState({ isLoading: false });
  }

  /**
   * Refresh translations from server.
   */
  async refresh(): Promise<void> {
    logger.info('Translations: userRequestedRefresh');
    this.setState({ isRefreshing: true });

    try {
      await this.loadFromServer();
    } catch (error) {
      this.setState({ error: error as Error });
    }

    this.setState({ isRefreshing: false });
  }

  /**
   * Move selected translations.
   */
  moveSelectedTranslations(fromIndex: number, toIndex: number): void {
    const ids = [...this.selectedTranslationIds];
    const [removed] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, removed);
    this.selectedTranslationIds = ids;
    this.selectedTranslationsPreferences.selectedTranslationIds = ids;
    this.updateComputedLists();
  }

  /**
   * Select a translation.
   */
  async selectTranslation(item: TranslationItem): Promise<void> {
    this.selectedTranslationsPreferences.select(item.info.id);
    this.selectedTranslationIds = [...this.selectedTranslationsPreferences.selectedTranslationIds];
    logger.info(`Translations: translation ${item.info.id} selected`);
    this.updateComputedLists();
  }

  /**
   * Deselect a translation.
   */
  async deselectTranslation(item: TranslationItem): Promise<void> {
    this.selectedTranslationsPreferences.deselect(item.info.id);
    this.selectedTranslationIds = [...this.selectedTranslationsPreferences.selectedTranslationIds];
    logger.info(`Translations: translation ${item.info.id} deselected`);
    this.updateComputedLists();
  }

  /**
   * Start downloading a translation.
   */
  async startDownloading(item: TranslationItem): Promise<void> {
    const translation = item.info;
    logger.info(`Translations: start downloading translation ${translation.id}`);

    this.analytics.logEvent('TranslationsDownloadingId', translation.id.toString());
    this.analytics.logEvent('TranslationsDownloadingName', translation.displayName);
    this.analytics.logEvent('TranslationsDownloadingLanguage', translation.languageCode);

    this.progress.set(translation.id, 0);
    this.updateComputedLists();

    try {
      await this.downloader.download(translation, (progress: number) => {
        this.progress.set(translation.id, progress);
        this.updateComputedLists();
      });

      // Download complete
      this.progress.delete(translation.id);

      // Reload local translations
      await this.loadLocalTranslations();

      // Select newly downloaded translation
      this.selectedTranslationsPreferences.select(translation.id);
      this.selectedTranslationIds = [...this.selectedTranslationsPreferences.selectedTranslationIds];
      this.updateComputedLists();
    } catch (error) {
      this.progress.delete(translation.id);
      this.updateComputedLists();
      crasher.recordError(error as Error, 'Failed to start the translation download');
      this.setState({ error: error as Error });
    }
  }

  /**
   * Cancel downloading a translation.
   */
  async cancelDownloading(item: TranslationItem): Promise<void> {
    const translation = item.info;
    logger.info(`Translations: cancel downloading ${translation.id}`);

    // Cancel via downloader
    await this.downloader.cancel(translation);

    this.progress.delete(translation.id);
    this.updateComputedLists();
  }

  /**
   * Delete a translation.
   */
  async deleteTranslation(item: TranslationItem): Promise<void> {
    logger.info(`Translations: deleting translation ${item.info.id}`);

    this.analytics.logEvent('TranslationsDeletionId', item.info.id.toString());
    this.analytics.logEvent('TranslationsDeletionName', item.info.displayName);
    this.analytics.logEvent('TranslationsDeletionLanguage', item.info.languageCode);

    // Cancel any ongoing download
    await this.cancelDownloading(item);

    try {
      const updatedTranslation = await this.deleter.deleteTranslation(item.info);

      // Replace existing translation
      const index = this.translations.findIndex((t) => t.id === item.info.id);
      if (index !== -1) {
        this.translations[index] = updatedTranslation;
      }

      // Deselect if selected
      this.selectedTranslationsPreferences.deselect(item.info.id);
      this.selectedTranslationIds = [...this.selectedTranslationsPreferences.selectedTranslationIds];

      this.updateComputedLists();
    } catch (error) {
      crasher.recordError(error as Error, `Failed to delete translation ${item.info.id}`);
      this.setState({ error: error as Error });
    }
  }

  /**
   * Toggle edit mode.
   */
  toggleEditMode(): void {
    this.setState({ isEditing: !this._state.isEditing });
  }

  /**
   * Set edit mode.
   */
  setEditMode(isEditing: boolean): void {
    this.setState({ isEditing });
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

  /**
   * Load translations from local database.
   */
  private async loadLocalTranslations(): Promise<void> {
    const translations = await this.localTranslationsRetriever.getLocalTranslations();
    this.translations = translations;
    this.updateComputedLists();
  }

  /**
   * Load translations from server.
   */
  private async loadFromServer(): Promise<void> {
    await this.translationsRepository.downloadAndSyncTranslations();
    await this.loadLocalTranslations();
  }
}

