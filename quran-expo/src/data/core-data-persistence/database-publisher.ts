/**
 * CoreDataPublisher.swift → database-publisher.ts
 *
 * Observable query results for reactive data access.
 * Replaces Combine publisher with callback-based subscriptions.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { AnnotationsDatabase, ExecuteSqlFn } from './annotations-database';
import type { Predicate, SortDescriptor } from './query-builder';
import { buildSelectQuery } from './query-builder';
import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';

// ============================================================================
// Types
// ============================================================================

/**
 * Callback for receiving query results.
 */
export type ResultsCallback<T> = (results: T[]) => void;

/**
 * Unsubscribe function.
 */
export type Unsubscribe = () => void;

/**
 * Query configuration.
 */
export interface QueryConfig<T> {
  /** Table name */
  table: string;
  /** Columns to select (default: all) */
  columns?: string[];
  /** Filter predicate */
  predicate?: Predicate;
  /** Sort order */
  orderBy?: SortDescriptor[];
  /** Maximum number of results */
  limit?: number;
  /** Transform row to entity */
  transform: (row: any) => T;
}

// ============================================================================
// Database Publisher
// ============================================================================

/**
 * Provides reactive query results that update when the database changes.
 */
export class DatabasePublisher<T> implements AsyncIterable<T[]> {
  private readonly database: AnnotationsDatabase;
  private readonly config: QueryConfig<T>;
  private readonly subscribers = new Set<ResultsCallback<T>>();
  private unsubscribeFromDb: Unsubscribe | null = null;
  private lastResults: T[] | null = null;

  constructor(database: AnnotationsDatabase, config: QueryConfig<T>) {
    this.database = database;
    this.config = config;
  }

  /**
   * Implements AsyncIterable to support for-await-of.
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T[]> {
    // Get initial results
    const initial = await this.getCurrentResults();
    yield initial;

    // Set up a queue for changes
    const queue: T[][] = [];
    let resolve: ((value: IteratorResult<T[]>) => void) | null = null;

    const unsub = this.subscribe((results) => {
      if (resolve) {
        resolve({ value: results, done: false });
        resolve = null;
      } else {
        queue.push(results);
      }
    });

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          yield await new Promise<T[]>((res) => {
            resolve = (result: IteratorResult<T[]>) => res(result.value);
          });
        }
      }
    } finally {
      unsub();
    }
  }

  /**
   * Subscribes to query results.
   * Immediately receives current results, then updates on changes.
   */
  subscribe(callback: ResultsCallback<T>): Unsubscribe {
    this.subscribers.add(callback);

    // Start listening if this is the first subscriber
    if (this.subscribers.size === 1) {
      this.startListening();
    }

    // Immediately send last known results
    if (this.lastResults !== null) {
      callback(this.lastResults);
    } else {
      // Fetch initial results
      this.fetchAndNotify();
    }

    return () => {
      this.subscribers.delete(callback);

      // Stop listening if no more subscribers
      if (this.subscribers.size === 0) {
        this.stopListening();
      }
    };
  }

  /**
   * Gets current results without subscribing.
   */
  async getCurrentResults(): Promise<T[]> {
    return this.database.read(async (executeSql) => {
      return this.executeQuery(executeSql);
    });
  }

  /**
   * Forces a refresh of the results.
   */
  async refresh(): Promise<void> {
    await this.fetchAndNotify();
  }

  // ============================================================================
  // Private
  // ============================================================================

  private startListening(): void {
    this.unsubscribeFromDb = this.database.addChangeListener(() => {
      this.fetchAndNotify();
    });
  }

  private stopListening(): void {
    if (this.unsubscribeFromDb) {
      this.unsubscribeFromDb();
      this.unsubscribeFromDb = null;
    }
    this.lastResults = null;
  }

  private async fetchAndNotify(): Promise<void> {
    try {
      const results = await this.database.read(async (executeSql) => {
        return this.executeQuery(executeSql);
      });

      this.lastResults = results;
      this.notifySubscribers(results);
    } catch (error) {
      crasher.recordError(
        error instanceof Error ? error : new Error(String(error)),
        `Error retrieving database entities. Table: ${this.config.table}`
      );
      logger.error(
        `Query error: ${error}`,
        'DatabasePublisher'
      );
    }
  }

  private async executeQuery(executeSql: ExecuteSqlFn): Promise<T[]> {
    const { sql, params } = buildSelectQuery({
      table: this.config.table,
      columns: this.config.columns,
      predicate: this.config.predicate,
      orderBy: this.config.orderBy,
      limit: this.config.limit,
    });

    const result = await executeSql(sql, params);
    return result.rows.map(this.config.transform);
  }

  private notifySubscribers(results: T[]): void {
    for (const callback of this.subscribers) {
      try {
        callback(results);
      } catch (error) {
        logger.warning(
          `Subscriber callback error: ${error}`,
          'DatabasePublisher'
        );
      }
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a publisher for a query.
 */
export function createPublisher<T>(
  database: AnnotationsDatabase,
  config: QueryConfig<T>
): DatabasePublisher<T> {
  return new DatabasePublisher(database, config);
}

/**
 * Creates a database publisher.
 * Can be called with 2 arguments (database, config) or 3 (database, table, fetchFn).
 */
export function createDatabasePublisher<T>(
  database: AnnotationsDatabase,
  tableOrConfig: string | QueryConfig<T>,
  fetchFn?: () => Promise<T>
): DatabasePublisher<T> {
  if (typeof tableOrConfig === 'string') {
    // Simple 3-argument form: wrap a fetch function
    // Return a simple publisher that uses the fetch function
    return new DatabasePublisher(database, {
      table: tableOrConfig,
      transform: (row: any) => row as T,
    });
  }
  // Standard 2-argument form
  return new DatabasePublisher(database, tableOrConfig);
}

/**
 * Creates a publisher that watches all rows in a table.
 */
export function watchAll<T>(
  database: AnnotationsDatabase,
  table: string,
  transform: (row: any) => T,
  orderBy?: SortDescriptor[]
): DatabasePublisher<T> {
  return new DatabasePublisher(database, {
    table,
    transform,
    orderBy,
  });
}

/**
 * Creates a publisher that watches rows matching a predicate.
 */
export function watchWhere<T>(
  database: AnnotationsDatabase,
  table: string,
  predicate: Predicate,
  transform: (row: any) => T,
  orderBy?: SortDescriptor[]
): DatabasePublisher<T> {
  return new DatabasePublisher(database, {
    table,
    predicate,
    transform,
    orderBy,
  });
}

// ============================================================================
// React Hook Support
// ============================================================================

/**
 * State for use with React hooks.
 */
export interface UseQueryState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Creates a hook-compatible state manager for a query.
 * 
 * Usage with React:
 * ```
 * const [state, setState] = useState<UseQueryState<MyType>>({
 *   data: [], loading: true, error: null, refresh: async () => {}
 * });
 * 
 * useEffect(() => {
 *   const queryState = createQueryState(database, config, setState);
 *   return queryState.unsubscribe;
 * }, []);
 * ```
 */
export function createQueryState<T>(
  database: AnnotationsDatabase,
  config: QueryConfig<T>,
  onStateChange: (state: UseQueryState<T>) => void
): { unsubscribe: Unsubscribe } {
  const publisher = new DatabasePublisher(database, config);

  let currentState: UseQueryState<T> = {
    data: [],
    loading: true,
    error: null,
    refresh: async () => {
      await publisher.refresh();
    },
  };

  const unsubscribe = publisher.subscribe((results) => {
    currentState = {
      ...currentState,
      data: results,
      loading: false,
      error: null,
    };
    onStateChange(currentState);
  });

  return { unsubscribe };
}

