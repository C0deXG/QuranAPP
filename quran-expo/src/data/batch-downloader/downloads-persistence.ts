/**
 * DownloadsPersistence.swift → downloads-persistence.ts
 *
 * Interface and implementation for persisting download state.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import {
  DatabaseConnection,
  DatabaseMigrator,
  getDatabasePath,
} from '../sqlite-persistence';
import type { Download, DownloadBatch } from './download';
import { DownloadStatus, createDownload, createDownloadBatch } from './download';
import type { DownloadBatchRequest, DownloadRequest } from './download-request';
import { RelativeFilePath } from '../../core/utilities/relative-file-path';

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for persisting download state.
 */
export interface DownloadsPersistence {
  /** Retrieves all download batches */
  retrieveAll(): Promise<DownloadBatch[]>;

  /** Inserts a new batch and returns it with assigned IDs */
  insert(batch: DownloadBatchRequest): Promise<DownloadBatch>;

  /** Updates the status of downloads */
  update(downloads: Download[]): Promise<void>;

  /** Deletes batches by their IDs */
  delete(batchIds: number[]): Promise<void>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

const DOWNLOADS_DB_NAME = 'downloads.db';

/**
 * SQLite-based implementation of downloads persistence.
 */
export class SQLiteDownloadsPersistence implements DownloadsPersistence {
  private connection: DatabaseConnection;
  private initialized = false;

  constructor(databasePath?: string) {
    this.connection = new DatabaseConnection(
      databasePath ?? getDatabasePath(DOWNLOADS_DB_NAME),
      false // writable
    );
  }

  /**
   * Initializes the database schema.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const migrator = new DatabaseMigrator();

    migrator.registerMigration({
      version: 1,
      migrate: async (executeSql) => {
        // Create batches table
        await executeSql(`
          CREATE TABLE IF NOT EXISTS batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT
          )
        `);

        // Create downloads table
        await executeSql(`
          CREATE TABLE IF NOT EXISTS downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            destination TEXT NOT NULL,
            status INTEGER NOT NULL DEFAULT 0,
            task_id TEXT,
            FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
          )
        `);

        // Create index for batch lookups
        await executeSql(`
          CREATE INDEX IF NOT EXISTS idx_downloads_batch_id ON downloads(batch_id)
        `);
      },
    });

    await migrator.migrate(this.connection);
    this.initialized = true;
  }

  async retrieveAll(): Promise<DownloadBatch[]> {
    await this.initialize();

    return this.connection.read(async (executeSql) => {
      // Get all batches
      const batchesResult = await executeSql(
        'SELECT id FROM batches ORDER BY id'
      );

      const batches: DownloadBatch[] = [];

      for (const batchRow of batchesResult.rows) {
        const batchId = batchRow.id as number;

        // Get downloads for this batch
        const downloadsResult = await executeSql(
          'SELECT url, destination, status, task_id FROM downloads WHERE batch_id = ?',
          [batchId]
        );

        const downloads: Download[] = downloadsResult.rows.map((row) =>
          createDownload({
            batchId,
            request: {
              url: row.url as string,
              destination: new RelativeFilePath(row.destination as string),
            },
            status: row.status as DownloadStatus,
            taskId: row.task_id as string | undefined,
          })
        );

        batches.push(createDownloadBatch(batchId, downloads));
      }

      return batches;
    });
  }

  async insert(batch: DownloadBatchRequest): Promise<DownloadBatch> {
    await this.initialize();

    return this.connection.writeTransaction(async (executeSql) => {
      // Insert batch
      const batchResult = await executeSql('INSERT INTO batches DEFAULT VALUES');
      const batchId = batchResult.insertId!;

      // Insert downloads
      const downloads: Download[] = [];
      for (const request of batch.requests) {
        await executeSql(
          'INSERT INTO downloads (batch_id, url, destination, status) VALUES (?, ?, ?, ?)',
          [batchId, request.url, request.destination.path, DownloadStatus.Downloading]
        );

        downloads.push(
          createDownload({
            batchId,
            request,
            status: DownloadStatus.Downloading,
          })
        );
      }

      return createDownloadBatch(batchId, downloads);
    });
  }

  async update(downloads: Download[]): Promise<void> {
    await this.initialize();

    await this.connection.writeTransaction(async (executeSql) => {
      for (const download of downloads) {
        await executeSql(
          'UPDATE downloads SET status = ?, task_id = ? WHERE batch_id = ? AND url = ? AND destination = ?',
          [
            download.status,
            download.taskId ?? null,
            download.batchId,
            download.request.url,
            download.request.destination.path,
          ]
        );
      }
    });
  }

  async delete(batchIds: number[]): Promise<void> {
    await this.initialize();

    if (batchIds.length === 0) return;

    await this.connection.writeTransaction(async (executeSql) => {
      const placeholders = batchIds.map(() => '?').join(',');

      // Delete downloads first (due to foreign key)
      await executeSql(
        `DELETE FROM downloads WHERE batch_id IN (${placeholders})`,
        batchIds
      );

      // Delete batches
      await executeSql(
        `DELETE FROM batches WHERE id IN (${placeholders})`,
        batchIds
      );
    });
  }

  /**
   * Closes the database connection.
   */
  async close(): Promise<void> {
    await this.connection.close();
  }
}

// ============================================================================
// In-Memory Implementation (for testing)
// ============================================================================

/**
 * In-memory implementation of downloads persistence.
 */
export class InMemoryDownloadsPersistence implements DownloadsPersistence {
  private batches: Map<number, DownloadBatch> = new Map();
  private nextBatchId = 1;

  async retrieveAll(): Promise<DownloadBatch[]> {
    return Array.from(this.batches.values());
  }

  async insert(batch: DownloadBatchRequest): Promise<DownloadBatch> {
    const batchId = this.nextBatchId++;

    const downloads: Download[] = batch.requests.map((request) =>
      createDownload({
        batchId,
        request,
        status: DownloadStatus.Downloading,
      })
    );

    const downloadBatch = createDownloadBatch(batchId, downloads);
    this.batches.set(batchId, downloadBatch);

    return downloadBatch;
  }

  async update(downloads: Download[]): Promise<void> {
    for (const download of downloads) {
      const batch = this.batches.get(download.batchId);
      if (batch) {
        const updatedDownloads = batch.downloads.map((d) => {
          if (
            d.request.url === download.request.url &&
            d.request.destination.path === download.request.destination.path
          ) {
            return download;
          }
          return d;
        });

        this.batches.set(
          download.batchId,
          createDownloadBatch(download.batchId, updatedDownloads as Download[])
        );
      }
    }
  }

  async delete(batchIds: number[]): Promise<void> {
    for (const id of batchIds) {
      this.batches.delete(id);
    }
  }

  /** Clears all data (for testing) */
  clear(): void {
    this.batches.clear();
    this.nextBatchId = 1;
  }
}

