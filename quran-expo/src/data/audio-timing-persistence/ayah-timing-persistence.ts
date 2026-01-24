/**
 * AyahTimingPersistence.swift → ayah-timing-persistence.ts
 *
 * Interface and implementation for ayah audio timing queries.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { DatabaseConnection } from '../sqlite-persistence';
import type { IAyahNumber } from '../../model/quran-kit/types';
import type { SuraTiming, AyahTiming, Timing } from '../../model/quran-audio';
import {
  createTiming,
  createAyahTiming,
  createSuraTiming,
} from '../../model/quran-audio';

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for retrieving ayah audio timing data.
 */
export interface AyahTimingPersistence {
  /**
   * Gets the version of the timing database.
   */
  getVersion(): Promise<number>;

  /**
   * Gets ordered timing data for a sura starting from a specific ayah.
   *
   * @param startAyah - The ayah to start from
   * @param createAyah - Factory function to create AyahNumber instances
   * @returns Timing data for the sura
   */
  getOrderedTimingForSura(
    startAyah: IAyahNumber,
    createAyah: (sura: number, ayah: number) => IAyahNumber | null
  ): Promise<SuraTiming>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

/**
 * Column definitions for the timings table.
 */
const TimingColumns = {
  sura: 'sura',
  ayah: 'ayah',
  time: 'time',
} as const;

/**
 * Column definitions for the properties table.
 */
const PropertyColumns = {
  property: 'property',
  value: 'value',
} as const;

/**
 * Table names in the timing database.
 */
const TableNames = {
  timings: 'timings',
  properties: 'properties',
} as const;

/**
 * Row type for timing table.
 */
interface TimingRow {
  sura: number;
  ayah: number;
  time: number;
}

/**
 * Row type for properties table.
 */
interface PropertyRow {
  property: string;
  value: string;
}

/**
 * SQLite implementation of AyahTimingPersistence.
 */
export class SQLiteAyahTimingPersistence implements AyahTimingPersistence {
  private readonly db: DatabaseConnection;

  /**
   * Creates persistence from a database connection.
   */
  constructor(connection: DatabaseConnection) {
    this.db = connection;
  }

  /**
   * Creates persistence from a database file path.
   */
  static fromPath(databasePath: string): SQLiteAyahTimingPersistence {
    return new SQLiteAyahTimingPersistence(
      new DatabaseConnection(databasePath, true) // readonly
    );
  }

  async getVersion(): Promise<number> {
    return this.db.read(async (executeSql) => {
      const result = await executeSql(
        `SELECT ${PropertyColumns.value} FROM ${TableNames.properties} WHERE ${PropertyColumns.property} = ?`,
        ['version']
      );

      if (result.rows.length > 0) {
        const row = result.rows[0] as PropertyRow;
        const version = parseInt(row.value, 10);
        return isNaN(version) ? 1 : version;
      }

      return 1;
    });
  }

  async getOrderedTimingForSura(
    startAyah: IAyahNumber,
    createAyah: (sura: number, ayah: number) => IAyahNumber | null
  ): Promise<SuraTiming> {
    return this.db.read(async (executeSql) => {
      const suraNumber = startAyah.sura.suraNumber;
      const ayahNumber = startAyah.ayah;

      const result = await executeSql(
        `SELECT ${TimingColumns.sura}, ${TimingColumns.ayah}, ${TimingColumns.time}
         FROM ${TableNames.timings}
         WHERE ${TimingColumns.sura} = ? AND ${TimingColumns.ayah} >= ?
         ORDER BY ${TimingColumns.ayah}`,
        [suraNumber, ayahNumber]
      );

      const timings: AyahTiming[] = [];
      let endTime: Timing | undefined;

      for (const row of result.rows as TimingRow[]) {
        const time = createTiming(row.time);

        // Ayah 999 indicates the end time for the sura
        if (row.ayah === 999) {
          endTime = time;
        } else {
          const verse = createAyah(row.sura, row.ayah);
          if (verse) {
            timings.push(createAyahTiming(verse, time));
          }
        }
      }

      return createSuraTiming(timings, endTime);
    });
  }

  /**
   * Closes the database connection.
   */
  async close(): Promise<void> {
    await this.db.close();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an ayah timing persistence for a reciter's timing database.
 */
export function createAyahTimingPersistence(
  databasePath: string
): AyahTimingPersistence {
  return SQLiteAyahTimingPersistence.fromPath(databasePath);
}

