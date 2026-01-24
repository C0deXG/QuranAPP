/**
 * AudioPreferences.swift → audio-preferences.ts
 *
 * Audio playback preferences.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey, Preferences } from '../../../core/preferences';
import { AudioEnd } from '../../../model/quran-audio';

// ============================================================================
// Preference Keys
// ============================================================================

const audioEndKey = new PreferenceKey<number>(
  'audioEndKey',
  AudioEnd.juz
);

const audioPlaybackRateKey = new PreferenceKey<number>(
  'audio.playbackRate',
  1.0
);

// ============================================================================
// AudioPreferences
// ============================================================================

/**
 * Audio playback preferences.
 */
class AudioPreferencesImpl {
  private static _instance: AudioPreferencesImpl | null = null;

  static get shared(): AudioPreferencesImpl {
    if (!AudioPreferencesImpl._instance) {
      AudioPreferencesImpl._instance = new AudioPreferencesImpl();
    }
    return AudioPreferencesImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the audio end preference (juz, sura, or page).
   */
  get audioEnd(): AudioEnd {
    const raw = Preferences.shared.get(audioEndKey);
    if (Object.values(AudioEnd).includes(raw as AudioEnd)) {
      return raw as AudioEnd;
    }
    return AudioEnd.juz;
  }

  /**
   * Sets the audio end preference.
   */
  set audioEnd(value: AudioEnd) {
    Preferences.shared.set(audioEndKey, value);
  }

  /**
   * Gets the playback rate.
   */
  get playbackRate(): number {
    return Preferences.shared.get(audioPlaybackRateKey);
  }

  /**
   * Sets the playback rate.
   */
  set playbackRate(value: number) {
    Preferences.shared.set(audioPlaybackRateKey, value);
  }
}

export const AudioPreferences = AudioPreferencesImpl;

