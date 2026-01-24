/**
 * WordTextService.swift → word-text-service.ts
 *
 * Service for retrieving word-by-word text.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { WordTextPersistence } from '../../data/word-text-persistence';
import { SQLiteWordTextPersistence } from '../../data/word-text-persistence';
import type { IWord } from '../../model/quran-kit/types';
import { WordTextType } from '../../model/quran-text';
import { WordTextPreferences } from './word-text-preferences';

// ============================================================================
// WordTextService
// ============================================================================

/**
 * Service for retrieving word-by-word translation or transliteration.
 */
export class WordTextService {
  private readonly persistence: WordTextPersistence;

  constructor(databasePath: string) {
    this.persistence = SQLiteWordTextPersistence.fromPath(databasePath);
  }

  /**
   * Gets the text for a word based on user preferences.
   * Returns translation or transliteration depending on the preference.
   */
  async textForWord(word: IWord): Promise<string | null> {
    const textType = WordTextPreferences.shared.wordTextType;

    switch (textType) {
      case WordTextType.translation:
        return this.persistence.translationForWord(word);
      case WordTextType.transliteration:
        return this.persistence.transliterationForWord(word);
      default:
        return this.persistence.translationForWord(word);
    }
  }

  /**
   * Gets the translation for a word (ignoring preference).
   */
  async translationForWord(word: IWord): Promise<string | null> {
    return this.persistence.translationForWord(word);
  }

  /**
   * Gets the transliteration for a word (ignoring preference).
   */
  async transliterationForWord(word: IWord): Promise<string | null> {
    return this.persistence.transliterationForWord(word);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a word text service.
 */
export function createWordTextService(databasePath: string): WordTextService {
  return new WordTextService(databasePath);
}

