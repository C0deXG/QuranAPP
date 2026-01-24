/**
 * SecurePersistence.swift → secure-persistence.ts
 *
 * Secure persistence translated from quran-ios Core/SecurePersistence
 * Created by Mohannad Hassan on 28/12/2024.
 *
 * Uses expo-secure-store for secure storage.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { KeychainAccess, keychainAccess, KeychainStatus } from '../system-dependencies';
import { logger } from '../logging';

/**
 * Errors that can occur during secure persistence operations.
 */
export enum PersistenceError {
  PersistenceFailed = 'persistenceFailed',
  RetrievalFailed = 'retrievalFailed',
}

/**
 * Custom error class for persistence errors.
 */
export class SecurePersistenceError extends Error {
  readonly type: PersistenceError;

  constructor(type: PersistenceError, message?: string) {
    super(message ?? type);
    this.name = 'SecurePersistenceError';
    this.type = type;
  }
}

/**
 * Interface for secure data persistence.
 * Equivalent to Swift's SecurePersistence protocol.
 */
export interface SecurePersistence {
  /**
   * Stores data securely for a key.
   *
   * @param key - The key to store under
   * @param data - The data to store (as string)
   * @throws SecurePersistenceError if storage fails
   */
  setData(key: string, data: string): Promise<void>;

  /**
   * Retrieves data for a key.
   *
   * @param key - The key to retrieve
   * @returns The stored data, or null if not found
   * @throws SecurePersistenceError if retrieval fails
   */
  getData(key: string): Promise<string | null>;

  /**
   * Clears data for a key.
   *
   * @param key - The key to clear
   * @throws SecurePersistenceError if clearing fails
   */
  clearData(key: string): Promise<void>;

  /**
   * Alias for clearData.
   */
  removeData(key: string): Promise<void>;
}

/**
 * Keychain-based secure persistence.
 * Equivalent to Swift's KeychainPersistence class.
 */
export class KeychainPersistence implements SecurePersistence {
  private readonly keychain: KeychainAccess;

  constructor(keychain: KeychainAccess = keychainAccess) {
    this.keychain = keychain;
  }

  async setData(key: string, data: string): Promise<void> {
    // Try to add first
    let status = await this.keychain.setItem(key, data);

    if (status === KeychainStatus.DuplicateItem) {
      // Item exists, update it
      logger.info('[KeychainPersistence] Data already exists, updating');
      status = await this.update(key, data);
    }

    if (status !== KeychainStatus.Success) {
      logger.error(`[KeychainPersistence] Failed to persist data -- ${status} status`);
      throw new SecurePersistenceError(
        PersistenceError.PersistenceFailed,
        `Failed to persist data: ${status}`
      );
    }

    logger.info('[KeychainPersistence] Data persisted successfully');
  }

  async getData(key: string): Promise<string | null> {
    const { value, status } = await this.keychain.getItem(key);

    if (status === KeychainStatus.ItemNotFound) {
      logger.info('[KeychainPersistence] No data found');
      return null;
    }

    if (status !== KeychainStatus.Success) {
      logger.error(`[KeychainPersistence] Failed to retrieve data -- ${status} status`);
      throw new SecurePersistenceError(
        PersistenceError.RetrievalFailed,
        `Failed to retrieve data: ${status}`
      );
    }

    return value;
  }

  async clearData(key: string): Promise<void> {
    const status = await this.keychain.deleteItem(key);

    if (status !== KeychainStatus.Success && status !== KeychainStatus.ItemNotFound) {
      logger.error(`[KeychainPersistence] Failed to clear data -- ${status} status`);
      throw new SecurePersistenceError(
        PersistenceError.PersistenceFailed,
        `Failed to clear data: ${status}`
      );
    }
  }

  async removeData(key: string): Promise<void> {
    return this.clearData(key);
  }

  private async update(key: string, data: string): Promise<KeychainStatus> {
    // Delete then re-add (expo-secure-store handles this internally)
    await this.keychain.deleteItem(key);
    return this.keychain.setItem(key, data);
  }
}

// ============================================================================
// Convenience Extensions
// ============================================================================

/**
 * Extension methods for storing typed data.
 */
export class TypedSecurePersistence {
  private readonly persistence: SecurePersistence;

  constructor(persistence: SecurePersistence = new KeychainPersistence()) {
    this.persistence = persistence;
  }

  /**
   * Stores a JSON-serializable object.
   */
  async setObject<T>(key: string, object: T): Promise<void> {
    const json = JSON.stringify(object);
    await this.persistence.setData(key, json);
  }

  /**
   * Retrieves a JSON-serializable object.
   */
  async getObject<T>(key: string): Promise<T | null> {
    const json = await this.persistence.getData(key);
    if (json === null) {
      return null;
    }
    try {
      return JSON.parse(json) as T;
    } catch {
      logger.error('[TypedSecurePersistence] Failed to parse JSON');
      throw new SecurePersistenceError(
        PersistenceError.RetrievalFailed,
        'Failed to parse stored JSON'
      );
    }
  }

  /**
   * Stores a string value.
   */
  async setString(key: string, value: string): Promise<void> {
    await this.persistence.setData(key, value);
  }

  /**
   * Retrieves a string value.
   */
  async getString(key: string): Promise<string | null> {
    return this.persistence.getData(key);
  }

  /**
   * Clears data for a key.
   */
  async clear(key: string): Promise<void> {
    await this.persistence.clearData(key);
  }
}

/**
 * Mock secure persistence for testing.
 */
export class MockSecurePersistence implements SecurePersistence {
  private storage: Map<string, string> = new Map();

  async setData(key: string, data: string): Promise<void> {
    this.storage.set(key, data);
  }

  async getData(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async clearData(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async removeData(key: string): Promise<void> {
    return this.clearData(key);
  }

  // Test helpers
  clear(): void {
    this.storage.clear();
  }

  has(key: string): boolean {
    return this.storage.has(key);
  }
}

/**
 * Shared secure persistence instance.
 */
export const securePersistence: SecurePersistence = new KeychainPersistence();

/**
 * Shared typed secure persistence instance.
 */
export const typedSecurePersistence = new TypedSecurePersistence(securePersistence);

