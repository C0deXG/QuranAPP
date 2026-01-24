/**
 * ReciterListViewModel.swift → reciter-list-view-model.ts
 *
 * View model for the Reciter List screen.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import type { Reciter } from '../../model/quran-audio';
import {
  ReciterDataRetriever,
  RecentRecitersService,
  DownloadedRecitersService,
  ReciterPreferences,
} from '../../domain/reciter-service';

// ============================================================================
// ReciterListListener
// ============================================================================

/**
 * Listener for reciter selection changes.
 *
 * 1:1 translation of iOS ReciterListListener.
 */
export interface ReciterListListener {
  onSelectedReciterChanged(reciter: Reciter): void;
}

// ============================================================================
// ReciterListViewState
// ============================================================================

/**
 * State for the Reciter List view.
 */
export interface ReciterListViewState {
  isLoading: boolean;
  recentReciters: Reciter[];
  downloadedReciters: Reciter[];
  englishReciters: Reciter[];
  arabicReciters: Reciter[];
  selectedReciter: Reciter | null;
}

/**
 * Initial state for the Reciter List view.
 */
export const initialReciterListViewState: ReciterListViewState = {
  isLoading: true,
  recentReciters: [],
  downloadedReciters: [],
  englishReciters: [],
  arabicReciters: [],
  selectedReciter: null,
};

// ============================================================================
// ReciterListViewModel
// ============================================================================

/**
 * View model for the Reciter List screen.
 *
 * 1:1 translation of iOS ReciterListViewModel.
 */
export class ReciterListViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  readonly standalone: boolean;
  listener: ReciterListListener | null = null;

  private readonly reciterRetriever = new ReciterDataRetriever();
  private readonly recentRecitersService = new RecentRecitersService();
  private readonly downloadedRecitersService = new DownloadedRecitersService();
  private readonly preferences = ReciterPreferences.shared;

  /** Current state */
  private _state: ReciterListViewState = { ...initialReciterListViewState };

  /** State change listeners */
  private stateListeners: ((state: ReciterListViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(standalone: boolean) {
    this.standalone = standalone;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): ReciterListViewState {
    return this._state;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: ReciterListViewState) => void): void {
    this.stateListeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: ReciterListViewState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<ReciterListViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.stateListeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start loading reciters.
   */
  async start(): Promise<void> {
    logger.info('Reciters: loading reciters');
    this.setState({ isLoading: true });

    const allReciters = await this.reciterRetriever.getReciters();
    logger.info('Reciters: reciters loaded');

    const recentReciters = this.recentRecitersService.recentReciters(allReciters);
    const downloadedReciters = await this.downloadedRecitersService.downloadedReciters(allReciters);

    const englishReciters = allReciters.filter((r) => r.category !== 'arabic');
    const arabicReciters = allReciters.filter((r) => r.category === 'arabic');

    const selectedReciterId = this.preferences.lastSelectedReciterId;
    const selectedReciter = allReciters.find((r) => r.id === selectedReciterId) ?? null;

    this.setState({
      isLoading: false,
      recentReciters,
      downloadedReciters,
      englishReciters,
      arabicReciters,
      selectedReciter,
    });
  }

  /**
   * Select a reciter.
   */
  selectReciter(reciter: Reciter): void {
    logger.info(`Reciters: reciter selected ${reciter.id}`);
    this.listener?.onSelectedReciterChanged(reciter);
  }
}

