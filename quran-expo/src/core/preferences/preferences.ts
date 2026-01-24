/**
 * Preferences.swift → preferences.ts
 *
 * Preferences store translated from quran-ios Core/Preferences
 * Created by Mohamed Afifi on 2021-12-17.
 *
 * Uses AsyncStorage for persistence and Zustand for reactive state.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey } from './preference-key';

/**
 * Storage interface for preference persistence.
 * Default implementation uses AsyncStorage.
 */
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiGet(keys: readonly string[]): Promise<readonly [string, string | null][]>;
  clear(): Promise<void>;
}

/**
 * Default storage adapter instance.
 * Will be initialized on first use.
 */
let defaultStorageAdapter: StorageAdapter | null = null;

/**
 * Sets the default storage adapter.
 * Call this during app initialization with AsyncStorage.
 *
 * @example
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * setDefaultStorageAdapter({
 *   getItem: (key) => AsyncStorage.getItem(key),
 *   setItem: (key, value) => AsyncStorage.setItem(key, value),
 *   removeItem: (key) => AsyncStorage.removeItem(key),
 *   getAllKeys: () => AsyncStorage.getAllKeys(),
 *   multiGet: (keys) => AsyncStorage.multiGet(keys),
 *   clear: () => AsyncStorage.clear(),
 * });
 */
export function setDefaultStorageAdapter(adapter: StorageAdapter): void {
  defaultStorageAdapter = adapter;
}

/**
 * Creates the default storage adapter.
 * Uses the configured adapter or falls back to in-memory storage.
 */
function createDefaultStorage(): StorageAdapter {
  if (defaultStorageAdapter) {
    return defaultStorageAdapter;
  }

  // Fallback to in-memory storage
  console.warn('Storage adapter not configured, using in-memory storage. Call setDefaultStorageAdapter() during app init.');
  return createInMemoryStorage();
}

/**
 * Creates an in-memory storage adapter for testing.
 */
export function createInMemoryStorage(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => { store.set(key, value); },
    removeItem: async (key) => { store.delete(key); },
    getAllKeys: async () => Array.from(store.keys()),
    multiGet: async (keys) => keys.map(key => [key, store.get(key) ?? null] as [string, string | null]),
    clear: async () => { store.clear(); },
  };
}

/**
 * Listener callback type
 */
type PreferenceListener = (key: string) => void;

/**
 * Supported value types for storage
 */
type StorableValue = string | number | boolean | null | undefined | object;

/**
 * Preferences storage class.
 * Provides async read/write to AsyncStorage with notification support.
 *
 * Equivalent to Swift's Preferences class.
 *
 * @example
 * const prefs = Preferences.shared;
 *
 * // Read a value
 * const theme = await prefs.getValue(themeKey);
 *
 * // Write a value
 * await prefs.setValue('dark', themeKey);
 *
 * // Listen for changes
 * prefs.addListener((key) => console.log('Changed:', key));
 */
export class Preferences {
  private listeners: Set<PreferenceListener> = new Set();
  private cache: Map<string, unknown> = new Map();
  private initialized = false;
  private storage: StorageAdapter | null = null;

  /**
   * Shared singleton instance
   */
  static shared = new Preferences();

  private constructor() {}

  /**
   * Gets the storage adapter, initializing if needed.
   */
  private getStorage(): StorageAdapter {
    if (!this.storage) {
      this.storage = createDefaultStorage();
    }
    return this.storage;
  }

  /**
   * Sets a custom storage adapter (useful for testing).
   */
  setStorage(storage: StorageAdapter): void {
    this.storage = storage;
  }

  /**
   * Initializes the preferences by loading cached values.
   * Call this once at app startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storage = this.getStorage();
      const keys = await storage.getAllKeys();
      const pairs = await storage.multiGet(keys);

      for (const [key, value] of pairs) {
        if (value !== null) {
          try {
            this.cache.set(key, JSON.parse(value));
          } catch {
            this.cache.set(key, value);
          }
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize preferences:', error);
      this.initialized = true;
    }
  }

  /**
   * Gets a value for a preference key.
   * Returns the cached value if available, otherwise reads from storage.
   *
   * @param key - The preference key
   * @returns The stored value or the default value
   */
  async getValue<T>(key: PreferenceKey<T>): Promise<T> {
    // Check cache first
    if (this.cache.has(key.key)) {
      return this.cache.get(key.key) as T;
    }

    try {
      const storage = this.getStorage();
      const rawValue = await storage.getItem(key.key);
      if (rawValue === null) {
        return key.defaultValue;
      }

      const value = JSON.parse(rawValue) as T;
      this.cache.set(key.key, value);
      return value;
    } catch {
      return key.defaultValue;
    }
  }

  /**
   * Gets a value synchronously from cache.
   * Only works if the value has been read before or preferences are initialized.
   *
   * @param key - The preference key
   * @returns The cached value or the default value
   */
  getValueSync<T>(key: PreferenceKey<T>): T {
    if (this.cache.has(key.key)) {
      return this.cache.get(key.key) as T;
    }
    return key.defaultValue;
  }

  /**
   * Sync getter alias for getValueSync.
   */
  get<T>(key: PreferenceKey<T>): T {
    return this.getValueSync(key);
  }

  /**
   * Sync setter that immediately updates cache and fires async storage.
   */
  set<T>(key: PreferenceKey<T>, value: T): void {
    this.cache.set(key.key, value);
    this.notifyListeners(key.key);
    // Fire async save without awaiting
    this.setValue(value, key).catch((error) => {
      console.error(`Failed to save preference '${key.key}':`, error);
    });
  }

  /**
   * Sets a value for a preference key.
   *
   * @param value - The value to store
   * @param key - The preference key
   */
  async setValue<T>(value: T | null | undefined, key: PreferenceKey<T>): Promise<void> {
    try {
      const storage = this.getStorage();
      if (value === null || value === undefined) {
        await storage.removeItem(key.key);
        this.cache.delete(key.key);
      } else {
        const serialized = JSON.stringify(value);
        await storage.setItem(key.key, serialized);
        this.cache.set(key.key, value);
      }

      // Notify listeners
      this.notifyListeners(key.key);
    } catch (error) {
      console.error(`Failed to save preference '${key.key}':`, error);
    }
  }

  /**
   * Removes a value for a preference key.
   *
   * @param key - The preference key
   */
  async removeValue<T>(key: PreferenceKey<T>): Promise<void> {
    await this.setValue(null, key);
  }

  /**
   * Removes a value for a preference key by string name.
   */
  async removeValueForKey(keyName: string): Promise<void> {
    try {
      const storage = this.getStorage();
      await storage.removeItem(keyName);
      this.cache.delete(keyName);
      this.notifyListeners(keyName);
    } catch (error) {
      console.error(`Failed to remove preference '${keyName}':`, error);
    }
  }

  /**
   * Checks if a value exists for a key.
   *
   * @param key - The preference key
   * @returns true if a value is stored
   */
  async hasValue<T>(key: PreferenceKey<T>): Promise<boolean> {
    if (this.cache.has(key.key)) {
      return true;
    }

    try {
      const storage = this.getStorage();
      const value = await storage.getItem(key.key);
      return value !== null;
    } catch {
      return false;
    }
  }

  /**
   * Adds a listener for preference changes.
   *
   * @param listener - Callback that receives the changed key
   * @returns Unsubscribe function
   */
  addListener(listener: PreferenceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Observes changes to a specific preference key.
   * The callback is invoked whenever the value for that key changes.
   *
   * @param key - The preference key to observe
   * @param callback - Callback that receives the new value
   * @returns Unsubscribe function
   */
  observe<T>(key: PreferenceKey<T>, callback: (value: T) => void): () => void {
    const listener = (changedKey: string) => {
      if (changedKey === key.key) {
        const value = this.cache.get(key.key) as T ?? key.defaultValue;
        callback(value);
      }
    };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifies all listeners of a key change.
   */
  private notifyListeners(key: string): void {
    for (const listener of this.listeners) {
      try {
        listener(key);
      } catch (error) {
        console.error('Preference listener error:', error);
      }
    }
  }

  /**
   * Clears all preferences.
   */
  async clear(): Promise<void> {
    try {
      const storage = this.getStorage();
      await storage.clear();
      this.cache.clear();
    } catch (error) {
      console.error('Failed to clear preferences:', error);
    }
  }

  /**
   * Gets all stored keys.
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const storage = this.getStorage();
      return [...await storage.getAllKeys()];
    } catch {
      return [];
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Gets a preference value using the shared instance.
 */
export async function getPreference<T>(key: PreferenceKey<T>): Promise<T> {
  return Preferences.shared.getValue(key);
}

/**
 * Sets a preference value using the shared instance.
 */
export async function setPreference<T>(value: T, key: PreferenceKey<T>): Promise<void> {
  return Preferences.shared.setValue(value, key);
}

/**
 * Removes a preference using the shared instance.
 */
export async function removePreference<T>(key: PreferenceKey<T>): Promise<void> {
  return Preferences.shared.removeValue(key);
}

