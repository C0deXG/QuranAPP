/**
 * PersistenceError.swift → persistence-error.ts
 *
 * Error types for database operations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { l } from '../../core/localization';

/**
 * Error codes that indicate a corrupted or inaccessible database file.
 */
export const BAD_FILE_ERROR_CODES = [
  'SQLITE_PERM',
  'SQLITE_NOTADB',
  'SQLITE_CORRUPT',
  'SQLITE_CANTOPEN',
] as const;

export type BadFileErrorCode = (typeof BAD_FILE_ERROR_CODES)[number];

/**
 * Types of persistence errors.
 */
export enum PersistenceErrorType {
  /** General error with a message */
  General = 'general',
  /** Error opening the database */
  OpenDatabase = 'openDatabase',
  /** Error executing a query */
  Query = 'query',
  /** Unknown error */
  Unknown = 'unknown',
  /** Bad or corrupted database file */
  BadFile = 'badFile',
}

/**
 * Error class for database persistence operations.
 */
export class PersistenceError extends Error {
  readonly type: PersistenceErrorType;
  readonly filePath?: string;
  readonly underlyingError?: Error;

  private constructor(
    type: PersistenceErrorType,
    message: string,
    filePath?: string,
    underlyingError?: Error
  ) {
    super(message);
    this.name = 'PersistenceError';
    this.type = type;
    this.filePath = filePath;
    this.underlyingError = underlyingError;
  }

  /**
   * Creates a general error with a message.
   */
  static general(message: string): PersistenceError {
    return new PersistenceError(PersistenceErrorType.General, message);
  }

  /**
   * Creates an error from another error with additional info.
   */
  static generalError(error: Error, info: string): PersistenceError {
    return new PersistenceError(
      PersistenceErrorType.General,
      `error: ${error.message}, info: ${info}`,
      undefined,
      error
    );
  }

  /**
   * Creates an error for database open failures.
   */
  static openDatabase(error: Error, filePath: string): PersistenceError {
    return new PersistenceError(
      PersistenceErrorType.OpenDatabase,
      `Failed to open database at ${filePath}: ${error.message}`,
      filePath,
      error
    );
  }

  /**
   * Creates an error for query failures.
   */
  static query(error: Error, filePath?: string): PersistenceError {
    return new PersistenceError(
      PersistenceErrorType.Query,
      `Query error: ${error.message}`,
      filePath,
      error
    );
  }

  /**
   * Creates an error for unknown failures.
   */
  static unknown(error: Error, filePath?: string): PersistenceError {
    return new PersistenceError(
      PersistenceErrorType.Unknown,
      `Unknown error: ${error.message}`,
      filePath,
      error
    );
  }

  /**
   * Creates an error for bad/corrupted database files.
   */
  static badFile(error?: Error, filePath?: string): PersistenceError {
    return new PersistenceError(
      PersistenceErrorType.BadFile,
      error
        ? `Bad database file: ${error.message}`
        : 'Bad or corrupted database file',
      filePath,
      error
    );
  }

  /**
   * Creates a PersistenceError from an unknown error.
   * Attempts to classify the error based on its properties.
   */
  static fromError(error: unknown, databasePath?: string): PersistenceError {
    // Already a PersistenceError
    if (error instanceof PersistenceError) {
      return error;
    }

    // Standard Error
    if (error instanceof Error) {
      // Check for bad file error codes in the message
      const isBadFile = BAD_FILE_ERROR_CODES.some(
        (code) =>
          error.message.includes(code) ||
          (error as any).code === code
      );

      if (isBadFile) {
        return PersistenceError.badFile(error, databasePath);
      }

      return PersistenceError.query(error, databasePath);
    }

    // Unknown error type
    return PersistenceError.unknown(
      new Error(String(error)),
      databasePath
    );
  }

  /**
   * Gets a localized error description.
   */
  get localizedDescription(): string {
    return l('error.message.general');
  }

  /**
   * Checks if this is a bad file error.
   */
  get isBadFileError(): boolean {
    return this.type === PersistenceErrorType.BadFile;
  }

  /**
   * Checks if this error should trigger file deletion.
   */
  get shouldDeleteFile(): boolean {
    return this.isBadFileError;
  }
}

/**
 * Type guard to check if an error is a PersistenceError.
 */
export function isPersistenceError(error: unknown): error is PersistenceError {
  return error instanceof PersistenceError;
}

/**
 * Checks if an error indicates a bad database file.
 */
export function isBadFileError(error: unknown): boolean {
  if (error instanceof PersistenceError) {
    return error.isBadFileError;
  }

  if (error instanceof Error) {
    return BAD_FILE_ERROR_CODES.some(
      (code) =>
        error.message.includes(code) ||
        (error as any).code === code
    );
  }

  return false;
}

