/**
 * PreferenceTransformer.swift → preference-transformer.ts
 *
 * Preference transformer type translated from quran-ios Core/Preferences
 * Created by Mohamed Afifi on 2022-09-10.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Transforms between raw storage values and typed values.
 * Equivalent to Swift's PreferenceTransformer struct.
 *
 * @example
 * const boolToIntTransformer: PreferenceTransformer<number, boolean> = {
 *   rawToValue: (raw) => raw === 1,
 *   valueToRaw: (value) => value ? 1 : 0,
 * };
 */
export interface PreferenceTransformer<Raw, T> {
  /**
   * Converts from raw storage value to typed value
   */
  rawToValue: (raw: Raw) => T;

  /**
   * Converts from typed value to raw storage value
   */
  valueToRaw: (value: T) => Raw;

  /**
   * Alias for rawToValue for compatibility.
   */
  transformGet?: (raw: Raw) => T;

  /**
   * Alias for valueToRaw for compatibility.
   */
  transformSet?: (value: T) => Raw;
}

/**
 * Creates a preference transformer.
 *
 * @param rawToValue - Function to convert from raw to typed value
 * @param valueToRaw - Function to convert from typed to raw value
 * @returns A PreferenceTransformer
 */
export function createTransformer<Raw, T>(
  rawToValue: (raw: Raw) => T,
  valueToRaw: (value: T) => Raw
): PreferenceTransformer<Raw, T> {
  return { 
    rawToValue, 
    valueToRaw,
    transformGet: rawToValue,
    transformSet: valueToRaw,
  };
}

/**
 * Creates a transformer for enum-like values with raw representation.
 *
 * @param defaultValue - Default value if raw value is invalid
 * @param allValues - Array of all valid values
 * @param rawGetter - Function to get raw value from typed value
 * @returns A PreferenceTransformer
 *
 * @example
 * type Theme = 'light' | 'dark' | 'auto';
 * const themeTransformer = rawRepresentableTransformer<number, Theme>(
 *   'light',
 *   ['light', 'dark', 'auto'],
 *   (theme) => ['light', 'dark', 'auto'].indexOf(theme)
 * );
 */
export function rawRepresentableTransformer<Raw, T extends { toString(): string }>(
  defaultValue: T,
  allValues: T[],
  rawGetter: (value: T) => Raw
): PreferenceTransformer<Raw, T> {
  const valueMap = new Map<Raw, T>();
  for (const value of allValues) {
    valueMap.set(rawGetter(value), value);
  }

  return {
    rawToValue: (raw) => valueMap.get(raw) ?? defaultValue,
    valueToRaw: rawGetter,
  };
}

/**
 * Creates a transformer for numeric enum values.
 *
 * @param enumObj - The enum object
 * @param defaultValue - Default value if raw value is invalid
 * @returns A PreferenceTransformer for the enum
 *
 * @example
 * enum Theme { Light = 0, Dark = 1, Auto = 2 }
 * const themeTransformer = numericEnumTransformer(Theme, Theme.Light);
 */
export function numericEnumTransformer<T extends number>(
  enumObj: Record<string, T | string>,
  defaultValue: T
): PreferenceTransformer<number | null | undefined, T> {
  const validValues = new Set(
    Object.values(enumObj).filter((v): v is T => typeof v === 'number')
  );

  return {
    rawToValue: (raw) => {
      if (raw !== null && raw !== undefined && validValues.has(raw as T)) {
        return raw as T;
      }
      return defaultValue;
    },
    valueToRaw: (value) => value,
  };
}

/**
 * Creates a transformer for string enum values.
 *
 * @param enumObj - The enum object
 * @param defaultValue - Default value if raw value is invalid
 * @returns A PreferenceTransformer for the enum
 */
export function stringEnumTransformer<T extends string>(
  enumObj: Record<string, T>,
  defaultValue: T
): PreferenceTransformer<string | null | undefined, T> {
  const validValues = new Set(Object.values(enumObj));

  return {
    rawToValue: (raw) => {
      if (raw !== null && raw !== undefined && validValues.has(raw as T)) {
        return raw as T;
      }
      return defaultValue;
    },
    valueToRaw: (value) => value,
  };
}

/**
 * Wraps a transformer to handle optional values.
 *
 * @param transformer - The base transformer
 * @returns A transformer that handles undefined values
 */
export function optionalTransformer<Raw, T>(
  transformer: PreferenceTransformer<Raw, T>
): PreferenceTransformer<Raw | undefined, T | undefined> {
  return {
    rawToValue: (raw) => (raw !== undefined ? transformer.rawToValue(raw) : undefined),
    valueToRaw: (value) => (value !== undefined ? transformer.valueToRaw(value) : undefined),
  };
}

/**
 * Wraps a transformer to handle nullable values.
 *
 * @param transformer - The base transformer
 * @returns A transformer that handles null values
 */
export function nullableTransformer<Raw, T>(
  transformer: PreferenceTransformer<Raw, T>
): PreferenceTransformer<Raw | null, T | null> {
  return {
    rawToValue: (raw) => (raw !== null ? transformer.rawToValue(raw) : null),
    valueToRaw: (value) => (value !== null ? transformer.valueToRaw(value) : null),
  };
}

// ============================================================================
// Built-in Transformers
// ============================================================================

/**
 * Transformer for boolean stored as number (0/1)
 */
export const booleanToNumberTransformer: PreferenceTransformer<number | null | undefined, boolean> = {
  rawToValue: (raw) => raw === 1,
  valueToRaw: (value) => (value ? 1 : 0),
};

/**
 * Transformer for Date stored as ISO string
 */
export const dateToStringTransformer: PreferenceTransformer<string | null | undefined, Date | null> = {
  rawToValue: (raw) => (raw ? new Date(raw) : null),
  valueToRaw: (value) => value?.toISOString() ?? null,
};

/**
 * Transformer for Date stored as timestamp
 */
export const dateToTimestampTransformer: PreferenceTransformer<number | null | undefined, Date | null> = {
  rawToValue: (raw) => (raw !== null && raw !== undefined ? new Date(raw) : null),
  valueToRaw: (value) => value?.getTime() ?? null,
};

/**
 * Transformer for JSON objects
 */
export function jsonTransformer<T>(): PreferenceTransformer<string | null | undefined, T | null> {
  return {
    rawToValue: (raw) => {
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    valueToRaw: (value) => (value !== null ? JSON.stringify(value) : null),
  };
}

/**
 * Transformer for arrays stored as JSON
 */
export function arrayTransformer<T>(): PreferenceTransformer<string | null | undefined, T[]> {
  return {
    rawToValue: (raw) => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    valueToRaw: (value) => JSON.stringify(value),
  };
}

