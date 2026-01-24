/**
 * PersistentHistoryTransaction.swift → persistent-history.ts
 *
 * Persistent history tracking translated from quran-ios Core/SystemDependencies
 * Created by Mohamed Afifi on 2023-05-28.
 *
 * In iOS, this uses CoreData's NSPersistentHistoryTransaction for change tracking.
 * In Expo, we provide an abstraction that can be implemented with expo-sqlite.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Types of changes that can occur.
 * Equivalent to NSPersistentHistoryChangeType.
 */
export enum PersistentHistoryChangeType {
  Insert = 0,
  Update = 1,
  Delete = 2,
}

/**
 * Represents a change to a managed object.
 * Equivalent to Swift's PersistentHistoryChange protocol.
 */
export interface PersistentHistoryChange {
  /**
   * The ID of the changed object.
   */
  changedObjectId: string;

  /**
   * The type of change.
   */
  changeType: PersistentHistoryChangeType;

  /**
   * The entity/table name.
   */
  entityName: string;

  /**
   * Timestamp of the change.
   */
  timestamp: Date;

  /**
   * Updated values (for Update changes).
   */
  updatedProperties?: Record<string, unknown>;
}

/**
 * Represents a transaction containing multiple changes.
 * Equivalent to Swift's PersistentHistoryTransaction protocol.
 */
export interface PersistentHistoryTransaction {
  /**
   * Gets the changes in this transaction.
   */
  changes(): PersistentHistoryChange[];

  /**
   * Transaction ID.
   */
  transactionId: string;

  /**
   * Timestamp of the transaction.
   */
  timestamp: Date;

  /**
   * The store identifier.
   */
  storeId: string;
}

/**
 * Creates a persistent history change.
 */
export function createChange(
  changedObjectId: string,
  changeType: PersistentHistoryChangeType,
  entityName: string,
  timestamp: Date = new Date(),
  updatedProperties?: Record<string, unknown>
): PersistentHistoryChange {
  return {
    changedObjectId,
    changeType,
    entityName,
    timestamp,
    updatedProperties,
  };
}

/**
 * Creates a persistent history transaction.
 */
export function createTransaction(
  transactionId: string,
  storeId: string,
  changes: PersistentHistoryChange[],
  timestamp: Date = new Date()
): PersistentHistoryTransaction {
  return {
    transactionId,
    storeId,
    timestamp,
    changes: () => changes,
  };
}

/**
 * Interface for tracking persistent history.
 * Implementations can store and query change history.
 */
export interface PersistentHistoryTracker {
  /**
   * Records a change.
   */
  recordChange(change: PersistentHistoryChange): Promise<void>;

  /**
   * Gets all transactions since the given date.
   */
  transactionsSince(date: Date): Promise<PersistentHistoryTransaction[]>;

  /**
   * Gets transactions for a specific entity.
   */
  transactionsForEntity(entityName: string): Promise<PersistentHistoryTransaction[]>;

  /**
   * Clears history older than the given date.
   */
  clearHistoryBefore(date: Date): Promise<void>;
}

/**
 * In-memory implementation of persistent history tracking.
 * Useful for testing or simple use cases.
 */
export class InMemoryPersistentHistoryTracker implements PersistentHistoryTracker {
  private changes: PersistentHistoryChange[] = [];
  private storeId: string;
  private transactionCounter = 0;

  constructor(storeId: string = 'default') {
    this.storeId = storeId;
  }

  async recordChange(change: PersistentHistoryChange): Promise<void> {
    this.changes.push(change);
  }

  async transactionsSince(date: Date): Promise<PersistentHistoryTransaction[]> {
    const filteredChanges = this.changes.filter(c => c.timestamp >= date);
    return this.groupChangesIntoTransactions(filteredChanges);
  }

  async transactionsForEntity(entityName: string): Promise<PersistentHistoryTransaction[]> {
    const filteredChanges = this.changes.filter(c => c.entityName === entityName);
    return this.groupChangesIntoTransactions(filteredChanges);
  }

  async clearHistoryBefore(date: Date): Promise<void> {
    this.changes = this.changes.filter(c => c.timestamp >= date);
  }

  private groupChangesIntoTransactions(changes: PersistentHistoryChange[]): PersistentHistoryTransaction[] {
    if (changes.length === 0) return [];

    // Group by timestamp (simple grouping)
    const groups = new Map<number, PersistentHistoryChange[]>();
    for (const change of changes) {
      const key = change.timestamp.getTime();
      const group = groups.get(key) ?? [];
      group.push(change);
      groups.set(key, group);
    }

    return Array.from(groups.entries()).map(([timestamp, groupChanges]) => {
      this.transactionCounter++;
      return createTransaction(
        `tx-${this.transactionCounter}`,
        this.storeId,
        groupChanges,
        new Date(timestamp)
      );
    });
  }

  // Test helpers
  clear(): void {
    this.changes = [];
    this.transactionCounter = 0;
  }
}

