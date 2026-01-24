/**
 * CoreDataTypes.swift → query-builder.ts
 *
 * Query building utilities for SQLite.
 * Replaces NSPredicate and NSSortDescriptor.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Sort Descriptor
// ============================================================================

/**
 * Represents a sort order.
 */
export interface SortDescriptor {
  readonly column: string;
  readonly ascending: boolean;
}

/**
 * Creates a sort descriptor.
 */
export function sortBy(column: string, ascending: boolean = true): SortDescriptor {
  return { column, ascending };
}

/**
 * Creates an ascending sort descriptor.
 */
export function ascending(column: string): SortDescriptor {
  return { column, ascending: true };
}

/**
 * Creates a descending sort descriptor.
 */
export function descending(column: string): SortDescriptor {
  return { column, ascending: false };
}

/**
 * Converts sort descriptors to SQL ORDER BY clause.
 */
export function toOrderByClause(descriptors: SortDescriptor[]): string {
  if (descriptors.length === 0) return '';

  const parts = descriptors.map(
    (d) => `${d.column} ${d.ascending ? 'ASC' : 'DESC'}`
  );
  return `ORDER BY ${parts.join(', ')}`;
}

// ============================================================================
// Predicate Builder
// ============================================================================

/**
 * A predicate condition.
 */
export interface Predicate {
  readonly sql: string;
  readonly params: any[];
}

/**
 * Creates an equals predicate.
 */
export function equals(column: string, value: any): Predicate {
  return {
    sql: `${column} = ?`,
    params: [value],
  };
}

/**
 * Creates a not equals predicate.
 */
export function notEquals(column: string, value: any): Predicate {
  return {
    sql: `${column} != ?`,
    params: [value],
  };
}

/**
 * Creates a greater than predicate.
 */
export function greaterThan(column: string, value: any): Predicate {
  return {
    sql: `${column} > ?`,
    params: [value],
  };
}

/**
 * Creates a greater than or equal predicate.
 */
export function greaterThanOrEqual(column: string, value: any): Predicate {
  return {
    sql: `${column} >= ?`,
    params: [value],
  };
}

/**
 * Creates a less than predicate.
 */
export function lessThan(column: string, value: any): Predicate {
  return {
    sql: `${column} < ?`,
    params: [value],
  };
}

/**
 * Creates a less than or equal predicate.
 */
export function lessThanOrEqual(column: string, value: any): Predicate {
  return {
    sql: `${column} <= ?`,
    params: [value],
  };
}

/**
 * Creates an IN predicate.
 */
export function inList(column: string, values: any[]): Predicate {
  const placeholders = values.map(() => '?').join(', ');
  return {
    sql: `${column} IN (${placeholders})`,
    params: values,
  };
}

/**
 * Creates a LIKE predicate.
 */
export function like(column: string, pattern: string): Predicate {
  return {
    sql: `${column} LIKE ?`,
    params: [pattern],
  };
}

/**
 * Creates an IS NULL predicate.
 */
export function isNull(column: string): Predicate {
  return {
    sql: `${column} IS NULL`,
    params: [],
  };
}

/**
 * Creates an IS NOT NULL predicate.
 */
export function isNotNull(column: string): Predicate {
  return {
    sql: `${column} IS NOT NULL`,
    params: [],
  };
}

/**
 * Creates a BETWEEN predicate.
 */
export function between(column: string, min: any, max: any): Predicate {
  return {
    sql: `${column} BETWEEN ? AND ?`,
    params: [min, max],
  };
}

/**
 * Combines predicates with AND.
 */
export function and(...predicates: Predicate[]): Predicate {
  if (predicates.length === 0) {
    return { sql: '1=1', params: [] };
  }
  if (predicates.length === 1) {
    return predicates[0];
  }

  const sql = predicates.map((p) => `(${p.sql})`).join(' AND ');
  const params = predicates.flatMap((p) => p.params);
  return { sql, params };
}

/**
 * Combines predicates with OR.
 */
export function or(...predicates: Predicate[]): Predicate {
  if (predicates.length === 0) {
    return { sql: '1=0', params: [] };
  }
  if (predicates.length === 1) {
    return predicates[0];
  }

  const sql = predicates.map((p) => `(${p.sql})`).join(' OR ');
  const params = predicates.flatMap((p) => p.params);
  return { sql, params };
}

/**
 * Negates a predicate.
 */
export function not(predicate: Predicate): Predicate {
  return {
    sql: `NOT (${predicate.sql})`,
    params: predicate.params,
  };
}

/**
 * Converts a predicate to a WHERE clause.
 */
export function toWhereClause(predicate: Predicate): {
  sql: string;
  params: any[];
} {
  return {
    sql: `WHERE ${predicate.sql}`,
    params: predicate.params,
  };
}

// ============================================================================
// Query Builder
// ============================================================================

/**
 * Builds a SELECT query.
 */
export function buildSelectQuery(options: {
  table: string;
  columns?: string[];
  predicate?: Predicate;
  orderBy?: SortDescriptor[];
  limit?: number;
  offset?: number;
}): { sql: string; params: any[] } {
  const columns = options.columns?.join(', ') ?? '*';
  let sql = `SELECT ${columns} FROM ${options.table}`;
  let params: any[] = [];

  if (options.predicate) {
    sql += ` WHERE ${options.predicate.sql}`;
    params = options.predicate.params;
  }

  if (options.orderBy && options.orderBy.length > 0) {
    sql += ` ${toOrderByClause(options.orderBy)}`;
  }

  if (options.limit !== undefined) {
    sql += ` LIMIT ${options.limit}`;
  }

  if (options.offset !== undefined) {
    sql += ` OFFSET ${options.offset}`;
  }

  return { sql, params };
}

/**
 * Builds an INSERT query.
 */
export function buildInsertQuery(
  table: string,
  data: Record<string, any>
): { sql: string; params: any[] } {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((c) => data[c]);

  return {
    sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    params: values,
  };
}

/**
 * Builds an UPDATE query.
 */
export function buildUpdateQuery(
  table: string,
  data: Record<string, any>,
  predicate: Predicate
): { sql: string; params: any[] } {
  const columns = Object.keys(data);
  const setClause = columns.map((c) => `${c} = ?`).join(', ');
  const values = columns.map((c) => data[c]);

  return {
    sql: `UPDATE ${table} SET ${setClause} WHERE ${predicate.sql}`,
    params: [...values, ...predicate.params],
  };
}

/**
 * Builds a DELETE query.
 */
export function buildDeleteQuery(
  table: string,
  predicate: Predicate
): { sql: string; params: any[] } {
  return {
    sql: `DELETE FROM ${table} WHERE ${predicate.sql}`,
    params: predicate.params,
  };
}

/**
 * Builds a COUNT query.
 */
export function buildCountQuery(
  table: string,
  predicate?: Predicate
): { sql: string; params: any[] } {
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  let params: any[] = [];

  if (predicate) {
    sql += ` WHERE ${predicate.sql}`;
    params = predicate.params;
  }

  return { sql, params };
}

