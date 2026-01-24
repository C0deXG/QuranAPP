/**
 * Preference.swift → use-preference.ts
 *
 * React hooks for preferences translated from quran-ios Core/Preferences
 * Created by Mohamed Afifi on 2022-04-16.
 *
 * Equivalent to Swift's @Preference and @TransformedPreference property wrappers.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PreferenceKey } from './preference-key';
import { PreferenceTransformer } from './preference-transformer';
import { Preferences } from './preferences';

/**
 * React hook for reading and writing a preference.
 * Equivalent to Swift's @Preference property wrapper.
 *
 * @param key - The preference key
 * @param preferences - Optional preferences instance (defaults to shared)
 * @returns Tuple of [value, setValue, isLoading]
 *
 * @example
 * const [theme, setTheme, isLoading] = usePreference(themeKey);
 *
 * if (isLoading) return <Loading />;
 *
 * return (
 *   <Button onPress={() => setTheme('dark')}>
 *     Current: {theme}
 *   </Button>
 * );
 */
export function usePreference<T>(
  key: PreferenceKey<T>,
  preferences: Preferences = Preferences.shared
): [T, (value: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(key.defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // Load initial value
  useEffect(() => {
    mountedRef.current = true;

    preferences.getValue(key).then((storedValue) => {
      if (mountedRef.current) {
        setValue(storedValue);
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, [key.key]);

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = preferences.addListener((changedKey) => {
      if (changedKey === key.key && mountedRef.current) {
        preferences.getValue(key).then((newValue) => {
          if (mountedRef.current) {
            setValue(newValue);
          }
        });
      }
    });

    return unsubscribe;
  }, [key.key, preferences]);

  // Setter function
  const setPreferenceValue = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await preferences.setValue(newValue, key);
    },
    [key, preferences]
  );

  return [value, setPreferenceValue, isLoading];
}

/**
 * React hook for reading and writing a transformed preference.
 * Equivalent to Swift's @TransformedPreference property wrapper.
 *
 * @param key - The preference key (with raw type)
 * @param transformer - The transformer for raw <-> typed conversion
 * @param preferences - Optional preferences instance
 * @returns Tuple of [value, setValue, isLoading]
 *
 * @example
 * const themeTransformer = {
 *   rawToValue: (raw: number) => raw === 1 ? 'dark' : 'light',
 *   valueToRaw: (value: Theme) => value === 'dark' ? 1 : 0,
 * };
 *
 * const [theme, setTheme] = useTransformedPreference(themeRawKey, themeTransformer);
 */
export function useTransformedPreference<Raw, T>(
  key: PreferenceKey<Raw>,
  transformer: PreferenceTransformer<Raw, T>,
  preferences: Preferences = Preferences.shared
): [T, (value: T) => Promise<void>, boolean] {
  const [rawValue, setRawValue, isLoading] = usePreference(key, preferences);

  const transformedValue = transformer.rawToValue(rawValue);

  const setTransformedValue = useCallback(
    async (newValue: T) => {
      const raw = transformer.valueToRaw(newValue);
      await setRawValue(raw);
    },
    [setRawValue, transformer]
  );

  return [transformedValue, setTransformedValue, isLoading];
}

/**
 * React hook for reading a preference without writing.
 * Useful for derived/computed preferences.
 *
 * @param key - The preference key
 * @param preferences - Optional preferences instance
 * @returns The preference value and loading state
 */
export function usePreferenceValue<T>(
  key: PreferenceKey<T>,
  preferences: Preferences = Preferences.shared
): { value: T; isLoading: boolean } {
  const [value, , isLoading] = usePreference(key, preferences);
  return { value, isLoading };
}

/**
 * React hook that subscribes to multiple preference keys.
 * Useful for derived values that depend on multiple preferences.
 *
 * @param keys - Array of preference keys to watch
 * @param compute - Function to compute derived value
 * @param preferences - Optional preferences instance
 * @returns The computed value
 */
export function useDerivedPreference<T>(
  keys: PreferenceKey<unknown>[],
  compute: () => T,
  preferences: Preferences = Preferences.shared
): T {
  const [value, setValue] = useState<T>(compute);
  const keyStrings = keys.map((k) => k.key);

  useEffect(() => {
    const unsubscribe = preferences.addListener((changedKey) => {
      if (keyStrings.includes(changedKey)) {
        setValue(compute());
      }
    });

    return unsubscribe;
  }, [keyStrings.join(','), preferences]);

  return value;
}

/**
 * React hook for toggling a boolean preference.
 *
 * @param key - The boolean preference key
 * @param preferences - Optional preferences instance
 * @returns Object with value, toggle function, and loading state
 */
export function useBooleanPreference(
  key: PreferenceKey<boolean>,
  preferences: Preferences = Preferences.shared
): { value: boolean; toggle: () => Promise<void>; isLoading: boolean } {
  const [value, setValue, isLoading] = usePreference(key, preferences);

  const toggle = useCallback(async () => {
    await setValue(!value);
  }, [value, setValue]);

  return { value, toggle, isLoading };
}

/**
 * React hook for preference with async initialization.
 * Returns null while loading instead of default value.
 *
 * @param key - The preference key
 * @param preferences - Optional preferences instance
 * @returns The value or null while loading
 */
export function usePreferenceNullable<T>(
  key: PreferenceKey<T>,
  preferences: Preferences = Preferences.shared
): [T | null, (value: T) => Promise<void>] {
  const [value, setValue, isLoading] = usePreference(key, preferences);

  return [isLoading ? null : value, setValue];
}

