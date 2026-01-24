/**
 * WordTextPersistence.swift → word-text-persistence.ts
 *
 * Interface and implementation for word-by-word text queries.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { DatabaseConnection } from '../sqlite-persistence';
import type { IWord } from '../../model/quran-kit/types';

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for retrieving word-by-word translations and transliterations.
 */
export interface WordTextPersistence {
  /**
   * Gets the translation for a specific word.
   */
  translationForWord(word: IWord): Promise<string | null>;

  /**
   * Gets the transliteration for a specific word.
   */
  transliterationForWord(word: IWord): Promise<string | null>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

/**
 * Table name.
 */
const TABLE_NAME = 'words';

/**
 * Column names for words table.
 */
const WordColumns = {
  word: 'word_position',
  translation: 'translation',
  transliteration: 'transliteration',
  sura: 'sura',
  ayah: 'ayah',
} as const;

/**
 * Row type for words table.
 */
interface WordRow {
  word_position: number;
  translation: string | null;
  transliteration: string | null;
  sura: number;
  ayah: number;
}

/**
 * SQLite implementation of WordTextPersistence.
 */
export class SQLiteWordTextPersistence implements WordTextPersistence {
  private readonly db: DatabaseConnection;

  constructor(connection: DatabaseConnection) {
    this.db = connection;
  }

  static fromPath(databasePath: string): SQLiteWordTextPersistence {
    return new SQLiteWordTextPersistence(
      new DatabaseConnection(databasePath, true) // readonly
    );
  }

  async translationForWord(word: IWord): Promise<string | null> {
    const wordRow = await this.wordText(word);
    return wordRow?.translation ?? null;
  }

  async transliterationForWord(word: IWord): Promise<string | null> {
    const wordRow = await this.wordText(word);
    return wordRow?.transliteration ?? null;
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  /**
   * Fetches word text data for a specific word.
   */
  private async wordText(word: IWord): Promise<WordRow | null> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT * FROM ${TABLE_NAME} 
         WHERE ${WordColumns.sura} = ? 
           AND ${WordColumns.ayah} = ? 
           AND ${WordColumns.word} = ?`,
        [word.verse.sura.suraNumber, word.verse.ayah, word.wordNumber]
      );

      const rows = result.rows as WordRow[];
      return rows.length > 0 ? rows[0] : null;
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a word text persistence.
 */
export function createWordTextPersistence(
  databasePath: string
): WordTextPersistence {
  return SQLiteWordTextPersistence.fromPath(databasePath);
}

