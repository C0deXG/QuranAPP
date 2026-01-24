/**
 * DiagnosticsService.swift (DiagnosticsPreferences) → diagnostics-preferences.ts
 *
 * Preferences for diagnostics.
 *
 * Quran.com. All rights reserved.
 */

import { PreferenceKey } from '../../../core/preferences';
import { Preferences } from '../../../core/preferences';

// ============================================================================
// Preference Keys
// ============================================================================

const enableDebugLoggingKey = new PreferenceKey<boolean>('enableDebugLogging', false);

// ============================================================================
// DiagnosticsPreferences
// ============================================================================

/**
 * Singleton for diagnostics preferences.
 *
 * 1:1 translation of iOS DiagnosticsPreferences.
 */
export class DiagnosticsPreferences {
  // ============================================================================
  // Singleton
  // ============================================================================

  private static _shared: DiagnosticsPreferences | null = null;

  static get shared(): DiagnosticsPreferences {
    if (!DiagnosticsPreferences._shared) {
      DiagnosticsPreferences._shared = new DiagnosticsPreferences();
    }
    return DiagnosticsPreferences._shared;
  }

  // ============================================================================
  // Properties
  // ============================================================================

  private readonly preferences = Preferences.shared;

  // ============================================================================
  // Public Getters/Setters
  // ============================================================================

  get enableDebugLogging(): boolean {
    return this.preferences.get(enableDebugLoggingKey);
  }

  set enableDebugLogging(value: boolean) {
    this.preferences.set(enableDebugLoggingKey, value);
  }
}

