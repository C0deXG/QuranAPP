/**
 * Attempt.swift → attempt.ts
 *
 * Retry utility functions translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 3/12/17.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Attempts an operation multiple times before giving up.
 * Throws the last error if all attempts fail.
 *
 * @param times - Number of attempts (must be > 0)
 * @param body - The operation to attempt
 * @returns The result of the successful attempt
 * @throws The last error if all attempts fail
 *
 * @example
 * const result = attempt(3, () => {
 *   return riskyOperation();
 * });
 */
export function attempt<T>(times: number, body: () => T): T {
  if (times <= 0) {
    throw new Error('Cannot execute something 0 times');
  }

  let lastError: Error | undefined;

  for (let i = 0; i < times; i++) {
    try {
      return body();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError!;
}

/**
 * Attempts an async operation multiple times before giving up.
 * Throws the last error if all attempts fail.
 *
 * @param times - Number of attempts (must be > 0)
 * @param body - The async operation to attempt
 * @returns Promise with the result of the successful attempt
 * @throws The last error if all attempts fail
 *
 * @example
 * const result = await attemptAsync(3, async () => {
 *   return await fetchData();
 * });
 */
export async function attemptAsync<T>(
  times: number,
  body: () => Promise<T>
): Promise<T> {
  if (times <= 0) {
    throw new Error('Cannot execute something 0 times');
  }

  let lastError: Error | undefined;

  for (let i = 0; i < times; i++) {
    try {
      return await body();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError!;
}

/**
 * Options for retry with delay
 */
export interface RetryOptions {
  /**
   * Number of retry attempts (must be > 0)
   */
  times: number;

  /**
   * Delay in milliseconds between retries (default: 0)
   */
  delayMs?: number;

  /**
   * Exponential backoff multiplier (default: 1, no backoff)
   * Each retry will wait: delayMs * (backoffMultiplier ^ attemptNumber)
   */
  backoffMultiplier?: number;

  /**
   * Maximum delay in milliseconds (default: no limit)
   */
  maxDelayMs?: number;

  /**
   * Optional callback for each retry attempt
   */
  onRetry?: (attempt: number, error: Error) => void;

  /**
   * Optional predicate to determine if error should trigger retry
   * Returns true to retry, false to throw immediately
   */
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Attempts an async operation with configurable retry options.
 *
 * @param options - Retry configuration
 * @param body - The async operation to attempt
 * @returns Promise with the result of the successful attempt
 *
 * @example
 * const result = await attemptWithOptions(
 *   { times: 3, delayMs: 1000, backoffMultiplier: 2 },
 *   async () => await fetchData()
 * );
 */
export async function attemptWithOptions<T>(
  options: RetryOptions,
  body: () => Promise<T>
): Promise<T> {
  const {
    times,
    delayMs = 0,
    backoffMultiplier = 1,
    maxDelayMs = Number.MAX_SAFE_INTEGER,
    onRetry,
    shouldRetry,
  } = options;

  if (times <= 0) {
    throw new Error('Cannot execute something 0 times');
  }

  let lastError: Error | undefined;

  for (let i = 0; i < times; i++) {
    try {
      return await body();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(lastError)) {
        throw lastError;
      }

      // If this is not the last attempt, wait before retrying
      if (i < times - 1) {
        onRetry?.(i + 1, lastError);

        if (delayMs > 0) {
          const waitTime = Math.min(
            delayMs * Math.pow(backoffMultiplier, i),
            maxDelayMs
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  throw lastError!;
}

