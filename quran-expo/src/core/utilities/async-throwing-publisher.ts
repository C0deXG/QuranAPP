/**
 * AsyncThrowingPublisher.swift → async-throwing-publisher.ts
 *
 * Throwing async publisher utilities translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-06-11.
 *
 * This is similar to AsyncPublisher but supports error propagation.
 */

import { BufferingPolicy } from './async-publisher';

/**
 * An async publisher that can throw errors.
 * Allows iterating over values using for-await-of with try/catch.
 *
 * @example
 * const publisher = new AsyncThrowingPublisher<number>((emit, complete, error) => {
 *   fetchData()
 *     .then(data => {
 *       data.forEach(emit);
 *       complete();
 *     })
 *     .catch(error);
 *   return () => { /* cleanup *\/ };
 * });
 *
 * try {
 *   for await (const value of publisher) {
 *     console.log(value);
 *   }
 * } catch (err) {
 *   console.error('Stream failed:', err);
 * }
 */
export class AsyncThrowingPublisher<T> implements AsyncIterable<T> {
  private subscribe: ThrowingSubscribeFunction<T>;
  private bufferingPolicy: BufferingPolicy;

  constructor(
    subscribe: ThrowingSubscribeFunction<T>,
    bufferingPolicy: BufferingPolicy = 'unbounded'
  ) {
    this.subscribe = subscribe;
    this.bufferingPolicy = bufferingPolicy;
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return new AsyncThrowingPublisherIterator(this.subscribe, this.bufferingPolicy);
  }
}

/**
 * Function signature for subscribing to a throwing data source.
 * Returns an unsubscribe function.
 */
type ThrowingSubscribeFunction<T> = (
  emit: (value: T) => void,
  complete: () => void,
  error: (err: Error) => void
) => () => void;

/**
 * Iterator implementation for AsyncThrowingPublisher
 */
class AsyncThrowingPublisherIterator<T> implements AsyncIterator<T> {
  private buffer: T[] = [];
  private resolvers: Array<{
    resolve: (result: IteratorResult<T>) => void;
    reject: (error: Error) => void;
  }> = [];
  private completed = false;
  private unsubscribe: (() => void) | null = null;
  private pendingError: Error | null = null;
  private bufferingPolicy: BufferingPolicy;

  constructor(
    subscribe: ThrowingSubscribeFunction<T>,
    bufferingPolicy: BufferingPolicy
  ) {
    this.bufferingPolicy = bufferingPolicy;

    this.unsubscribe = subscribe(
      (value) => this.handleValue(value),
      () => this.handleComplete(),
      (err) => this.handleError(err)
    );
  }

  async next(): Promise<IteratorResult<T>> {
    // If there's a pending error, throw it
    if (this.pendingError) {
      const error = this.pendingError;
      this.pendingError = null;
      throw error;
    }

    // If there's a buffered value, return it
    if (this.buffer.length > 0) {
      return { value: this.buffer.shift()!, done: false };
    }

    // If completed, return done
    if (this.completed) {
      return { value: undefined, done: true };
    }

    // Wait for the next value
    return new Promise((resolve, reject) => {
      this.resolvers.push({ resolve, reject });
    });
  }

  async return(): Promise<IteratorResult<T>> {
    this.cleanup();
    return { value: undefined, done: true };
  }

  async throw(error: Error): Promise<IteratorResult<T>> {
    this.cleanup();
    throw error;
  }

  private handleValue(value: T): void {
    const resolver = this.resolvers.shift();

    if (resolver) {
      resolver.resolve({ value, done: false });
    } else {
      // Buffer the value according to policy
      if (this.bufferingPolicy === 'unbounded') {
        this.buffer.push(value);
      } else if (this.bufferingPolicy === 'newest') {
        this.buffer = [value];
      } else if (typeof this.bufferingPolicy === 'object') {
        if (this.buffer.length < this.bufferingPolicy.bufferSize) {
          this.buffer.push(value);
        }
        // Otherwise drop the value
      }
    }
  }

  private handleComplete(): void {
    this.completed = true;

    // Resolve any pending requests with done
    for (const resolver of this.resolvers) {
      resolver.resolve({ value: undefined, done: true });
    }
    this.resolvers = [];

    this.cleanup();
  }

  private handleError(error: Error): void {
    const resolver = this.resolvers.shift();

    if (resolver) {
      // Reject the first pending resolver
      resolver.reject(error);

      // Complete the rest normally
      for (const r of this.resolvers) {
        r.resolve({ value: undefined, done: true });
      }
      this.resolvers = [];
    } else {
      // Store error for next() call
      this.pendingError = error;
    }

    this.completed = true;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a throwing async iterable from a callback-based event source.
 *
 * @param setup - Function that sets up the event listener
 * @returns An async iterable of events that can throw
 */
export function fromThrowingEventCallback<T>(
  setup: (
    emit: (value: T) => void,
    error: (err: Error) => void
  ) => () => void
): AsyncThrowingPublisher<T> {
  return new AsyncThrowingPublisher((emit, complete, error) => {
    const cleanup = setup(emit, error);
    return () => {
      cleanup();
    };
  });
}

/**
 * Creates a throwing async iterable from a promise that resolves to an array.
 *
 * @param promise - Promise that resolves to an array
 * @returns An async iterable that emits each array element
 */
export function fromThrowingPromise<T>(promise: Promise<T[]>): AsyncThrowingPublisher<T> {
  return new AsyncThrowingPublisher((emit, complete, error) => {
    let cancelled = false;

    promise
      .then((values) => {
        if (!cancelled) {
          for (const value of values) {
            emit(value);
          }
          complete();
        }
      })
      .catch((err) => {
        if (!cancelled) {
          error(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      cancelled = true;
    };
  });
}

/**
 * Creates a throwing async iterable from a single promise.
 *
 * @param promise - Promise to convert
 * @returns An async iterable that emits the resolved value or throws
 */
export function fromSingleThrowingPromise<T>(promise: Promise<T>): AsyncThrowingPublisher<T> {
  return new AsyncThrowingPublisher((emit, complete, error) => {
    let cancelled = false;

    promise
      .then((value) => {
        if (!cancelled) {
          emit(value);
          complete();
        }
      })
      .catch((err) => {
        if (!cancelled) {
          error(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      cancelled = true;
    };
  });
}

/**
 * Maps values from one throwing publisher to another.
 *
 * @param source - Source publisher
 * @param transform - Transform function (can throw)
 * @returns A new publisher with transformed values
 */
export function mapThrowing<T, U>(
  source: AsyncThrowingPublisher<T>,
  transform: (value: T) => U
): AsyncThrowingPublisher<U> {
  return new AsyncThrowingPublisher((emit, complete, error) => {
    let cancelled = false;

    (async () => {
      try {
        for await (const value of source) {
          if (cancelled) break;
          try {
            emit(transform(value));
          } catch (err) {
            error(err instanceof Error ? err : new Error(String(err)));
            return;
          }
        }
        if (!cancelled) complete();
      } catch (err) {
        if (!cancelled) {
          error(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });
}

/**
 * Filters values from a throwing publisher.
 *
 * @param source - Source publisher
 * @param predicate - Filter predicate (can throw)
 * @returns A new publisher with filtered values
 */
export function filterThrowing<T>(
  source: AsyncThrowingPublisher<T>,
  predicate: (value: T) => boolean
): AsyncThrowingPublisher<T> {
  return new AsyncThrowingPublisher((emit, complete, error) => {
    let cancelled = false;

    (async () => {
      try {
        for await (const value of source) {
          if (cancelled) break;
          try {
            if (predicate(value)) {
              emit(value);
            }
          } catch (err) {
            error(err instanceof Error ? err : new Error(String(err)));
            return;
          }
        }
        if (!cancelled) complete();
      } catch (err) {
        if (!cancelled) {
          error(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });
}

