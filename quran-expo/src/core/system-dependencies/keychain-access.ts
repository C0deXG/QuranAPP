/**
 * KeychainAccess.swift → keychain-access.ts
 *
 * Keychain access abstraction translated from quran-ios Core/SystemDependencies
 * Created by Mohannad Hassan on 21/01/2025.
 *
 * Uses expo-secure-store for secure storage in React Native.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as SecureStore from 'expo-secure-store';

/**
 * Status codes for keychain operations.
 * Mirrors iOS OSStatus codes for keychain.
 */
export enum KeychainStatus {
  Success = 0,
  ItemNotFound = -25300,
  DuplicateItem = -25299,
  AuthFailed = -25293,
  Unimplemented = -4,
  InvalidParameter = -50,
  UnknownError = -1,
}

/**
 * Interface for keychain access.
 * Equivalent to Swift's KeychainAccess protocol.
 *
 * Note: This is a simplified interface compared to iOS.
 * expo-secure-store provides a higher-level API.
 */
export interface KeychainAccess {
  /**
   * Stores a value in the keychain.
   *
   * @param key - The key to store under
   * @param value - The value to store
   * @returns Status code
   */
  setItem(key: string, value: string): Promise<KeychainStatus>;

  /**
   * Retrieves a value from the keychain.
   *
   * @param key - The key to retrieve
   * @returns The value and status code
   */
  getItem(key: string): Promise<{ value: string | null; status: KeychainStatus }>;

  /**
   * Deletes a value from the keychain.
   *
   * @param key - The key to delete
   * @returns Status code
   */
  deleteItem(key: string): Promise<KeychainStatus>;

  /**
   * Checks if a key exists in the keychain.
   *
   * @param key - The key to check
   * @returns Whether the key exists
   */
  hasItem(key: string): Promise<boolean>;
}

/**
 * Default implementation using expo-secure-store.
 * Equivalent to Swift's DefaultKeychainAccess.
 */
export class DefaultKeychainAccess implements KeychainAccess {
  async setItem(key: string, value: string): Promise<KeychainStatus> {
    try {
      await SecureStore.setItemAsync(key, value);
      return KeychainStatus.Success;
    } catch (error) {
      console.error('KeychainAccess setItem error:', error);
      return KeychainStatus.UnknownError;
    }
  }

  async getItem(key: string): Promise<{ value: string | null; status: KeychainStatus }> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value === null) {
        return { value: null, status: KeychainStatus.ItemNotFound };
      }
      return { value, status: KeychainStatus.Success };
    } catch (error) {
      console.error('KeychainAccess getItem error:', error);
      return { value: null, status: KeychainStatus.UnknownError };
    }
  }

  async deleteItem(key: string): Promise<KeychainStatus> {
    try {
      await SecureStore.deleteItemAsync(key);
      return KeychainStatus.Success;
    } catch (error) {
      console.error('KeychainAccess deleteItem error:', error);
      return KeychainStatus.UnknownError;
    }
  }

  async hasItem(key: string): Promise<boolean> {
    const { status } = await this.getItem(key);
    return status === KeychainStatus.Success;
  }
}

/**
 * Mock keychain access for testing.
 */
export class MockKeychainAccess implements KeychainAccess {
  private storage: Map<string, string> = new Map();

  async setItem(key: string, value: string): Promise<KeychainStatus> {
    this.storage.set(key, value);
    return KeychainStatus.Success;
  }

  async getItem(key: string): Promise<{ value: string | null; status: KeychainStatus }> {
    const value = this.storage.get(key);
    if (value === undefined) {
      return { value: null, status: KeychainStatus.ItemNotFound };
    }
    return { value, status: KeychainStatus.Success };
  }

  async deleteItem(key: string): Promise<KeychainStatus> {
    this.storage.delete(key);
    return KeychainStatus.Success;
  }

  async hasItem(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  // Test helpers
  clear(): void {
    this.storage.clear();
  }

  setStoredValue(key: string, value: string): void {
    this.storage.set(key, value);
  }
}

/**
 * Shared default keychain access instance.
 */
export const keychainAccess: KeychainAccess = new DefaultKeychainAccess();

