/**
 * SQLitePersistence - Database connection and utilities
 *
 * Translated from quran-ios/Data/SQLitePersistence
 *
 * This module provides:
 * - Database connection pooling
 * - Read/write operations with error handling
 * - Schema migration support
 * - Persistence error types
 */

// Persistence errors
export {
  PersistenceError,
  PersistenceErrorType,
  BAD_FILE_ERROR_CODES,
  isPersistenceError,
  isBadFileError,
} from './persistence-error';
export type { BadFileErrorCode } from './persistence-error';

// Database connection - import for local use
import { DatabaseConnection as DatabaseConnectionClass } from './database-connection';

// Re-export for external use
export {
  DatabaseConnection,
  DatabaseMigrator,
  getDatabaseDirectory,
  getDatabasePath,
  databaseExists,
  deleteDatabase,
  copyBundledDatabase,
} from './database-connection';
export type {
  SQLResultRow,
  SQLResultSet,
  ReadCallback,
  WriteCallback,
  DatabaseChangeListener,
  DatabaseMigration,
} from './database-connection';

/**
 * Type that accepts either a DatabaseConnection or a path string.
 * For convenience in migrated code where paths are often passed directly.
 */
export type DatabaseConnectionLike = DatabaseConnectionClass | string;

/**
 * Resolves a DatabaseConnectionLike to a DatabaseConnection.
 */
export function resolveConnection(connection: DatabaseConnectionLike): DatabaseConnectionClass {
  if (typeof connection === 'string') {
    return new DatabaseConnectionClass(connection, true);
  }
  return connection;
}