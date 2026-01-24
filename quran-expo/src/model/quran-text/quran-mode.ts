/**
 * QuranMode.swift → quran-mode.ts
 *
 * Quran display mode (Arabic only vs with translations).
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Display mode for Quran content.
 */
export enum QuranMode {
  /** Arabic text only */
  Arabic = 'arabic',
  /** Arabic text with translations */
  Translation = 'translation',
}

/**
 * Gets a description for a Quran mode.
 */
export function quranModeDescription(mode: QuranMode): string {
  switch (mode) {
    case QuranMode.Arabic:
      return 'Arabic';
    case QuranMode.Translation:
      return 'Translation';
  }
}

/**
 * Toggles between Arabic and Translation modes.
 */
export function toggleQuranMode(mode: QuranMode): QuranMode {
  return mode === QuranMode.Arabic ? QuranMode.Translation : QuranMode.Arabic;
}

// Lowercase aliases for compatibility
export namespace QuranMode {
  export const arabic = QuranMode.Arabic;
  export const translation = QuranMode.Translation;
}

