/**
 * AsyncPublisher.swift → async-publisher.ts
 *
 * Async publisher utilities translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-05-28.
 *
 * This provides a way to convert various data sources into async iterables,
 * similar to how Swift converts Combine Publishers to AsyncSequence.
 */

/**
 * Buffering policy for async streams
 */
export type BufferingPolicy = 'unbounded' | { bufferSize: number } | 'newest';

/**
 * An async publisher that wraps a subscription-based data source.
 * Allows iterating over values using for-await-of.
 *
 * @example
 * const publisher = new AsyncPublisher<number>((emit, complete) => {
 *   const interval = setInterval(() => emit(Math.random()), 1000);
 *   return () => clearInterval(interval);
 * });
 *
 * for await (const value of publisher) {
 *   console.log(value);
 * }
 */
export class AsyncPublisher<T> implements AsyncIterable<T> {
  private subscribe: SubscribeFunction<T>;
  private bufferingPolicy: BufferingPolicy;
  private emitter: ((value: T) => void) | null = null;
  private completer: (() => void) | null = null;
  private listeners: Set<(value: T) => void> = new Set();
  private completionListeners: Set<() => void> = new Set();

  constructor(
    subscribe: SubscribeFunction<T>,
    bufferingPolicy: BufferingPolicy = 'unbounded'
  ) {
    this.subscribe = subscribe;
    this.bufferingPolicy = bufferingPolicy;
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return new AsyncPublisherIterator(this.subscribe, this.bufferingPolicy);
  }

  /**
   * Sends a value to all listeners.
   */
  send(value: T): void {
    for (const listener of this.listeners) {
      listener(value);
    }
    this.emitter?.(value);
  }

  /**
   * Completes the publisher.
   */
  complete(): void {
    for (const listener of this.completionListeners) {
      listener();
    }
    this.completer?.();
  }

  /**
   * Adds a listener for values.
   */
  addListener(listener: (value: T) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

/**
 * Function signature for subscribing to a data source.
 * Returns an unsubscribe function.
 */
type SubscribeFunction<T> = (
  emit: (value: T) => void,
  complete: () => void,
  error: (err: Error) => void
) => () => void;

/**
 * Iterator implementation for AsyncPublisher
 */
class AsyncPublisherIterator<T> implements AsyncIterator<T> {
  private buffer: T[] = [];
  private resolvers: Array<{
    resolve: (result: IteratorResult<T>) => void;
    reject: (error: Error) => void;
  }> = [];
  private completed = false;
  private unsubscribe: (() => void) | null = null;
  private error: Error | null = null;
  private bufferingPolicy: BufferingPolicy;

  constructor(
    subscribe: SubscribeFunction<T>,
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
    // If there's a buffered value, return it
    if (this.buffer.length > 0) {
      return { value: this.buffer.shift()!, done: false };
    }

    // If completed, return done
    if (this.completed) {
      return { value: undefined, done: true };
    }

    // If there's an error, throw it
    if (this.error) {
      throw this.error;
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
    this.error = error;

    // Reject any pending requests
    for (const resolver of this.resolvers) {
      resolver.reject(error);
    }
    this.resolvers = [];

    this.cleanup();
  }

  private cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

/**
 * Creates an async iterable from a callback-based event source.
 *
 * @param setup - Function that sets up the event listener
 * @returns An async iterable of events
 *
 * @example
 * const clicks = fromEventCallback<MouseEvent>((emit) => {
 *   document.addEventListener('click', emit);
 *   return () => document.removeEventListener('click', emit);
 * });
 *
 * for await (const event of clicks) {
 *   console.log('Clicked at', event.clientX, event.clientY);
 * }
 */
export function fromEventCallback<T>(
  setup: (emit: (value: T) => void) => () => void
): AsyncPublisher<T> {
  return new AsyncPublisher((emit, complete) => {
    const cleanup = setup(emit);
    return () => {
      cleanup();
    };
  });
}

/**
 * Creates an async iterable that emits values at regular intervals.
 *
 * @param intervalMs - Interval in milliseconds
 * @param getValue - Optional function to generate values (defaults to counter)
 * @returns An async iterable of values
 */
export function interval<T = number>(
  intervalMs: number,
  getValue?: (count: number) => T
): AsyncPublisher<T> {
  let count = 0;
  const defaultGetValue = () => count as unknown as T;
  const valueGetter = getValue ?? defaultGetValue;

  return new AsyncPublisher((emit) => {
    const id = setInterval(() => {
      emit(valueGetter(count));
      count++;
    }, intervalMs);
    return () => clearInterval(id);
  });
}

/**
 * Creates an async iterable that emits a single value after a delay.
 *
 * @param delayMs - Delay in milliseconds
 * @param value - Value to emit
 * @returns An async iterable that emits once and completes
 */
export function after<T>(delayMs: number, value: T): AsyncPublisher<T> {
  return new AsyncPublisher((emit, complete) => {
    const id = setTimeout(() => {
      emit(value);
      complete();
    }, delayMs);
    return () => clearTimeout(id);
  });
}

/**
 * Creates an async iterable from an array of values.
 *
 * @param values - Array of values to emit
 * @returns An async iterable of the values
 */
export function fromArray<T>(values: T[]): AsyncPublisher<T> {
  return new AsyncPublisher((emit, complete) => {
    for (const value of values) {
      emit(value);
    }
    complete();
    return () => {};
  });
}

/**
 * Creates an async iterable from a promise.
 *
 * @param promise - Promise to convert
 * @returns An async iterable that emits the resolved value
 */
export function fromPromise<T>(promise: Promise<T>): AsyncPublisher<T> {
  return new AsyncPublisher((emit, complete, error) => {
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
 * Combines multiple async iterables, emitting values from all of them.
 *
 * @param sources - Array of async iterables
 * @returns An async iterable that emits from all sources
 */
export function merge<T>(...sources: AsyncIterable<T>[]): AsyncPublisher<T> {
  return new AsyncPublisher((emit, complete, error) => {
    let completed = 0;
    const controllers: AbortController[] = [];

    for (const source of sources) {
      const controller = new AbortController();
      controllers.push(controller);

      (async () => {
        try {
          for await (const value of source) {
            if (controller.signal.aborted) break;
            emit(value);
          }
          completed++;
          if (completed === sources.length) {
            complete();
          }
        } catch (err) {
          error(err instanceof Error ? err : new Error(String(err)));
        }
      })();
    }

    return () => {
      for (const controller of controllers) {
        controller.abort();
      }
    };
  });
}

/**
 * Creates an async publisher from an emitter function.
 * This is an alias for the AsyncPublisher constructor for convenience.
 *
 * @param emitter - Function that emits values
 * @returns An async publisher
 */
export function createAsyncPublisher<T>(
  emitter: (emit: (value: T) => void) => void | (() => void)
): AsyncPublisher<T> {
  return new AsyncPublisher((emit, complete) => {
    const cleanup = emitter(emit);
    return () => {
      if (cleanup) cleanup();
    };
  });
}

