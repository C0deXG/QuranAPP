/**
 * CoreDataStack.swift → annotations-database.ts
 *
 * SQLite database stack for annotations.
 * Replaces CoreData with expo-sqlite.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import {
  DatabaseConnection,
  DatabaseMigrator,
  getDatabasePath,
  deleteDatabase,
} from '../sqlite-persistence';
import {
  ALL_CREATE_STATEMENTS,
  ANNOTATIONS_DB_NAME,
  ANNOTATIONS_SCHEMA_VERSION,
} from '../core-data-model';
import { logger } from '../../core/logging';
import { ManagedCriticalState } from '../../core/utilities/locking';

// ============================================================================
// Types
// ============================================================================

/**
 * Change listener callback.
 */
export type DatabaseChangeListener = () => void;

/**
 * Entity uniquifier interface (for deduplication).
 */
export interface EntityUniquifier {
  /** Entity/table name this uniquifier handles */
  readonly entityName: string;

  /** Deduplicate entities in a transaction */
  deduplicate(executeSql: ExecuteSqlFn): Promise<void>;
}

/**
 * SQL execution function type.
 */
export type ExecuteSqlFn = (
  sql: string,
  params?: any[]
) => Promise<{ rows: any[]; rowsAffected: number; insertId?: number }>;

// ============================================================================
// Annotations Database
// ============================================================================

interface DatabaseState {
  connection: DatabaseConnection | null;
  initialized: boolean;
}

/**
 * SQLite database stack for annotations.
 * Provides a centralized database access point with change notifications.
 */
export class AnnotationsDatabase {
  private state = new ManagedCriticalState<DatabaseState>({
    connection: null,
    initialized: false,
  });

  private changeListeners = new Set<DatabaseChangeListener>();
  private uniquifiers: EntityUniquifier[] = [];

  /**
   * Creates a new annotations database.
   */
  constructor(uniquifiers?: EntityUniquifier[]) {
    this.uniquifiers = uniquifiers ?? [];
  }

  /**
   * Gets the database connection, initializing if needed.
   */
  async getConnection(): Promise<DatabaseConnection> {
    return this.state.withCriticalRegion(async (state) => {
      if (state.connection && state.initialized) {
        return state.connection;
      }

      // Create connection
      const connection = new DatabaseConnection(
        getDatabasePath(ANNOTATIONS_DB_NAME),
        false // writable
      );

      // Run migrations
      await this.migrate(connection);

      state.connection = connection;
      state.initialized = true;

      return connection;
    });
  }

  /**
   * Performs a read operation.
   */
  async read<T>(
    operation: (executeSql: ExecuteSqlFn) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    return connection.read(async (executeSql) => {
      const result = await executeSql('SELECT 1'); // Validate connection
      return operation(executeSql);
    });
  }

  /**
   * Performs a write operation.
   */
  async write<T>(
    operation: (executeSql: ExecuteSqlFn) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    const result = await connection.write(operation);

    // Notify change listeners
    this.notifyChangeListeners();

    return result;
  }

  /**
   * Performs a write operation in a transaction.
   */
  async writeTransaction<T>(
    operation: (executeSql: ExecuteSqlFn) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    const result = await connection.writeTransaction(operation);

    // Notify change listeners
    this.notifyChangeListeners();

    return result;
  }

  /**
   * Adds a change listener.
   */
  addChangeListener(listener: DatabaseChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Removes all persistent files.
   */
  static async removePersistentFiles(): Promise<void> {
    await deleteDatabase(getDatabasePath(ANNOTATIONS_DB_NAME));
    logger.info(
      'Removed annotations database files',
      'AnnotationsDatabase'
    );
  }

  /**
   * Closes the database connection.
   */
  async close(): Promise<void> {
    await this.state.withCriticalRegion(async (state) => {
      if (state.connection) {
        await state.connection.close();
        state.connection = null;
        state.initialized = false;
      }
    });

    this.changeListeners.clear();
  }

  /**
   * Runs entity deduplication.
   * Called after remote changes are merged.
   */
  async runDeduplication(): Promise<void> {
    if (this.uniquifiers.length === 0) return;

    await this.writeTransaction(async (executeSql) => {
      for (const uniquifier of this.uniquifiers) {
        await uniquifier.deduplicate(executeSql);
      }
    });

    logger.info('Deduplication completed', 'AnnotationsDatabase');
  }

  // ============================================================================
  // Private
  // ============================================================================

  private async migrate(connection: DatabaseConnection): Promise<void> {
    const migrator = new DatabaseMigrator();

    migrator.registerMigration({
      version: ANNOTATIONS_SCHEMA_VERSION,
      migrate: async (executeSql) => {
        for (const sql of ALL_CREATE_STATEMENTS) {
          await executeSql(sql);
        }
      },
    });

    await migrator.migrate(connection);
    logger.info(
      `Annotations database migrated to version ${ANNOTATIONS_SCHEMA_VERSION}`,
      'AnnotationsDatabase'
    );
  }

  private notifyChangeListeners(): void {
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch (error) {
        logger.warning(
          `Change listener error: ${error}`,
          'AnnotationsDatabase'
        );
      }
    }
  }
}

// ============================================================================
// Shared Instance
// ============================================================================

let sharedDatabase: AnnotationsDatabase | null = null;

/**
 * Gets the shared annotations database instance.
 */
export function getAnnotationsDatabase(): AnnotationsDatabase {
  if (!sharedDatabase) {
    sharedDatabase = new AnnotationsDatabase();
  }
  return sharedDatabase;
}

/**
 * Sets the shared annotations database instance.
 */
export function setAnnotationsDatabase(database: AnnotationsDatabase): void {
  sharedDatabase = database;
}

/**
 * Resets the shared database (for testing).
 */
export async function resetAnnotationsDatabase(): Promise<void> {
  if (sharedDatabase) {
    await sharedDatabase.close();
    sharedDatabase = null;
  }
}

