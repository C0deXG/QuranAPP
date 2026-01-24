/**
 * MulticastContinuation.swift → multicast-continuation.ts
 *
 * Multicast continuation utilities translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-04-30.
 *
 * This allows multiple awaiters to wait for a single result.
 * Once the result is available, all current and future awaiters receive it.
 */

import { Result, success, failure, isSuccess } from './result';

/**
 * A continuation that can be resumed once and notifies multiple awaiters.
 * Similar to a Promise but with explicit control over when it resolves.
 *
 * Equivalent to Swift's MulticastContinuation struct.
 *
 * @example
 * const continuation = new MulticastContinuation<string>();
 *
 * // Multiple awaiters can wait
 * const promise1 = continuation.wait();
 * const promise2 = continuation.wait();
 *
 * // Resume once with a value
 * continuation.resume('Hello');
 *
 * // Both promises resolve with 'Hello'
 * // Future awaiters also get 'Hello' immediately
 */
export class MulticastContinuation<T, E extends Error = Error> {
  private result: Result<T, E> | null = null;
  private waiters: Array<{
    resolve: (value: T) => void;
    reject: (error: E) => void;
  }> = [];

  /**
   * Whether the continuation is still pending (not yet resumed).
   */
  get isPending(): boolean {
    return this.result === null;
  }

  /**
   * Whether the continuation has been resolved.
   */
  get isResolved(): boolean {
    return this.result !== null;
  }

  /**
   * Waits for the continuation to be resumed.
   * Returns immediately if already resumed.
   *
   * @returns Promise that resolves with the value or rejects with the error
   */
  wait(): Promise<T> {
    // If already resolved, return immediately
    if (this.result !== null) {
      const result = this.result;
      if (result.success) {
        return Promise.resolve(result.value);
      } else {
        return Promise.reject((result as { success: false; error: E }).error);
      }
    }

    // Otherwise, wait for resolution
    return new Promise<T>((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  /**
   * Resumes the continuation with a result.
   * All current and future awaiters receive this result.
   *
   * @param result - The result to resume with
   */
  resumeWith(result: Result<T, E>): void {
    if (this.result !== null) {
      // Already resumed, ignore
      return;
    }

    this.result = result;

    // Notify all waiters
    for (const waiter of this.waiters) {
      if (result.success) {
        waiter.resolve(result.value);
      } else {
        waiter.reject((result as { success: false; error: E }).error);
      }
    }
    this.waiters = [];
  }

  /**
   * Resumes the continuation with a success value.
   *
   * @param value - The value to resume with
   */
  resume(value: T): void {
    this.resumeWith(success(value));
  }

  /**
   * Resumes the continuation with an error.
   *
   * @param error - The error to resume with
   */
  resumeWithError(error: E): void {
    this.resumeWith(failure(error));
  }

  /**
   * Gets the result if available, or null if pending.
   */
  getResult(): Result<T, E> | null {
    return this.result;
  }

  /**
   * Resets the continuation to pending state.
   * Warning: This may cause issues if there are active waiters.
   */
  reset(): void {
    this.result = null;
    this.waiters = [];
  }
}

/**
 * A simpler version that only supports success values (no errors).
 */
export class SimpleMulticastContinuation<T> {
  private value: T | undefined;
  private resolved = false;
  private waiters: Array<(value: T) => void> = [];

  /**
   * Whether the continuation is still pending.
   */
  get isPending(): boolean {
    return !this.resolved;
  }

  /**
   * Waits for the continuation to be resumed.
   */
  wait(): Promise<T> {
    if (this.resolved) {
      return Promise.resolve(this.value!);
    }

    return new Promise<T>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  /**
   * Resumes the continuation with a value.
   */
  resume(value: T): void {
    if (this.resolved) return;

    this.value = value;
    this.resolved = true;

    for (const waiter of this.waiters) {
      waiter(value);
    }
    this.waiters = [];
  }

  /**
   * Gets the value if resolved, or undefined.
   */
  getValue(): T | undefined {
    return this.value;
  }
}

/**
 * Creates a deferred promise with external resolve/reject control.
 * This is a simpler alternative to MulticastContinuation for one-shot use.
 *
 * @example
 * const deferred = createDeferred<string>();
 *
 * // Somewhere else:
 * deferred.resolve('Done!');
 *
 * // Or:
 * deferred.reject(new Error('Failed'));
 *
 * // Await the result:
 * const result = await deferred.promise;
 */
export function createDeferred<T, E extends Error = Error>(): Deferred<T, E> {
  let resolve: (value: T) => void;
  let reject: (error: E) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

/**
 * Deferred promise type
 */
export interface Deferred<T, E extends Error = Error> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: E) => void;
}

/**
 * Creates a one-shot event that can be awaited by multiple listeners.
 * Similar to a manual reset event in threading.
 *
 * @example
 * const event = createOneShotEvent();
 *
 * // Multiple waiters
 * Promise.all([
 *   event.wait().then(() => console.log('Waiter 1')),
 *   event.wait().then(() => console.log('Waiter 2')),
 * ]);
 *
 * // Signal all waiters
 * event.signal();
 */
export function createOneShotEvent(): OneShotEvent {
  const continuation = new SimpleMulticastContinuation<void>();

  return {
    wait: () => continuation.wait(),
    signal: () => continuation.resume(undefined),
    isSignaled: () => !continuation.isPending,
  };
}

/**
 * One-shot event type
 */
export interface OneShotEvent {
  wait: () => Promise<void>;
  signal: () => void;
  isSignaled: () => boolean;
}

