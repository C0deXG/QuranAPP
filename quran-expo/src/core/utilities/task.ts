/**
 * Task+Extension.swift → task.ts
 *
 * Task/async utility functions translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-05-02.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * A cancellable task wrapper that automatically cancels when disposed.
 * Equivalent to Swift's CancellableTask.
 */
export class CancellableTask {
  private abortController: AbortController;
  private _isCancelled = false;

  constructor() {
    this.abortController = new AbortController();
  }

  /**
   * Creates a new CancellableTask.
   */
  static create(): CancellableTask {
    return new CancellableTask();
  }

  /**
   * Gets the abort signal for this task.
   * Pass this to fetch or other cancelable operations.
   */
  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Whether this task has been cancelled.
   */
  get isCancelled(): boolean {
    return this._isCancelled;
  }

  /**
   * Cancels the task.
   */
  cancel(): void {
    if (!this._isCancelled) {
      this._isCancelled = true;
      this.abortController.abort();
    }
  }

  /**
   * Throws if the task has been cancelled.
   * Call this periodically in long-running operations.
   */
  throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new TaskCancelledError();
    }
  }
}

/**
 * Error thrown when a task is cancelled.
 */
export class TaskCancelledError extends Error {
  constructor() {
    super('Task was cancelled');
    this.name = 'TaskCancelledError';
  }
}

/**
 * A set of cancellable tasks that can be managed together.
 * All tasks are cancelled when the set is cleared.
 */
export class CancellableTaskSet {
  private tasks = new Set<CancellableTask>();

  /**
   * Adds a task to the set.
   */
  add(task: CancellableTask): void {
    this.tasks.add(task);
  }

  /**
   * Creates and adds a new cancellable task.
   *
   * @param operation - The async operation to run
   * @returns The created task
   */
  task(operation: (task: CancellableTask) => Promise<void>): CancellableTask {
    const task = new CancellableTask();
    this.tasks.add(task);

    // Run the operation and remove the task when done
    operation(task)
      .catch(() => {
        // Ignore errors
      })
      .finally(() => {
        this.tasks.delete(task);
      });

    return task;
  }

  /**
   * Cancels all tasks in the set.
   */
  cancelAll(): void {
    for (const task of this.tasks) {
      task.cancel();
    }
    this.tasks.clear();
  }

  /**
   * Gets the number of active tasks.
   */
  get size(): number {
    return this.tasks.size;
  }
}

/**
 * Collects all elements from an async iterable into an array.
 * Equivalent to Swift's AsyncSequence.collect().
 *
 * @param asyncIterable - The async iterable to collect
 * @returns Promise with array of all elements
 *
 * @example
 * const items = await collect(asyncGenerator());
 */
export async function collect<T>(asyncIterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of asyncIterable) {
    result.push(item);
  }
  return result;
}

/**
 * Runs an async operation and returns the result, with cancellation support.
 *
 * @param task - The cancellable task context
 * @param operation - The async operation
 * @returns Promise with the result
 */
export async function runWithTask<T>(
  task: CancellableTask,
  operation: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  task.throwIfCancelled();
  return operation(task.signal);
}

/**
 * Creates a promise that resolves after a delay, but respects cancellation.
 *
 * @param ms - Milliseconds to wait
 * @param task - Optional cancellable task
 * @returns Promise that resolves after delay
 */
export function delay(ms: number, task?: CancellableTask): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (task) {
      const checkCancellation = () => {
        if (task.isCancelled) {
          clearTimeout(timeout);
          reject(new TaskCancelledError());
        }
      };

      // Check periodically
      const interval = setInterval(() => {
        checkCancellation();
        if (task.isCancelled) {
          clearInterval(interval);
        }
      }, 50);

      // Clean up interval when done
      setTimeout(() => {
        clearInterval(interval);
      }, ms + 10);
    }
  });
}

/**
 * Type for cleanup function
 */
type CleanupFn = () => void;

/**
 * Creates a subscription-like pattern for cleanup.
 * Returns a function that adds cleanup handlers.
 */
export function createCleanupBag(): {
  add: (cleanup: CleanupFn) => void;
  dispose: () => void;
} {
  const cleanups: CleanupFn[] = [];

  return {
    add: (cleanup: CleanupFn) => {
      cleanups.push(cleanup);
    },
    dispose: () => {
      for (const cleanup of cleanups) {
        try {
          cleanup();
        } catch {
          // Ignore cleanup errors
        }
      }
      cleanups.length = 0;
    },
  };
}

