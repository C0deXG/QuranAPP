/**
 * Locking.swift → locking.ts
 *
 * Critical state management utilities translated from quran-ios Core/Utilities
 * Based on: https://github.com/apple/swift-async-algorithms
 *
 * Note: JavaScript is single-threaded, so true locking isn't needed.
 * However, we still need to manage state access in async contexts.
 * This implementation provides similar semantics for consistent API usage.
 */

/**
 * Manages state that needs to be accessed atomically.
 * In JavaScript, this primarily helps with async operation ordering.
 *
 * Equivalent to Swift's ManagedCriticalState.
 *
 * @example
 * const state = new ManagedCriticalState({ count: 0 });
 *
 * // Access state atomically
 * state.withCriticalRegion((state) => {
 *   state.count += 1;
 *   return state.count;
 * });
 */
export class ManagedCriticalState<State> {
  private state: State;

  constructor(initial: State) {
    this.state = initial;
  }

  /**
   * Executes a function with exclusive access to the state.
   * The function receives a mutable reference to the state.
   *
   * @param critical - Function that operates on the state
   * @returns The value returned by the critical function
   */
  withCriticalRegion<R>(critical: (state: State) => R): R {
    return critical(this.state);
  }

  /**
   * Gets a snapshot of the current state.
   * Note: For objects, this returns a reference, not a copy.
   */
  get current(): State {
    return this.state;
  }

  /**
   * Sets the state directly.
   */
  set current(newState: State) {
    this.state = newState;
  }
}

/**
 * A simple mutex-like construct for async operations.
 * Ensures only one async operation can hold the lock at a time.
 *
 * @example
 * const mutex = new AsyncMutex();
 *
 * async function criticalSection() {
 *   const release = await mutex.acquire();
 *   try {
 *     // ... critical work
 *   } finally {
 *     release();
 *   }
 * }
 *
 * // Or use withLock for automatic release:
 * await mutex.withLock(async () => {
 *   // ... critical work
 * });
 */
export class AsyncMutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  /**
   * Acquires the lock. Returns a release function.
   */
  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => this.release();
    }

    // Wait in queue
    return new Promise((resolve) => {
      this.waitQueue.push(() => {
        resolve(() => this.release());
      });
    });
  }

  /**
   * Releases the lock.
   */
  private release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }

  /**
   * Executes an async function with the lock held.
   *
   * @param body - Async function to execute
   * @returns The value returned by the function
   */
  async withLock<T>(body: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await body();
    } finally {
      release();
    }
  }

  /**
   * Executes a sync function with the lock held.
   *
   * @param body - Function to execute
   * @returns The value returned by the function
   */
  withLockSync<T>(body: () => T): T {
    // In JS, sync code can't be interrupted, so this is straightforward
    return body();
  }

  /**
   * Whether the lock is currently held.
   */
  get isLocked(): boolean {
    return this.locked;
  }
}

/**
 * A read-write lock for async operations.
 * Allows multiple readers or a single writer.
 */
export class AsyncReadWriteLock {
  private readers = 0;
  private writer = false;
  private writerQueue: Array<() => void> = [];
  private readerQueue: Array<() => void> = [];

  /**
   * Acquires a read lock.
   */
  async acquireRead(): Promise<() => void> {
    if (!this.writer && this.writerQueue.length === 0) {
      this.readers++;
      return () => this.releaseRead();
    }

    return new Promise((resolve) => {
      this.readerQueue.push(() => {
        this.readers++;
        resolve(() => this.releaseRead());
      });
    });
  }

  /**
   * Releases a read lock.
   */
  private releaseRead(): void {
    this.readers--;
    this.processQueue();
  }

  /**
   * Acquires a write lock.
   */
  async acquireWrite(): Promise<() => void> {
    if (!this.writer && this.readers === 0) {
      this.writer = true;
      return () => this.releaseWrite();
    }

    return new Promise((resolve) => {
      this.writerQueue.push(() => {
        this.writer = true;
        resolve(() => this.releaseWrite());
      });
    });
  }

  /**
   * Releases a write lock.
   */
  private releaseWrite(): void {
    this.writer = false;
    this.processQueue();
  }

  /**
   * Processes the wait queues.
   */
  private processQueue(): void {
    // Prioritize writers
    if (!this.writer && this.readers === 0 && this.writerQueue.length > 0) {
      const next = this.writerQueue.shift();
      next?.();
    } else if (!this.writer && this.writerQueue.length === 0) {
      // Allow all waiting readers
      while (this.readerQueue.length > 0) {
        const next = this.readerQueue.shift();
        next?.();
      }
    }
  }

  /**
   * Executes an async function with a read lock.
   */
  async withReadLock<T>(body: () => Promise<T>): Promise<T> {
    const release = await this.acquireRead();
    try {
      return await body();
    } finally {
      release();
    }
  }

  /**
   * Executes an async function with a write lock.
   */
  async withWriteLock<T>(body: () => Promise<T>): Promise<T> {
    const release = await this.acquireWrite();
    try {
      return await body();
    } finally {
      release();
    }
  }
}

/**
 * Protected wrapper for thread-safe value access.
 * Equivalent to Swift's Protected<T> class from Core/Locking.
 *
 * In JavaScript's single-threaded model, this provides:
 * - Consistent API with iOS codebase
 * - Atomic-like semantics for state updates
 * - Clean encapsulation of mutable state
 *
 * @example
 * const counter = new Protected(0);
 *
 * // Get/set value
 * console.log(counter.value); // 0
 * counter.value = 5;
 *
 * // Atomic update with sync
 * counter.sync((val) => {
 *   return val + 1;
 * });
 */
export class Protected<T> {
  private _data: T;

  constructor(data: T) {
    this._data = data;
  }

  /**
   * Gets the current value.
   */
  get value(): T {
    return this._data;
  }

  /**
   * Sets the value.
   */
  set value(newValue: T) {
    this._data = newValue;
  }

  /**
   * Executes a function with mutable access to the value.
   * The function can modify the value and return a result.
   *
   * @param body - Function that receives current value and can modify it
   * @returns The value returned by the function
   */
  sync<U>(body: (value: T) => U): U {
    return body(this._data);
  }

  /**
   * Executes a function that can mutate the value in place.
   *
   * @param body - Function that receives and can mutate the value
   */
  mutate(body: (value: T) => void): void {
    body(this._data);
  }

  /**
   * Updates the value using a transform function.
   *
   * @param transform - Function that takes current value and returns new value
   */
  update(transform: (value: T) => T): void {
    this._data = transform(this._data);
  }
}

/**
 * A simple semaphore for limiting concurrent operations.
 */
export class AsyncSemaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquires a permit.
   */
  async acquire(): Promise<() => void> {
    if (this.permits > 0) {
      this.permits--;
      return () => this.release();
    }

    return new Promise((resolve) => {
      this.waitQueue.push(() => {
        resolve(() => this.release());
      });
    });
  }

  /**
   * Releases a permit.
   */
  private release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }

  /**
   * Executes an async function with a permit.
   */
  async withPermit<T>(body: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await body();
    } finally {
      release();
    }
  }

  /**
   * Current number of available permits.
   */
  get available(): number {
    return this.permits;
  }
}

