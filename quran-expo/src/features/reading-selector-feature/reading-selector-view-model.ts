/**
 * ReadingSelectorViewModel.swift → reading-selector-view-model.ts
 *
 * View model for the Reading Selector screen.
 *
 * Quran.com. All rights reserved.
 */

import { Reading, SORTED_READINGS } from '../../model/quran-kit';
import { ReadingPreferences, type ReadingResourcesService } from '../../domain/reading-service';
import type { ReadingInfo } from './reading-info';
import { createReadingInfo } from './reading-info';

// ============================================================================
// ReadingSelectorViewState
// ============================================================================

/**
 * State for the Reading Selector view.
 */
export interface ReadingSelectorViewState {
  selectedReading: Reading | null;
  progress: number | null;
  error: Error | null;
  readings: ReadingInfo<Reading>[];
}

/**
 * Initial state for the Reading Selector view.
 */
export const initialReadingSelectorViewState: ReadingSelectorViewState = {
  selectedReading: null,
  progress: null,
  error: null,
  readings: SORTED_READINGS.map(createReadingInfo),
};

// ============================================================================
// ReadingSelectorViewModel
// ============================================================================

/**
 * View model for the Reading Selector screen.
 *
 * 1:1 translation of iOS ReadingSelectorViewModel.
 */
export class ReadingSelectorViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly preferences = ReadingPreferences.shared;
  private readonly resources: ReadingResourcesService;

  /** Current state */
  private _state: ReadingSelectorViewState = { ...initialReadingSelectorViewState };

  /** State change listeners */
  private listeners: ((state: ReadingSelectorViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(resources: ReadingResourcesService) {
    this.resources = resources;
    this._state.selectedReading = this.preferences.reading;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): ReadingSelectorViewState {
    return this._state;
  }

  get readings(): ReadingInfo<Reading>[] {
    return this._state.readings;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: ReadingSelectorViewState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: ReadingSelectorViewState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<ReadingSelectorViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start the view model.
   */
  async start(): Promise<void> {
    // Listen to reading changes
    this.preferences.addListener('reading', (reading: Reading) => {
      this.setState({ selectedReading: reading });
    });

    // Listen to resource events
    this.resources.addStatusListener((status: { type: string; progress?: number; error?: Error }) => {
      switch (status.type) {
        case 'downloading':
          this.setState({ progress: status.progress, error: null });
          break;
        case 'error':
          this.setState({ progress: null, error: status.error });
          break;
        case 'ready':
          this.setState({ progress: null, error: null });
          break;
      }
    });
  }

  /**
   * Show/select a reading.
   */
  showReading(reading: Reading): void {
    this.preferences.reading = reading;
  }

  /**
   * Clear error.
   */
  clearError(): void {
    this.setState({ error: null });
  }
}

