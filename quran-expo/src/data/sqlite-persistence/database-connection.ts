/**
 * DatabaseConnection.swift → database-connection.ts
 *
 * SQLite database connection with pooling support.
 * Uses expo-sqlite for React Native.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as SQLite from 'expo-sqlite';
import * as LegacyFS from 'expo-file-system/legacy';
import { ManagedCriticalState } from '../../core/utilities/locking';
import { attempt } from '../../core/utilities/attempt';
import { logger } from '../../core/logging';
import { PersistenceError, isBadFileError } from './persistence-error';

// ============================================================================
// Types
// ============================================================================

/**
 * Result row from a SQL query.
 */
export interface SQLResultRow {
  [column: string]: any;
}

/**
 * Result set from a SQL query.
 */
export interface SQLResultSet {
  /** Number of rows affected (for INSERT/UPDATE/DELETE) */
  rowsAffected: number;
  /** ID of the last inserted row */
  insertId?: number;
  /** Result rows */
  rows: SQLResultRow[];
}

/**
 * Callback for database read operations.
 */
export type ReadCallback<T> = (
  executeSql: (sql: string, params?: any[]) => Promise<SQLResultSet>
) => Promise<T>;

/**
 * Callback for database write operations.
 */
export type WriteCallback<T> = (
  executeSql: (sql: string, params?: any[]) => Promise<SQLResultSet>
) => Promise<T>;

/**
 * Database change listener callback.
 */
export type DatabaseChangeListener = () => void;

// ============================================================================
// Connection Pool
// ============================================================================

interface PooledConnection {
  database: SQLite.SQLiteDatabase;
  references: number;
}

interface ConnectionPoolState {
  connections: Map<string, PooledConnection>;
}

/**
 * Manages a pool of database connections for reuse.
 */
class DatabaseConnectionPool {
  private state = new ManagedCriticalState<ConnectionPoolState>({
    connections: new Map(),
  });

  /**
   * Gets or creates a database connection for the given path.
   */
  async getDatabase(
    databasePath: string,
    readonly: boolean
  ): Promise<SQLite.SQLiteDatabase> {
    return this.state.withCriticalRegion(async (state) => {
      // Use the filename as the pool key so different absolute paths to the same DB don't create duplicate connections.
      const dbKey = this.databaseKey(databasePath);
      const existing = state.connections.get(dbKey);
      if (existing) {
        existing.references += 1;
        return existing.database;
      }

      // Ensure directory exists
      const directory = databasePath.substring(
        0,
        databasePath.lastIndexOf('/')
      );
      try {
        const dirInfo = await LegacyFS.getInfoAsync(directory);
        if (!dirInfo.exists) {
          await LegacyFS.makeDirectoryAsync(directory, {
            intermediates: true,
          });
        }
      } catch {
        // Ignore directory creation errors
      }

      // Open database with retry
      const database = await this.openDatabase(databasePath, readonly);

      state.connections.set(dbKey, {
        database,
        references: 1,
      });

      return database;
    });
  }

  /**
   * Releases a database connection.
   */
  async releaseDatabase(databasePath: string): Promise<void> {
    await this.state.withCriticalRegion(async (state) => {
      const dbKey = this.databaseKey(databasePath);
      const connection = state.connections.get(dbKey);
      if (connection) {
        connection.references -= 1;
        if (connection.references <= 0) {
          try {
            await connection.database.closeAsync();
          } catch (error) {
            logger.warning(
              `Error closing database: ${error}`,
              'DatabaseConnectionPool'
            );
          }
          state.connections.delete(dbKey);
        }
      }
    });
  }

  /**
   * Opens a new database connection with retry logic.
   */
  private async openDatabase(
    databasePath: string,
    readonly: boolean
  ): Promise<SQLite.SQLiteDatabase> {
    try {
      return await attempt(3, async () => {
        // Expo SQLite expects a database name, not an absolute path. Use the filename for compatibility.
        const dbName = databasePath.substring(databasePath.lastIndexOf('/') + 1);

        const db = await SQLite.openDatabaseAsync(dbName, {
          enableChangeListener: true,
        });

        // Set busy timeout (equivalent to GRDB busyMode)
        await db.execAsync('PRAGMA busy_timeout = 5000');

        // Set readonly mode via pragma if needed
        if (readonly) {
          await db.execAsync('PRAGMA query_only = ON');
        }

        return db;
      });
    } catch (error) {
      logger.error(
        `Cannot open sqlite file ${databasePath}. Error: ${error}`,
        'DatabaseConnectionPool'
      );
      throw PersistenceError.fromError(error, databasePath);
    }
  }

  /**
   * Normalizes the pool key to the database filename to avoid duplicate handles for the same DB.
   */
  private databaseKey(databasePath: string): string {
    const sanitized = databasePath.substring(databasePath.lastIndexOf('/') + 1);
    return sanitized || databasePath;
  }
}

// ============================================================================
// Database Connection
// ============================================================================

interface ConnectionState {
  database: SQLite.SQLiteDatabase | null;
}

/** Global connection pool */
const connectionPool = new DatabaseConnectionPool();

/**
 * Represents a connection to a SQLite database.
 * Provides read/write operations with error handling and connection pooling.
 */
export class DatabaseConnection {
  readonly databasePath: string;
  readonly readonly: boolean;

  private state = new ManagedCriticalState<ConnectionState>({
    database: null,
  });

  private changeListeners = new Set<DatabaseChangeListener>();
  private disposed = false;

  /**
   * Creates a new database connection.
   *
   * @param databasePath - Path to the database file
   * @param readonly - Whether to open in readonly mode (default: true)
   */
  constructor(databasePath: string, readonly: boolean = true) {
    this.databasePath = databasePath;
    this.readonly = readonly;
  }

  /**
   * Executes a read operation on the database.
   *
   * @param block - Callback that performs read operations
   * @returns The result of the callback
   */
  async read<T>(block: ReadCallback<T>): Promise<T> {
    const database = await this.getDatabase();
    try {
      return await block(async (sql, params) => {
        const result = await database.getAllAsync(sql, params ?? []);
        return {
          rowsAffected: 0,
          rows: result as SQLResultRow[],
        };
      });
    } catch (error) {
      logger.error(
        `General error while executing query. Error: ${error}.`,
        'DatabaseConnection'
      );
      throw this.handleError(error);
    }
  }

  /**
   * Executes a write operation on the database.
   *
   * @param block - Callback that performs write operations
   * @returns The result of the callback
   */
  async write<T>(block: WriteCallback<T>): Promise<T> {
    if (this.readonly) {
      throw PersistenceError.general('Cannot write to readonly database');
    }

    const database = await this.getDatabase();
    try {
      const result = await block(async (sql, params) => {
        const runResult = await database.runAsync(sql, params ?? []);
        return {
          rowsAffected: runResult.changes,
          insertId: runResult.lastInsertRowId,
          rows: [],
        };
      });

      // Notify listeners of changes
      this.notifyChangeListeners();

      return result;
    } catch (error) {
      logger.error(
        `General error while executing query. Error: ${error}.`,
        'DatabaseConnection'
      );
      throw this.handleError(error);
    }
  }

  /**
   * Executes a write operation in a transaction.
   *
   * @param block - Callback that performs write operations within the transaction
   * @returns The result of the callback
   */
  async writeTransaction<T>(block: WriteCallback<T>): Promise<T> {
    if (this.readonly) {
      throw PersistenceError.general('Cannot write to readonly database');
    }

    const database = await this.getDatabase();
    try {
      let result: T;

      await database.withTransactionAsync(async () => {
        result = await block(async (sql, params) => {
          const runResult = await database.runAsync(sql, params ?? []);
          return {
            rowsAffected: runResult.changes,
            insertId: runResult.lastInsertRowId,
            rows: [],
          };
        });
      });

      // Notify listeners of changes
      this.notifyChangeListeners();

      return result!;
    } catch (error) {
      logger.error(
        `Transaction error. Error: ${error}.`,
        'DatabaseConnection'
      );
      throw this.handleError(error);
    }
  }

  /**
   * Executes raw SQL directly.
   * Use with caution - prefer read/write methods.
   */
  async executeSql(sql: string, params?: any[]): Promise<SQLResultSet> {
    const database = await this.getDatabase();
    try {
      const result = await database.getAllAsync(sql, params ?? []);
      return {
        rowsAffected: 0,
        rows: result as SQLResultRow[],
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Adds a listener for database changes.
   */
  addChangeListener(listener: DatabaseChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  /**
   * Closes the database connection and releases resources.
   */
  async close(): Promise<void> {
    if (this.disposed) return;

    this.disposed = true;
    this.changeListeners.clear();

    await this.state.withCriticalRegion(async (state) => {
      if (state.database) {
        await connectionPool.releaseDatabase(this.databasePath);
        state.database = null;
      }
    });
  }

  /**
   * Gets or opens the database connection.
   */
  private async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.disposed) {
      throw PersistenceError.general('Database connection has been closed');
    }

    return this.state.withCriticalRegion(async (state) => {
      if (state.database) {
        return state.database;
      }

      const database = await connectionPool.getDatabase(
        this.databasePath,
        this.readonly
      );
      state.database = database;
      return database;
    });
  }

  /**
   * Handles errors from database operations.
   */
  private handleError(error: unknown): PersistenceError {
    const persistenceError = PersistenceError.fromError(
      error,
      this.databasePath
    );

    // If it's a bad file error, try to remove the database
    if (persistenceError.shouldDeleteFile) {
      logger.error(
        `Bad file error while executing query. Error: ${error}.`,
        'DatabaseConnection'
      );
      this.tryDeleteDatabase();
    }

    return persistenceError;
  }

  /**
   * Attempts to delete the database file.
   */
  private async tryDeleteDatabase(): Promise<void> {
    try {
      await LegacyFS.deleteAsync(this.databasePath, { idempotent: true });
    } catch (error) {
      logger.warning(
        `Failed to delete bad database file: ${error}`,
        'DatabaseConnection'
      );
    }
  }

  /**
   * Notifies all change listeners.
   */
  private notifyChangeListeners(): void {
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch (error) {
        logger.warning(
          `Change listener error: ${error}`,
          'DatabaseConnection'
        );
      }
    }
  }
}

// ============================================================================
// Database Migrator
// ============================================================================

/**
 * A migration definition.
 */
export interface DatabaseMigration {
  /** Version number for this migration */
  version: number;
  /** Migration function that receives SQL executor */
  migrate: (
    executeSql: (sql: string, params?: any[]) => Promise<SQLResultSet>
  ) => Promise<void>;
}

/**
 * Manages database schema migrations.
 */
export class DatabaseMigrator {
  private migrations: DatabaseMigration[] = [];

  /**
   * Registers a migration.
   */
  registerMigration(migration: DatabaseMigration): this {
    this.migrations.push(migration);
    // Sort by version
    this.migrations.sort((a, b) => a.version - b.version);
    return this;
  }

  /**
   * Runs all pending migrations on the database.
   */
  async migrate(connection: DatabaseConnection): Promise<void> {
    // Ensure we can write
    if (connection.readonly) {
      throw PersistenceError.general('Cannot migrate readonly database');
    }

    try {
      // Get current version
      let currentVersion = await this.getCurrentVersion(connection);

      // Run pending migrations
      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          logger.info(
            `Running migration ${migration.version} for ${connection.databasePath}`,
            'DatabaseMigrator'
          );

          await connection.writeTransaction(async (executeSql) => {
            await migration.migrate(executeSql);
            await executeSql(
              `PRAGMA user_version = ${migration.version}`
            );
          });

          currentVersion = migration.version;
        }
      }
    } catch (error) {
      throw PersistenceError.fromError(error, connection.databasePath);
    }
  }

  /**
   * Gets the current schema version.
   */
  private async getCurrentVersion(
    connection: DatabaseConnection
  ): Promise<number> {
    const result = await connection.read(async (executeSql) => {
      return executeSql('PRAGMA user_version');
    });

    if (result.rows.length > 0) {
      return result.rows[0].user_version ?? 0;
    }
    return 0;
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Gets the default database directory path.
 */
export function getDatabaseDirectory(): string {
  return `${LegacyFS.documentDirectory}SQLite/`;
}

/**
 * Gets the full path for a database file.
 */
export function getDatabasePath(databaseName: string): string {
  return `${getDatabaseDirectory()}${databaseName}`;
}

/**
 * Checks if a database file exists.
 */
export async function databaseExists(databasePath: string): Promise<boolean> {
  try {
    const info = await LegacyFS.getInfoAsync(databasePath);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Deletes a database file if it exists.
 */
export async function deleteDatabase(databasePath: string): Promise<void> {
  await LegacyFS.deleteAsync(databasePath, { idempotent: true });
}

/**
 * Copies a bundled database to the documents directory.
 * Useful for pre-populating databases with read-only data.
 */
export async function copyBundledDatabase(
  bundledAssetUri: string,
  destinationPath: string
): Promise<void> {
  const destDir = destinationPath.substring(
    0,
    destinationPath.lastIndexOf('/')
  );

  // Ensure directory exists
  const dirInfo = await LegacyFS.getInfoAsync(destDir);
  if (!dirInfo.exists) {
    await LegacyFS.makeDirectoryAsync(destDir, { intermediates: true });
  }

  // Copy the file
  await LegacyFS.copyAsync({
    from: bundledAssetUri,
    to: destinationPath,
  });
}
