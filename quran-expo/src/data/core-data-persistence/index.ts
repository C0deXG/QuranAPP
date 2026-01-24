/**
 * CoreDataPersistence - SQLite stack for annotations
 *
 * Translated from quran-ios/Data/CoreDataPersistence
 *
 * This module provides:
 * - Annotations database management
 * - Query building utilities
 * - Reactive query publishers
 */

// Annotations database
export type {
  DatabaseChangeListener,
  EntityUniquifier,
  ExecuteSqlFn,
} from './annotations-database';
export {
  AnnotationsDatabase,
  getAnnotationsDatabase,
  setAnnotationsDatabase,
  resetAnnotationsDatabase,
} from './annotations-database';

// Query builder
export type { SortDescriptor, Predicate } from './query-builder';
export {
  // Sort descriptors
  sortBy,
  ascending,
  descending,
  toOrderByClause,
  // Predicates
  equals,
  notEquals,
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  inList,
  like,
  isNull,
  isNotNull,
  between,
  and,
  or,
  not,
  toWhereClause,
  // Query builders
  buildSelectQuery,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildCountQuery,
} from './query-builder';

// Database publisher
export type {
  ResultsCallback,
  Unsubscribe,
  QueryConfig,
  UseQueryState,
} from './database-publisher';
export {
  DatabasePublisher,
  createPublisher,
  watchAll,
  watchWhere,
  createQueryState,
} from './database-publisher';

