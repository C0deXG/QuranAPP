/**
 * DiagnosticsViewModel.swift → diagnostics-view-model.ts
 *
 * View model for the Diagnostics screen.
 *
 * Quran.com. All rights reserved.
 */

import { Share } from 'react-native';
import { DiagnosticsPreferences } from './diagnostics-preferences';
import { DiagnosticsService } from './diagnostics-service';

// ============================================================================
// DiagnosticsViewState
// ============================================================================

/**
 * State for the Diagnostics view.
 */
export interface DiagnosticsViewState {
  enableDebugLogging: boolean;
  isSharing: boolean;
  error: Error | null;
}

/**
 * Initial state for the Diagnostics view.
 */
export const initialDiagnosticsViewState: DiagnosticsViewState = {
  enableDebugLogging: DiagnosticsPreferences.shared.enableDebugLogging,
  isSharing: false,
  error: null,
};

// ============================================================================
// DiagnosticsViewModel
// ============================================================================

/**
 * View model for the Diagnostics screen.
 *
 * 1:1 translation of iOS DiagnosticsViewModel.
 */
export class DiagnosticsViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly diagnosticsService: DiagnosticsService;

  /** Current state */
  private _state: DiagnosticsViewState = { ...initialDiagnosticsViewState };

  /** State change listeners */
  private listeners: ((state: DiagnosticsViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(diagnosticsService: DiagnosticsService) {
    this.diagnosticsService = diagnosticsService;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): DiagnosticsViewState {
    return this._state;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: DiagnosticsViewState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: DiagnosticsViewState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<DiagnosticsViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Toggle debug logging.
   */
  setEnableDebugLogging(value: boolean): void {
    DiagnosticsPreferences.shared.enableDebugLogging = value;
    this.setState({ enableDebugLogging: value });
  }

  /**
   * Share logs.
   */
  async shareLogs(): Promise<void> {
    this.setState({ isSharing: true, error: null });

    try {
      const content = await this.diagnosticsService.getDiagnosticsContent();
      await Share.share({
        message: content,
        title: 'Quran App Diagnostics',
      });
      this.setState({ isSharing: false });
    } catch (error) {
      this.setState({ isSharing: false, error: error as Error });
    }
  }

  /**
   * Clear error.
   */
  clearError(): void {
    this.setState({ error: null });
  }
}

