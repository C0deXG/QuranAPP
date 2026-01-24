/**
 * ActiveTranslationsPersistence.swift → active-translations-persistence.ts
 *
 * Interface and implementation for managing active translations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import {
  DatabaseConnection,
  DatabaseMigrator,
  getDatabasePath,
} from '../sqlite-persistence';
import type { Translation } from '../../model/quran-text';
import { createTranslation } from '../../model/quran-text';
import { logger } from '../../core/logging';

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for managing active/downloaded translations.
 */
export interface ActiveTranslationsPersistence {
  /**
   * Retrieves all active translations.
   */
  retrieveAll(): Promise<Translation[]>;

  /**
   * Inserts a new translation.
   */
  insert(translation: Translation): Promise<void>;

  /**
   * Removes a translation.
   */
  remove(translation: Translation): Promise<void>;

  /**
   * Updates an existing translation.
   */
  update(translation: Translation): Promise<void>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

/**
 * Table name for translations.
 */
const TABLE_NAME = 'translations';

/**
 * Column definitions.
 */
const Columns = {
  id: '_ID',
  displayName: 'name',
  translator: 'translator',
  translatorForeign: 'translator_foreign',
  fileURL: 'fileURL',
  fileName: 'filename',
  languageCode: 'languageCode',
  version: 'version',
  installedVersion: 'installedVersion',
} as const;

/**
 * Row type from database.
 */
interface TranslationRow {
  _ID: number;
  name: string;
  translator: string | null;
  translator_foreign: string | null;
  fileURL: string;
  filename: string;
  languageCode: string;
  version: number;
  installedVersion: number | null;
}

/**
 * SQLite implementation of ActiveTranslationsPersistence.
 */
export class SQLiteActiveTranslationsPersistence
  implements ActiveTranslationsPersistence
{
  private readonly db: DatabaseConnection;
  private initialized = false;

  /**
   * Creates persistence from a database connection.
   */
  constructor(connection: DatabaseConnection) {
    this.db = connection;
  }

  /**
   * Creates persistence for a directory.
   */
  static fromDirectory(directoryPath: string): SQLiteActiveTranslationsPersistence {
    const dbPath = `${directoryPath}/translations.db`;
    return new SQLiteActiveTranslationsPersistence(
      new DatabaseConnection(dbPath, false) // writable
    );
  }

  /**
   * Creates persistence using the default database path.
   */
  static createDefault(): SQLiteActiveTranslationsPersistence {
    return SQLiteActiveTranslationsPersistence.fromDirectory(
      getDatabasePath('')
    );
  }

  async retrieveAll(): Promise<Translation[]> {
    await this.ensureInitialized();

    return this.db.read(async (executeSql) => {
      const result = await executeSql(`SELECT * FROM ${TABLE_NAME}`);
      return result.rows.map((row) => this.rowToTranslation(row as TranslationRow));
    });
  }

  async insert(translation: Translation): Promise<void> {
    await this.ensureInitialized();

    await this.db.write(async (executeSql) => {
      await executeSql(
        `INSERT INTO ${TABLE_NAME} (
          ${Columns.id},
          ${Columns.displayName},
          ${Columns.translator},
          ${Columns.translatorForeign},
          ${Columns.fileURL},
          ${Columns.fileName},
          ${Columns.languageCode},
          ${Columns.version},
          ${Columns.installedVersion}
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          translation.id,
          translation.displayName,
          translation.translator ?? null,
          translation.translatorForeign ?? null,
          translation.fileURL,
          translation.fileName,
          translation.languageCode,
          translation.version,
          translation.installedVersion ?? null,
        ]
      );
    });
  }

  async remove(translation: Translation): Promise<void> {
    await this.ensureInitialized();

    await this.db.write(async (executeSql) => {
      await executeSql(`DELETE FROM ${TABLE_NAME} WHERE ${Columns.id} = ?`, [
        translation.id,
      ]);
    });
  }

  async update(translation: Translation): Promise<void> {
    await this.ensureInitialized();

    await this.db.write(async (executeSql) => {
      await executeSql(
        `UPDATE ${TABLE_NAME} SET
          ${Columns.displayName} = ?,
          ${Columns.translator} = ?,
          ${Columns.translatorForeign} = ?,
          ${Columns.fileURL} = ?,
          ${Columns.fileName} = ?,
          ${Columns.languageCode} = ?,
          ${Columns.version} = ?,
          ${Columns.installedVersion} = ?
        WHERE ${Columns.id} = ?`,
        [
          translation.displayName,
          translation.translator ?? null,
          translation.translatorForeign ?? null,
          translation.fileURL,
          translation.fileName,
          translation.languageCode,
          translation.version,
          translation.installedVersion ?? null,
          translation.id,
        ]
      );
    });
  }

  /**
   * Closes the database connection.
   */
  async close(): Promise<void> {
    await this.db.close();
  }

  // ============================================================================
  // Private
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const migrator = new DatabaseMigrator();

      migrator.registerMigration({
        version: 1,
        migrate: async (executeSql) => {
          await executeSql(`
            CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
              ${Columns.id} INTEGER PRIMARY KEY,
              ${Columns.displayName} TEXT NOT NULL,
              ${Columns.translator} TEXT,
              ${Columns.translatorForeign} TEXT,
              ${Columns.fileURL} TEXT NOT NULL,
              ${Columns.fileName} TEXT NOT NULL,
              ${Columns.languageCode} TEXT NOT NULL,
              ${Columns.version} INTEGER NOT NULL,
              ${Columns.installedVersion} INTEGER
            )
          `);
        },
      });

      await migrator.migrate(this.db);
      this.initialized = true;
    } catch (error) {
      logger.error(
        `Error while performing Translations migrations. Error: ${error}`,
        'ActiveTranslationsPersistence'
      );
      throw error;
    }
  }

  private rowToTranslation(row: TranslationRow): Translation {
    return createTranslation({
      id: row._ID,
      displayName: row.name,
      translator: row.translator ?? undefined,
      translatorForeign: row.translator_foreign ?? undefined,
      fileURL: row.fileURL,
      fileName: row.filename,
      languageCode: row.languageCode,
      version: row.version,
      installedVersion: row.installedVersion ?? undefined,
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an active translations persistence for a directory.
 */
export function createActiveTranslationsPersistence(
  directoryPath: string
): ActiveTranslationsPersistence {
  return SQLiteActiveTranslationsPersistence.fromDirectory(directoryPath);
}

