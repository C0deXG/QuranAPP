/**
 * PageBookmarkPersistence.swift → page-bookmark-persistence.ts
 *
 * Interface and implementation for page bookmark persistence.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { AnnotationsDatabase } from '../core-data-persistence';
import {
  TableNames,
  PageBookmarkColumns,
  PageBookmarkRow,
  dateToString,
  stringToDate,
} from '../core-data-model';
import { DatabasePublisher, createDatabasePublisher } from '../core-data-persistence/database-publisher';

// ============================================================================
// Model
// ============================================================================

/**
 * Persistence model for page bookmark.
 */
export interface PageBookmarkPersistenceModel {
  readonly page: number;
  readonly creationDate: Date;
}

/**
 * Creates a PageBookmarkPersistenceModel.
 */
export function createPageBookmarkPersistenceModel(params: {
  page: number;
  creationDate: Date;
}): PageBookmarkPersistenceModel {
  return {
    page: params.page,
    creationDate: params.creationDate,
  };
}

/**
 * Converts a database row to a persistence model.
 */
function rowToModel(row: PageBookmarkRow): PageBookmarkPersistenceModel {
  return createPageBookmarkPersistenceModel({
    page: row[PageBookmarkColumns.page],
    creationDate: stringToDate(row[PageBookmarkColumns.createdOn]),
  });
}

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for page bookmark persistence operations.
 */
export interface PageBookmarkPersistence {
  /**
   * Observes page bookmarks, returning a publisher that emits on changes.
   */
  pageBookmarks(): DatabasePublisher<PageBookmarkPersistenceModel[]>;

  /**
   * Inserts a new page bookmark.
   */
  insertPageBookmark(page: number): Promise<void>;

  /**
   * Removes a page bookmark.
   */
  removePageBookmark(page: number): Promise<void>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

/**
 * SQLite implementation of PageBookmarkPersistence.
 */
export class SQLitePageBookmarkPersistence implements PageBookmarkPersistence {
  private readonly db: AnnotationsDatabase;

  constructor(database: AnnotationsDatabase) {
    this.db = database;
  }

  pageBookmarks(): DatabasePublisher<PageBookmarkPersistenceModel[]> {
    return createDatabasePublisher(
      this.db,
      TableNames.pageBookmark,
      async () => this.fetchAllBookmarks()
    );
  }

  async insertPageBookmark(page: number): Promise<void> {
    await this.db.write(async (executeSql) => {
      const now = new Date();
      await executeSql(
        `INSERT OR REPLACE INTO ${TableNames.pageBookmark} 
         (${PageBookmarkColumns.page}, ${PageBookmarkColumns.createdOn}, ${PageBookmarkColumns.modifiedOn})
         VALUES (?, ?, ?)`,
        [page, dateToString(now), dateToString(now)]
      );
    });
  }

  async removePageBookmark(page: number): Promise<void> {
    await this.db.write(async (executeSql) => {
      await executeSql(
        `DELETE FROM ${TableNames.pageBookmark} WHERE ${PageBookmarkColumns.page} = ?`,
        [page]
      );
    });
  }

  // MARK: - Private

  private async fetchAllBookmarks(): Promise<PageBookmarkPersistenceModel[]> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT * FROM ${TableNames.pageBookmark} 
         ORDER BY ${PageBookmarkColumns.createdOn} DESC`,
        []
      );

      const rows = result.rows as PageBookmarkRow[];
      return rows.map(rowToModel);
    });
  }
}

// ============================================================================
// Uniquifier (for sync operations)
// ============================================================================

/**
 * Uniquifies page bookmarks (removes duplicates, keeps most recent).
 */
export class PageBookmarkUniquifier {
  async uniquify(db: AnnotationsDatabase): Promise<void> {
    await db.write(async (executeSql) => {
      // Find duplicate pages, keeping the most recently modified
      const result = await executeSql(
        `SELECT ${PageBookmarkColumns.page}, 
                MAX(${PageBookmarkColumns.id}) as keep_id,
                COUNT(*) as count
         FROM ${TableNames.pageBookmark}
         GROUP BY ${PageBookmarkColumns.page}
         HAVING count > 1`,
        []
      );

      const rows = result.rows as Array<{
        [PageBookmarkColumns.page]: number;
        keep_id: number;
        count: number;
      }>;

      // Delete duplicates
      for (const row of rows) {
        await executeSql(
          `DELETE FROM ${TableNames.pageBookmark} 
           WHERE ${PageBookmarkColumns.page} = ? AND ${PageBookmarkColumns.id} != ?`,
          [row[PageBookmarkColumns.page], row.keep_id]
        );
      }
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a page bookmark persistence instance.
 */
export function createPageBookmarkPersistence(
  database: AnnotationsDatabase
): PageBookmarkPersistence {
  return new SQLitePageBookmarkPersistence(database);
}

