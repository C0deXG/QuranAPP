/**
 * WordTextType.swift → word-text-type.ts
 *
 * Type of word-by-word text to display.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Type of text to show for word-by-word display.
 */
export enum WordTextType {
  /** Word translation (meaning) */
  Translation = 0,
  /** Word transliteration (pronunciation) */
  Transliteration = 1,
}

/**
 * Gets a description for a word text type.
 */
export function wordTextTypeDescription(type: WordTextType): string {
  switch (type) {
    case WordTextType.Translation:
      return 'Translation';
    case WordTextType.Transliteration:
      return 'Transliteration';
  }
}

/**
 * Toggles between Translation and Transliteration.
 */
export function toggleWordTextType(type: WordTextType): WordTextType {
  return type === WordTextType.Translation
    ? WordTextType.Transliteration
    : WordTextType.Translation;
}

// Lowercase aliases for compatibility
export namespace WordTextType {
  export const translation = WordTextType.Translation;
  export const transliteration = WordTextType.Transliteration;
}

