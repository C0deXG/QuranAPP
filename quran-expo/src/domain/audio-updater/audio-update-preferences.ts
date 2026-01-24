/**
 * AudioUpdatePreferences.swift → audio-update-preferences.ts
 *
 * Preferences for audio updates.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey, Preferences } from '../../core/preferences';

// ============================================================================
// Preference Keys
// ============================================================================

const lastRevisionKey = new PreferenceKey<number>(
  'audio-update.last-revision',
  0
);

const lastCheckedKey = new PreferenceKey<number | null>(
  'audio-update.last-checked',
  null
);

// ============================================================================
// AudioUpdatePreferences
// ============================================================================

/**
 * Preferences for audio updates.
 */
class AudioUpdatePreferencesImpl {
  private static _instance: AudioUpdatePreferencesImpl | null = null;

  static get shared(): AudioUpdatePreferencesImpl {
    if (!AudioUpdatePreferencesImpl._instance) {
      AudioUpdatePreferencesImpl._instance = new AudioUpdatePreferencesImpl();
    }
    return AudioUpdatePreferencesImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the last revision number.
   */
  get lastRevision(): number {
    return Preferences.shared.get(lastRevisionKey);
  }

  /**
   * Sets the last revision number.
   */
  set lastRevision(value: number) {
    Preferences.shared.set(lastRevisionKey, value);
  }

  /**
   * Gets the last checked date (as timestamp).
   */
  get lastChecked(): Date | null {
    const timestamp = Preferences.shared.get(lastCheckedKey);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Sets the last checked date.
   */
  set lastChecked(value: Date | null) {
    Preferences.shared.set(lastCheckedKey, value?.getTime() ?? null);
  }

  /**
   * Resets preferences to defaults.
   */
  reset(): void {
    Preferences.shared.removeValueForKey(lastRevisionKey.key);
    Preferences.shared.removeValueForKey(lastCheckedKey.key);
  }
}

export const AudioUpdatePreferences = AudioUpdatePreferencesImpl;

