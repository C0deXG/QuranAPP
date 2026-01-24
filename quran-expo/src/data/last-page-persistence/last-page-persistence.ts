/**
 * LastPagePersistence.swift → last-page-persistence.ts
 *
 * Interface and implementation for last page tracking.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { AnnotationsDatabase } from '../core-data-persistence';
import {
  TableNames,
  LastPageColumns,
  LastPageRow,
  dateToString,
  stringToDate,
} from '../core-data-model';
import { DatabasePublisher, createDatabasePublisher } from '../core-data-persistence/database-publisher';

// ============================================================================
// Model
// ============================================================================

/**
 * Persistence model for last page.
 */
export interface LastPagePersistenceModel {
  readonly page: number;
  readonly createdOn: Date;
  readonly modifiedOn: Date;
}

/**
 * Creates a LastPagePersistenceModel.
 */
export function createLastPagePersistenceModel(params: {
  page: number;
  createdOn: Date;
  modifiedOn: Date;
}): LastPagePersistenceModel {
  return {
    page: params.page,
    createdOn: params.createdOn,
    modifiedOn: params.modifiedOn,
  };
}

/**
 * Converts a database row to a persistence model.
 */
function rowToModel(row: LastPageRow): LastPagePersistenceModel {
  return createLastPagePersistenceModel({
    page: row[LastPageColumns.page],
    createdOn: stringToDate(row[LastPageColumns.createdOn]),
    modifiedOn: stringToDate(row[LastPageColumns.modifiedOn]),
  });
}

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for last page persistence operations.
 */
export interface LastPagePersistence {
  /**
   * Observes last pages, returning a publisher that emits on changes.
   */
  lastPages(): DatabasePublisher<LastPagePersistenceModel[]>;

  /**
   * Retrieves all last pages.
   */
  retrieveAll(): Promise<LastPagePersistenceModel[]>;

  /**
   * Adds a new last page.
   */
  add(page: number): Promise<LastPagePersistenceModel>;

  /**
   * Updates an existing last page to a new page.
   */
  update(page: number, toPage: number): Promise<LastPagePersistenceModel>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

/** Maximum number of last pages to keep. */
const MAX_NUMBER_OF_LAST_PAGES = 3;

/**
 * SQLite implementation of LastPagePersistence.
 */
export class SQLiteLastPagePersistence implements LastPagePersistence {
  private readonly db: AnnotationsDatabase;

  constructor(database: AnnotationsDatabase) {
    this.db = database;
  }

  lastPages(): DatabasePublisher<LastPagePersistenceModel[]> {
    return createDatabasePublisher(
      this.db,
      TableNames.lastPage,
      async () => this.fetchLastPages()
    );
  }

  async retrieveAll(): Promise<LastPagePersistenceModel[]> {
    return this.fetchLastPages();
  }

  async add(page: number): Promise<LastPagePersistenceModel> {
    return this.db.write(async (executeSql) => {
      // Delete if exists (to update timestamps)
      await this.deletePage(page, executeSql);

      // Insert new page
      const now = new Date();
      await executeSql(
        `INSERT INTO ${TableNames.lastPage} 
         (${LastPageColumns.page}, ${LastPageColumns.createdOn}, ${LastPageColumns.modifiedOn})
         VALUES (?, ?, ?)`,
        [page, dateToString(now), dateToString(now)]
      );

      // Remove overflow
      await this.removeOverflowIfNeeded(executeSql);

      return createLastPagePersistenceModel({
        page,
        createdOn: now,
        modifiedOn: now,
      });
    });
  }

  async update(page: number, toPage: number): Promise<LastPagePersistenceModel> {
    return this.db.write(async (executeSql) => {
      // Delete the target page if it exists
      await this.deletePage(toPage, executeSql);

      // Get existing page
      const result = await executeSql(
        `SELECT * FROM ${TableNames.lastPage} 
         WHERE ${LastPageColumns.page} = ?`,
        [page]
      );

      const rows = result.rows as LastPageRow[];

      // If no existing page, insert new one
      if (rows.length === 0) {
        const now = new Date();
        await executeSql(
          `INSERT INTO ${TableNames.lastPage} 
           (${LastPageColumns.page}, ${LastPageColumns.createdOn}, ${LastPageColumns.modifiedOn})
           VALUES (?, ?, ?)`,
          [toPage, dateToString(now), dateToString(now)]
        );

        await this.removeOverflowIfNeeded(executeSql);

        return createLastPagePersistenceModel({
          page: toPage,
          createdOn: now,
          modifiedOn: now,
        });
      }

      // Update existing page
      const existingRow = rows[0];
      const now = new Date();
      await executeSql(
        `UPDATE ${TableNames.lastPage} 
         SET ${LastPageColumns.page} = ?, ${LastPageColumns.modifiedOn} = ?
         WHERE ${LastPageColumns.id} = ?`,
        [toPage, dateToString(now), existingRow[LastPageColumns.id]]
      );

      return createLastPagePersistenceModel({
        page: toPage,
        createdOn: stringToDate(existingRow[LastPageColumns.createdOn]),
        modifiedOn: now,
      });
    });
  }

  // MARK: - Private

  private async fetchLastPages(): Promise<LastPagePersistenceModel[]> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT * FROM ${TableNames.lastPage} 
         ORDER BY ${LastPageColumns.modifiedOn} DESC
         LIMIT ?`,
        [MAX_NUMBER_OF_LAST_PAGES]
      );

      const rows = result.rows as LastPageRow[];
      return rows.map(rowToModel);
    });
  }

  private async deletePage(
    page: number,
    executeSql: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>
  ): Promise<void> {
    await executeSql(
      `DELETE FROM ${TableNames.lastPage} WHERE ${LastPageColumns.page} = ?`,
      [page]
    );
  }

  private async removeOverflowIfNeeded(
    executeSql: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>
  ): Promise<void> {
    // Get all pages ordered by modified date
    const result = await executeSql(
      `SELECT ${LastPageColumns.id} FROM ${TableNames.lastPage} 
       ORDER BY ${LastPageColumns.modifiedOn} DESC`,
      []
    );

    const rows = result.rows as Array<{ [LastPageColumns.id]: number }>;

    // Delete overflow pages
    if (rows.length > MAX_NUMBER_OF_LAST_PAGES) {
      const idsToDelete = rows
        .slice(MAX_NUMBER_OF_LAST_PAGES)
        .map((r) => r[LastPageColumns.id]);

      if (idsToDelete.length > 0) {
        const placeholders = idsToDelete.map(() => '?').join(',');
        await executeSql(
          `DELETE FROM ${TableNames.lastPage} 
           WHERE ${LastPageColumns.id} IN (${placeholders})`,
          idsToDelete
        );
      }
    }
  }
}

// ============================================================================
// Overflow Handler (for sync/uniquifier operations)
// ============================================================================

/**
 * Handles overflow of last pages during sync.
 */
export class LastPageOverflowHandler {
  async removeOverflowIfNeeded(db: AnnotationsDatabase): Promise<void> {
    await db.write(async (executeSql) => {
      // Get all pages ordered by modified date
      const result = await executeSql(
        `SELECT ${LastPageColumns.id} FROM ${TableNames.lastPage} 
         ORDER BY ${LastPageColumns.modifiedOn} DESC`,
        []
      );

      const rows = result.rows as Array<{ [LastPageColumns.id]: number }>;

      // Delete overflow pages
      if (rows.length > MAX_NUMBER_OF_LAST_PAGES) {
        const idsToDelete = rows
          .slice(MAX_NUMBER_OF_LAST_PAGES)
          .map((r) => r[LastPageColumns.id]);

        if (idsToDelete.length > 0) {
          const placeholders = idsToDelete.map(() => '?').join(',');
          await executeSql(
            `DELETE FROM ${TableNames.lastPage} 
             WHERE ${LastPageColumns.id} IN (${placeholders})`,
            idsToDelete
          );
        }
      }
    });
  }
}

/**
 * Uniquifies last pages (removes duplicates, keeps most recent).
 */
export class LastPageUniquifier {
  private readonly overflowHandler = new LastPageOverflowHandler();

  async uniquify(db: AnnotationsDatabase): Promise<void> {
    await db.write(async (executeSql) => {
      // Find duplicate pages, keeping the most recently modified
      const result = await executeSql(
        `SELECT ${LastPageColumns.page}, 
                MAX(${LastPageColumns.id}) as keep_id,
                COUNT(*) as count
         FROM ${TableNames.lastPage}
         GROUP BY ${LastPageColumns.page}
         HAVING count > 1`,
        []
      );

      const rows = result.rows as Array<{
        [LastPageColumns.page]: number;
        keep_id: number;
        count: number;
      }>;

      // Delete duplicates
      for (const row of rows) {
        await executeSql(
          `DELETE FROM ${TableNames.lastPage} 
           WHERE ${LastPageColumns.page} = ? AND ${LastPageColumns.id} != ?`,
          [row[LastPageColumns.page], row.keep_id]
        );
      }
    });

    // Handle overflow after uniquifying
    await this.overflowHandler.removeOverflowIfNeeded(db);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a last page persistence instance.
 */
export function createLastPagePersistence(
  database: AnnotationsDatabase
): LastPagePersistence {
  return new SQLiteLastPagePersistence(database);
}

