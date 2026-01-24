/**
 * SyncedPageBookmarkPersistence.swift → synced-page-bookmark-persistence.ts
 *
 * Interface and implementation for cloud-synced page bookmarks.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { DatabaseConnection } from '../sqlite-persistence';
import { createLogger } from '../../core/logging';

const logger = createLogger('SyncedPageBookmarkPersistence');

// ============================================================================
// Model
// ============================================================================

/**
 * Persistence model for a synced page bookmark.
 */
export interface SyncedPageBookmarkPersistenceModel {
  readonly page: number;
  readonly remoteID: string;
  readonly creationDate: Date;
}

/**
 * Creates a SyncedPageBookmarkPersistenceModel.
 */
export function createSyncedPageBookmarkPersistenceModel(params: {
  page: number;
  remoteID: string;
  creationDate: Date;
}): SyncedPageBookmarkPersistenceModel {
  return {
    page: params.page,
    remoteID: params.remoteID,
    creationDate: params.creationDate,
  };
}

// ============================================================================
// Database Schema
// ============================================================================

const TABLE_NAME = 'synced_page_bookmarks';

const Columns = {
  page: 'page',
  remoteId: 'remote_id',
  creationDate: 'creation_date',
} as const;

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    ${Columns.page} INTEGER NOT NULL UNIQUE,
    ${Columns.remoteId} TEXT PRIMARY KEY,
    ${Columns.creationDate} TEXT NOT NULL
  )
`;

interface SyncedPageBookmarkRow {
  [Columns.page]: number;
  [Columns.remoteId]: string;
  [Columns.creationDate]: string;
}

// ============================================================================
// Interface
// ============================================================================

/**
 * Callback type for bookmark changes.
 */
export type SyncedBookmarkChangeCallback = (
  bookmarks: SyncedPageBookmarkPersistenceModel[]
) => void;

/**
 * Interface for synced page bookmark persistence.
 */
export interface SyncedPageBookmarkPersistence {
  /**
   * Subscribes to bookmark changes.
   */
  subscribe(callback: SyncedBookmarkChangeCallback): () => void;

  /**
   * Gets all bookmarks.
   */
  getAll(): Promise<SyncedPageBookmarkPersistenceModel[]>;

  /**
   * Gets a bookmark by page number.
   */
  bookmark(page: number): Promise<SyncedPageBookmarkPersistenceModel | null>;

  /**
   * Inserts a new bookmark.
   */
  insertBookmark(bookmark: SyncedPageBookmarkPersistenceModel): Promise<void>;

  /**
   * Removes a bookmark by remote ID.
   */
  removeBookmark(remoteID: string): Promise<void>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

/**
 * SQLite implementation of SyncedPageBookmarkPersistence.
 */
export class SQLiteSyncedPageBookmarkPersistence implements SyncedPageBookmarkPersistence {
  private readonly db: DatabaseConnection;
  private readonly subscribers = new Set<SyncedBookmarkChangeCallback>();
  private initialized = false;

  constructor(connection: DatabaseConnection) {
    this.db = connection;
  }

  static async create(databasePath: string): Promise<SQLiteSyncedPageBookmarkPersistence> {
    const db = new DatabaseConnection(databasePath, false); // writable
    const persistence = new SQLiteSyncedPageBookmarkPersistence(db);
    await persistence.initialize();
    return persistence;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.db.write(async (executeSql) => {
        await executeSql(CREATE_TABLE_SQL, []);
      });
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to do Page Bookmarks migration', { error });
    }
  }

  subscribe(callback: SyncedBookmarkChangeCallback): () => void {
    this.subscribers.add(callback);

    // Immediately send current state
    this.getAll()
      .then((bookmarks) => callback(bookmarks))
      .catch((error) => logger.error('Error fetching bookmarks for subscriber', { error }));

    return () => {
      this.subscribers.delete(callback);
    };
  }

  async getAll(): Promise<SyncedPageBookmarkPersistenceModel[]> {
    await this.initialize();

    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT * FROM ${TABLE_NAME} ORDER BY ${Columns.creationDate} DESC`,
        []
      );

      const rows = result.rows as SyncedPageBookmarkRow[];
      return rows.map(rowToModel);
    });
  }

  async bookmark(page: number): Promise<SyncedPageBookmarkPersistenceModel | null> {
    await this.initialize();

    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT * FROM ${TABLE_NAME} WHERE ${Columns.page} = ?`,
        [page]
      );

      const rows = result.rows as SyncedPageBookmarkRow[];
      return rows.length > 0 ? rowToModel(rows[0]) : null;
    });
  }

  async insertBookmark(bookmark: SyncedPageBookmarkPersistenceModel): Promise<void> {
    await this.initialize();

    await this.db.write(async (executeSql) => {
      await executeSql(
        `INSERT OR REPLACE INTO ${TABLE_NAME} 
         (${Columns.page}, ${Columns.remoteId}, ${Columns.creationDate})
         VALUES (?, ?, ?)`,
        [
          bookmark.page,
          bookmark.remoteID,
          bookmark.creationDate.toISOString(),
        ]
      );
    });

    await this.notifySubscribers();
  }

  async removeBookmark(remoteID: string): Promise<void> {
    if (!remoteID || remoteID.length === 0) {
      logger.error('[SyncedPageBookmarkPersistence] Attempted to remove a bookmark with an empty remote ID.');
      throw new Error('Cannot remove bookmark with empty remote ID');
    }

    await this.initialize();

    await this.db.write(async (executeSql) => {
      await executeSql(
        `DELETE FROM ${TABLE_NAME} WHERE ${Columns.remoteId} = ?`,
        [remoteID]
      );
    });

    await this.notifySubscribers();
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  // MARK: - Private

  private async notifySubscribers(): Promise<void> {
    if (this.subscribers.size === 0) return;

    try {
      const bookmarks = await this.getAll();
      for (const callback of this.subscribers) {
        try {
          callback(bookmarks);
        } catch (error) {
          logger.error('Error in bookmark subscriber callback', { error });
        }
      }
    } catch (error) {
      logger.error('Error fetching bookmarks for notification', { error });
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function rowToModel(row: SyncedPageBookmarkRow): SyncedPageBookmarkPersistenceModel {
  return createSyncedPageBookmarkPersistenceModel({
    page: row[Columns.page],
    remoteID: row[Columns.remoteId],
    creationDate: new Date(row[Columns.creationDate]),
  });
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a synced page bookmark persistence instance.
 */
export async function createSyncedPageBookmarkPersistence(
  databasePath: string
): Promise<SyncedPageBookmarkPersistence> {
  return SQLiteSyncedPageBookmarkPersistence.create(databasePath);
}

