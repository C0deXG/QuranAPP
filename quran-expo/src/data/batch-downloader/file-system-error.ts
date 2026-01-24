/**
 * FileSystemError.swift → file-system-error.ts
 *
 * Error types for file system operations during downloads.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { l } from '../../core/localization';

/**
 * Types of file system errors.
 */
export enum FileSystemErrorType {
  /** No disk space available */
  NoDiskSpace = 'noDiskSpace',
  /** Unknown error */
  Unknown = 'unknown',
}

/**
 * Error class for file system operations.
 */
export class FileSystemError extends Error {
  readonly type: FileSystemErrorType;
  readonly underlyingError?: Error;

  private constructor(
    type: FileSystemErrorType,
    message: string,
    underlyingError?: Error
  ) {
    super(message);
    this.name = 'FileSystemError';
    this.type = type;
    this.underlyingError = underlyingError;
  }

  /**
   * Creates a no disk space error.
   */
  static noDiskSpace(error?: Error): FileSystemError {
    return new FileSystemError(
      FileSystemErrorType.NoDiskSpace,
      'No disk space available',
      error
    );
  }

  /**
   * Creates an unknown error.
   */
  static unknown(error: Error): FileSystemError {
    return new FileSystemError(
      FileSystemErrorType.Unknown,
      error.message,
      error
    );
  }

  /**
   * Creates a FileSystemError from an unknown error.
   */
  static fromError(error: unknown): FileSystemError {
    if (error instanceof FileSystemError) {
      return error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Check for disk space errors
      if (
        message.includes('disk') ||
        message.includes('space') ||
        message.includes('quota') ||
        message.includes('full') ||
        message.includes('ENOSPC')
      ) {
        return FileSystemError.noDiskSpace(error);
      }

      return FileSystemError.unknown(error);
    }

    return FileSystemError.unknown(new Error(String(error)));
  }

  /**
   * Gets a localized error description.
   */
  get localizedDescription(): string {
    switch (this.type) {
      case FileSystemErrorType.NoDiskSpace:
        return l('error.message.no_disk_space');
      case FileSystemErrorType.Unknown:
      default:
        return l('error.message.general');
    }
  }
}

/**
 * Type guard to check if an error is a FileSystemError.
 */
export function isFileSystemError(error: unknown): error is FileSystemError {
  return error instanceof FileSystemError;
}

/**
 * Checks if an error is a disk space error.
 */
export function isDiskSpaceError(error: unknown): boolean {
  if (error instanceof FileSystemError) {
    return error.type === FileSystemErrorType.NoDiskSpace;
  }
  return false;
}

