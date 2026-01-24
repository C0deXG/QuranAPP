/**
 * AudioEnd+Localization.swift → audio-end-localization.ts
 *
 * Localization for AudioEnd enum.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { AudioEnd } from '../../../model/quran-audio';
import { l } from '../../../core/localization';

// ============================================================================
// AudioEnd Localization
// ============================================================================

/**
 * Gets the localized name for an AudioEnd value.
 */
export function getAudioEndName(audioEnd: AudioEnd): string {
  switch (audioEnd) {
    case AudioEnd.juz:
      return l('quran_juz2', 'android');
    case AudioEnd.sura:
      return l('quran_sura', 'android');
    case AudioEnd.page:
      return l('quran_page', 'android');
    default:
      return '';
  }
}

/**
 * Gets all audio end options with their localized names.
 */
export function getAllAudioEndOptions(): Array<{ value: AudioEnd; name: string }> {
  return [
    { value: AudioEnd.juz, name: getAudioEndName(AudioEnd.juz) },
    { value: AudioEnd.sura, name: getAudioEndName(AudioEnd.sura) },
    { value: AudioEnd.page, name: getAudioEndName(AudioEnd.page) },
  ];
}

/**
 * Alias for getAudioEndName for compatibility.
 */
export const getAudioEndLocalizedName = getAudioEndName;

