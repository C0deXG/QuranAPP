/**
 * VerseTextPersistence.swift → verse-text-persistence.ts
 *
 * Interface and implementation for verse text queries.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { DatabaseConnection } from '../sqlite-persistence';
import { PersistenceError } from '../sqlite-persistence/persistence-error';
import type { IAyahNumber, IQuran } from '../../model/quran-kit/types';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Interface for searchable text persistence.
 */
export interface SearchableTextPersistence {
  /**
   * Autocompletes a search term.
   */
  autocomplete(term: string): Promise<string[]>;

  /**
   * Searches for a term and returns matching verses.
   */
  search(
    term: string,
    quran: IQuran,
    createAyah: (sura: number, ayah: number) => IAyahNumber | null
  ): Promise<Array<{ verse: IAyahNumber; text: string }>>;
}

/**
 * Interface for verse text persistence.
 */
export interface VerseTextPersistence extends SearchableTextPersistence {
  /**
   * Gets text for a single verse.
   */
  textForVerse(verse: IAyahNumber): Promise<string>;

  /**
   * Gets text for multiple verses.
   */
  textForVerses(verses: IAyahNumber[]): Promise<Map<string, string>>;
}

/**
 * Translation text can be either a string or a reference to another verse.
 */
export type TranslationTextModel =
  | { type: 'string'; text: string }
  | { type: 'reference'; verse: IAyahNumber };

/**
 * Interface for translation verse text persistence.
 */
export interface TranslationVerseTextPersistence extends SearchableTextPersistence {
  /**
   * Gets text for a single verse.
   */
  textForVerse(
    verse: IAyahNumber,
    quran: IQuran
  ): Promise<TranslationTextModel>;

  /**
   * Gets text for multiple verses.
   */
  textForVerses(
    verses: IAyahNumber[],
    quran: IQuran
  ): Promise<Map<string, TranslationTextModel>>;
}

/**
 * Interface for database version persistence.
 */
export interface DatabaseVersionPersistence {
  /**
   * Gets the text version number from the database.
   */
  getTextVersion(): Promise<number>;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Gets a unique key for an ayah.
 */
export function ayahKey(verse: IAyahNumber): string {
  return `${verse.sura.suraNumber}:${verse.ayah}`;
}

/**
 * Table names for verse text.
 */
export enum VerseTextTable {
  Arabic = 'arabic_text',
  Share = 'share_text',
  Verses = 'verses',
}

// ============================================================================
// SQLite Implementation - Quran Verse Text
// ============================================================================

/**
 * SQLite implementation for Quran (Arabic) verse text.
 */
export class SQLiteQuranVerseTextPersistence implements VerseTextPersistence {
  private readonly db: DatabaseConnection;
  private readonly textTable: string;

  constructor(
    connection: DatabaseConnection,
    mode: 'arabic' | 'share' = 'arabic'
  ) {
    this.db = connection;
    this.textTable = mode === 'arabic' ? VerseTextTable.Arabic : VerseTextTable.Share;
  }

  static fromPath(
    databasePath: string,
    mode: 'arabic' | 'share' = 'arabic'
  ): SQLiteQuranVerseTextPersistence {
    return new SQLiteQuranVerseTextPersistence(
      new DatabaseConnection(databasePath, true),
      mode
    );
  }

  async textForVerse(verse: IAyahNumber): Promise<string> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT text FROM ${this.textTable}
         WHERE (ayah = ? OR ayah = ?) AND (sura = ? OR sura = ?)`,
        [
          verse.ayah,
          String(verse.ayah),
          verse.sura.suraNumber,
          String(verse.sura.suraNumber),
        ]
      );

      if (result.rows.length === 0) {
        throw PersistenceError.general(
          `Cannot find any records for verse '${verse.sura.suraNumber}:${verse.ayah}'`
        );
      }

      return result.rows[0].text as string;
    });
  }

  async textForVerses(verses: IAyahNumber[]): Promise<Map<string, string>> {
    return this.db.read(async (executeSql) => {
      const map = new Map<string, string>();

      for (const verse of verses) {
        const result = await executeSql(
          `SELECT text FROM ${this.textTable}
           WHERE (ayah = ? OR ayah = ?) AND (sura = ? OR sura = ?)`,
          [
            verse.ayah,
            String(verse.ayah),
            verse.sura.suraNumber,
            String(verse.sura.suraNumber),
          ]
        );

        if (result.rows.length > 0) {
          map.set(ayahKey(verse), result.rows[0].text as string);
        }
      }

      return map;
    });
  }

  async autocomplete(term: string): Promise<string[]> {
    return this.db.read(async (executeSql) => {
      // Note: FTS match syntax varies; using LIKE for broader compatibility
      const result = await executeSql(
        `SELECT text FROM verses WHERE text LIKE ? LIMIT 100`,
        [`%${term}%`]
      );

      return result.rows.map((row) => row.text as string);
    });
  }

  async search(
    term: string,
    quran: IQuran,
    createAyah: (sura: number, ayah: number) => IAyahNumber | null
  ): Promise<Array<{ verse: IAyahNumber; text: string }>> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT text, sura, ayah FROM verses WHERE text LIKE ?`,
        [`%${term}%`]
      );

      const results: Array<{ verse: IAyahNumber; text: string }> = [];

      for (const row of result.rows) {
        const verse = createAyah(row.sura as number, row.ayah as number);
        if (verse) {
          results.push({ verse, text: row.text as string });
        }
      }

      return results;
    });
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

// ============================================================================
// SQLite Implementation - Translation Verse Text
// ============================================================================

/**
 * SQLite implementation for translation verse text.
 */
export class SQLiteTranslationVerseTextPersistence
  implements TranslationVerseTextPersistence
{
  private readonly db: DatabaseConnection;
  private readonly filePath: string;

  constructor(connection: DatabaseConnection, filePath: string) {
    this.db = connection;
    this.filePath = filePath;
  }

  static fromPath(databasePath: string): SQLiteTranslationVerseTextPersistence {
    return new SQLiteTranslationVerseTextPersistence(
      new DatabaseConnection(databasePath, true),
      databasePath
    );
  }

  async textForVerse(
    verse: IAyahNumber,
    quran: IQuran
  ): Promise<TranslationTextModel> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT text FROM verses
         WHERE (ayah = ? OR ayah = ?) AND (sura = ? OR sura = ?)`,
        [
          verse.ayah,
          String(verse.ayah),
          verse.sura.suraNumber,
          String(verse.sura.suraNumber),
        ]
      );

      if (result.rows.length === 0) {
        throw PersistenceError.general(
          `Cannot find any records for verse '${verse.sura.suraNumber}:${verse.ayah}'`
        );
      }

      return this.parseTextValue(result.rows[0].text, quran);
    });
  }

  async textForVerses(
    verses: IAyahNumber[],
    quran: IQuran
  ): Promise<Map<string, TranslationTextModel>> {
    return this.db.read(async (executeSql) => {
      const map = new Map<string, TranslationTextModel>();

      for (const verse of verses) {
        const result = await executeSql(
          `SELECT text FROM verses
           WHERE (ayah = ? OR ayah = ?) AND (sura = ? OR sura = ?)`,
          [
            verse.ayah,
            String(verse.ayah),
            verse.sura.suraNumber,
            String(verse.sura.suraNumber),
          ]
        );

        if (result.rows.length > 0) {
          map.set(ayahKey(verse), this.parseTextValue(result.rows[0].text, quran));
        }
      }

      return map;
    });
  }

  async autocomplete(term: string): Promise<string[]> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT text FROM verses WHERE text LIKE ? LIMIT 100`,
        [`%${term}%`]
      );

      return result.rows
        .map((row) => row.text)
        .filter((text): text is string => typeof text === 'string');
    });
  }

  async search(
    term: string,
    quran: IQuran,
    createAyah: (sura: number, ayah: number) => IAyahNumber | null
  ): Promise<Array<{ verse: IAyahNumber; text: string }>> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT text, sura, ayah FROM verses WHERE text LIKE ?`,
        [`%${term}%`]
      );

      const results: Array<{ verse: IAyahNumber; text: string }> = [];

      for (const row of result.rows) {
        const verse = createAyah(row.sura as number, row.ayah as number);
        if (verse && typeof row.text === 'string') {
          results.push({ verse, text: row.text });
        }
      }

      return results;
    });
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  private parseTextValue(value: unknown, quran: IQuran): TranslationTextModel {
    if (typeof value === 'string') {
      // If the data is an integer saved as string, check if it's a valid verse ID
      const verseId = parseInt(value, 10);
      if (!isNaN(verseId) && verseId > 0 && verseId <= quran.verses.length) {
        return this.referenceVerse(verseId, quran);
      }
      return { type: 'string', text: value };
    }

    if (typeof value === 'number') {
      return this.referenceVerse(value, quran);
    }

    throw PersistenceError.general(
      `Text for verse is neither Int nor String. File: ${this.filePath}`
    );
  }

  private referenceVerse(verseId: number, quran: IQuran): TranslationTextModel {
    // VerseId saved is 1-based index
    const verse = quran.verses[verseId - 1];
    return { type: 'reference', verse };
  }
}

// ============================================================================
// SQLite Implementation - Database Version
// ============================================================================

/**
 * SQLite implementation for database version queries.
 */
export class SQLiteDatabaseVersionPersistence implements DatabaseVersionPersistence {
  private readonly db: DatabaseConnection;

  constructor(connection: DatabaseConnection) {
    this.db = connection;
  }

  static fromPath(databasePath: string): SQLiteDatabaseVersionPersistence {
    return new SQLiteDatabaseVersionPersistence(
      new DatabaseConnection(databasePath, true)
    );
  }

  async getTextVersion(): Promise<number> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT value FROM properties WHERE property = ?`,
        ['text_version']
      );

      if (result.rows.length === 0) {
        throw PersistenceError.general('text_version property not found');
      }

      const version = parseInt(result.rows[0].value as string, 10);
      if (isNaN(version)) {
        throw PersistenceError.general('text_version is not a valid integer');
      }

      return version;
    });
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a Quran verse text persistence.
 */
export function createQuranVerseTextPersistence(
  databasePath: string,
  mode: 'arabic' | 'share' = 'arabic'
): VerseTextPersistence {
  return SQLiteQuranVerseTextPersistence.fromPath(databasePath, mode);
}

/**
 * Creates a translation verse text persistence.
 */
export function createTranslationVerseTextPersistence(
  databasePath: string
): TranslationVerseTextPersistence {
  return SQLiteTranslationVerseTextPersistence.fromPath(databasePath);
}

/**
 * Creates a database version persistence.
 */
export function createDatabaseVersionPersistence(
  databasePath: string
): DatabaseVersionPersistence {
  return SQLiteDatabaseVersionPersistence.fromPath(databasePath);
}

