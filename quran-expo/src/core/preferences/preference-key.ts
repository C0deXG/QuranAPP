/**
 * PreferenceKey.swift → preference-key.ts
 *
 * Preference key type translated from quran-ios Core/Preferences
 * Created by Mohamed Afifi on 2021-12-17.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Set of registered keys for duplicate detection (in development)
 */
const registeredKeys = new Set<string>();

/**
 * A typed key for storing preferences.
 * Equivalent to Swift's PreferenceKey class.
 *
 * @example
 * const lastPageKey = new PreferenceKey('lastPage', 1);
 * const themeKey = new PreferenceKey<'light' | 'dark'>('theme', 'light');
 */
export class PreferenceKey<T> {
  /**
   * The storage key string
   */
  readonly key: string;

  /**
   * The default value when no value is stored
   */
  readonly defaultValue: T;

  /**
   * Creates a new preference key.
   *
   * @param key - The storage key string
   * @param defaultValue - The default value
   */
  constructor(key: string, defaultValue: T) {
    this.key = key;
    this.defaultValue = defaultValue;

    // In development, check for duplicate keys
    if (__DEV__) {
      if (registeredKeys.has(key)) {
        console.warn(`PreferenceKey '${key}' is registered multiple times`);
      }
      registeredKeys.add(key);
    }
  }
}

/**
 * Creates a preference key with type inference.
 *
 * @param key - The storage key string
 * @param defaultValue - The default value
 * @returns A new PreferenceKey
 *
 * @example
 * const lastPageKey = preferenceKey('lastPage', 1);
 * const themeKey = preferenceKey('theme', 'light' as const);
 */
export function preferenceKey<T>(key: string, defaultValue: T): PreferenceKey<T> {
  return new PreferenceKey(key, defaultValue);
}

/**
 * Creates a preference key for optional values.
 *
 * @param key - The storage key string
 * @returns A new PreferenceKey with undefined as default
 */
export function optionalPreferenceKey<T>(key: string): PreferenceKey<T | undefined> {
  return new PreferenceKey<T | undefined>(key, undefined);
}

/**
 * Creates a preference key for nullable values.
 *
 * @param key - The storage key string
 * @returns A new PreferenceKey with null as default
 */
export function nullablePreferenceKey<T>(key: string): PreferenceKey<T | null> {
  return new PreferenceKey<T | null>(key, null);
}

/**
 * Resets the registered keys (for testing)
 * @internal
 */
export function _resetRegisteredKeys(): void {
  registeredKeys.clear();
}

