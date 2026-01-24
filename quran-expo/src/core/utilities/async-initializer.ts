/**
 * AsyncInitializer.swift → async-initializer.ts
 *
 * Async initialization pattern translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-11-26.
 *
 * This pattern allows code to wait for an initialization to complete
 * before proceeding. Useful for lazy async initialization.
 */

/**
 * Manages async initialization state.
 * Allows multiple awaiters to wait for initialization to complete.
 *
 * Equivalent to Swift's AsyncInitializer struct.
 *
 * @example
 * class DatabaseService {
 *   private initializer = new AsyncInitializer();
 *
 *   async initialize() {
 *     await this.connectToDatabase();
 *     this.initializer.markInitialized();
 *   }
 *
 *   async query(sql: string) {
 *     await this.initializer.awaitInitialization();
 *     // Now safe to query
 *   }
 * }
 */
export class AsyncInitializer {
  private _initialized = false;
  private resolvers: Array<() => void> = [];

  /**
   * Whether initialization has completed.
   */
  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Marks the initialization as complete.
   * Resolves all pending awaiters.
   */
  markInitialized(): void {
    if (this._initialized) {
      return;
    }

    this._initialized = true;

    // Resolve all pending awaiters
    for (const resolve of this.resolvers) {
      resolve();
    }
    this.resolvers = [];
  }

  /**
   * Waits for initialization to complete.
   * Returns immediately if already initialized.
   */
  async awaitInitialization(): Promise<void> {
    if (this._initialized) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.resolvers.push(resolve);
    });
  }

  /**
   * Resets the initializer to uninitialized state.
   * Note: This will NOT resolve any pending awaiters.
   */
  reset(): void {
    this._initialized = false;
    this.resolvers = [];
  }
}

/**
 * A variant that can hold a value once initialized.
 *
 * @example
 * const configLoader = new AsyncValueInitializer<Config>();
 *
 * // In initialization code:
 * const config = await loadConfig();
 * configLoader.initialize(config);
 *
 * // In other code:
 * const config = await configLoader.awaitValue();
 */
export class AsyncValueInitializer<T> {
  private _value: T | undefined;
  private _initialized = false;
  private resolvers: Array<(value: T) => void> = [];

  /**
   * Whether initialization has completed.
   */
  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Gets the value if initialized, undefined otherwise.
   */
  get value(): T | undefined {
    return this._value;
  }

  /**
   * Initializes with a value.
   * Resolves all pending awaiters with the value.
   */
  initialize(value: T): void {
    if (this._initialized) {
      return;
    }

    this._value = value;
    this._initialized = true;

    // Resolve all pending awaiters
    for (const resolve of this.resolvers) {
      resolve(value);
    }
    this.resolvers = [];
  }

  /**
   * Waits for initialization and returns the value.
   * Returns immediately if already initialized.
   */
  async awaitValue(): Promise<T> {
    if (this._initialized) {
      return this._value!;
    }

    return new Promise<T>((resolve) => {
      this.resolvers.push(resolve);
    });
  }

  /**
   * Resets the initializer to uninitialized state.
   */
  reset(): void {
    this._value = undefined;
    this._initialized = false;
    this.resolvers = [];
  }
}

/**
 * Creates a lazy async value that is computed once on first access.
 *
 * @param factory - Async function that produces the value
 * @returns A function that returns the cached value
 *
 * @example
 * const getConfig = lazyAsync(async () => {
 *   return await loadConfigFromServer();
 * });
 *
 * // First call triggers the load
 * const config1 = await getConfig();
 * // Second call returns cached value
 * const config2 = await getConfig();
 */
export function lazyAsync<T>(factory: () => Promise<T>): () => Promise<T> {
  const initializer = new AsyncValueInitializer<T>();
  let loading = false;

  return async () => {
    if (initializer.initialized) {
      return initializer.value!;
    }

    if (!loading) {
      loading = true;
      try {
        const value = await factory();
        initializer.initialize(value);
      } catch (error) {
        loading = false;
        throw error;
      }
    }

    return initializer.awaitValue();
  };
}

/**
 * Creates a lazy sync value that is computed once on first access.
 *
 * @param factory - Function that produces the value
 * @returns A function that returns the cached value
 */
export function lazy<T>(factory: () => T): () => T {
  let value: T | undefined;
  let initialized = false;

  return () => {
    if (!initialized) {
      value = factory();
      initialized = true;
    }
    return value!;
  };
}

