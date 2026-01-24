/**
 * Error+Extension.swift → error.ts
 *
 * Error utility functions translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-12-19.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Error names that indicate cancellation
 */
const CANCELLATION_ERROR_NAMES = [
  'AbortError',
  'CancellationError',
  'CancelledError',
];

/**
 * Error messages that indicate cancellation
 */
const CANCELLATION_ERROR_MESSAGES = [
  'cancelled',
  'canceled',
  'aborted',
  'user cancelled',
];

/**
 * Checks if an error represents a cancellation.
 * This handles various types of cancellation errors:
 * - AbortController aborts
 * - Promise cancellations
 * - User-initiated cancellations
 *
 * @param error - The error to check
 * @returns true if the error represents a cancellation
 *
 * @example
 * const controller = new AbortController();
 * controller.abort();
 * try {
 *   await fetch(url, { signal: controller.signal });
 * } catch (error) {
 *   if (isCancelled(error)) {
 *     console.log('Request was cancelled');
 *   }
 * }
 */
export function isCancelled(error: unknown): boolean {
  if (!error) {
    return false;
  }

  // Check if it's an Error instance
  if (error instanceof Error) {
    // Check error name
    if (CANCELLATION_ERROR_NAMES.includes(error.name)) {
      return true;
    }

    // Check error message
    const lowerMessage = error.message.toLowerCase();
    if (CANCELLATION_ERROR_MESSAGES.some((msg) => lowerMessage.includes(msg))) {
      return true;
    }

    // Check for DOMException with AbortError
    if (error.name === 'DOMException' && lowerMessage.includes('abort')) {
      return true;
    }
  }

  // Check if it's an object with a cancelled/canceled property
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.cancelled === true || errorObj.canceled === true) {
      return true;
    }

    // Check for code property (some libraries use numeric codes)
    if (errorObj.code === 'ECANCELED' || errorObj.code === 'ERR_CANCELED') {
      return true;
    }
  }

  return false;
}

/**
 * Custom cancellation error class
 */
export class CancellationError extends Error {
  constructor(message = 'Operation was cancelled') {
    super(message);
    this.name = 'CancellationError';
  }
}

/**
 * Creates a cancellation error
 */
export function createCancellationError(message?: string): CancellationError {
  return new CancellationError(message);
}

/**
 * Throws if the error is not a cancellation error.
 * Useful for ignoring cancellation errors in catch blocks.
 *
 * @param error - The error to check
 * @throws The original error if it's not a cancellation
 *
 * @example
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   ignoreIfCancelled(error); // Does nothing if cancelled
 *   console.error('Real error:', error); // Only runs for real errors
 * }
 */
export function ignoreIfCancelled(error: unknown): void {
  if (!isCancelled(error)) {
    throw error;
  }
}

/**
 * Wraps an async operation to ignore cancellation errors.
 *
 * @param promise - The promise to wrap
 * @returns Promise that resolves to undefined if cancelled
 */
export async function ignoreCancellation<T>(
  promise: Promise<T>
): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    if (isCancelled(error)) {
      return undefined;
    }
    throw error;
  }
}

