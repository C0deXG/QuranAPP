/**
 * AudioEnd.swift → audio-end.ts
 *
 * Audio playback ending scope.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Determines where audio playback ends.
 */
export enum AudioEnd {
  /** End at the end of the sura */
  Sura = 0,
  /** End at the end of the juz */
  Juz = 1,
  /** End at the end of the page */
  Page = 2,
}

/**
 * Gets a description for an AudioEnd.
 */
export function audioEndDescription(audioEnd: AudioEnd): string {
  switch (audioEnd) {
    case AudioEnd.Sura:
      return 'Sura';
    case AudioEnd.Juz:
      return 'Juz';
    case AudioEnd.Page:
      return 'Page';
  }
}

/**
 * All AudioEnd options.
 */
export const ALL_AUDIO_ENDS: readonly AudioEnd[] = [
  AudioEnd.Sura,
  AudioEnd.Juz,
  AudioEnd.Page,
];

// Lowercase aliases for compatibility
export namespace AudioEnd {
  export const sura = AudioEnd.Sura;
  export const juz = AudioEnd.Juz;
  export const page = AudioEnd.Page;
}

