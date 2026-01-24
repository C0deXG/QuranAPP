/**
 * Result+Extension.swift → result.ts
 *
 * Result type utilities translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-05-27.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Represents either a success value or an error.
 * This is the TypeScript equivalent of Swift's Result type.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

/**
 * Creates a success result
 */
export function success<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * Creates a failure result
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Checks if a result is a success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success;
}

/**
 * Checks if a result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Creates a Result from an async operation.
 * This is equivalent to Swift's Result.init(_ body:) async.
 *
 * @param body - Async function that may throw
 * @returns Result containing either the success value or the error
 *
 * @example
 * const result = await resultFromAsync(async () => {
 *   const data = await fetchData();
 *   return processData(data);
 * });
 *
 * if (isSuccess(result)) {
 *   console.log('Data:', result.value);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
export async function resultFromAsync<T>(
  body: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const value = await body();
    return success(value);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Creates a Result from a sync operation that may throw.
 *
 * @param body - Function that may throw
 * @returns Result containing either the success value or the error
 */
export function resultFromSync<T>(body: () => T): Result<T, Error> {
  try {
    const value = body();
    return success(value);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Maps the success value of a result
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  transform: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return success(transform(result.value));
  }
  return result as Result<U, E>;
}

/**
 * Maps the error value of a result
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  transform: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return failure(transform((result as { success: false; error: E }).error));
  }
  return result;
}

/**
 * Flat maps the success value of a result
 */
export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  transform: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return transform(result.value);
  }
  return result as Result<U, E>;
}

/**
 * Gets the value or throws the error
 */
export function getOrThrow<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.value;
  }
  throw (result as { success: false; error: E }).error;
}

/**
 * Gets the value or returns a default
 */
export function getOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Gets the value or computes a default from the error
 */
export function getOrElse<T, E>(
  result: Result<T, E>,
  defaultProvider: (error: E) => T
): T {
  if (result.success) {
    return result.value;
  }
  return defaultProvider((result as { success: false; error: E }).error);
}

