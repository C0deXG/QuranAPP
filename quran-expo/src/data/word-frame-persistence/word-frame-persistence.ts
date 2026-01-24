/**
 * WordFramePersistence.swift → word-frame-persistence.ts
 *
 * Interface and implementation for word frame queries.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { DatabaseConnection } from '../sqlite-persistence';
import type { IPage, IAyahNumber, ISura, IQuran, IWord } from '../../model/quran-kit/types';
import type {
  WordFrame,
  SuraHeaderLocation,
  AyahNumberLocation,
} from '../../model/quran-geometry';
import {
  createWordFrame,
  createSuraHeaderLocation,
  createAyahNumberLocation,
} from '../../model/quran-geometry';

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for retrieving word frame data for a page.
 */
export interface WordFramePersistence {
  /**
   * Gets word frame collection for a page.
   */
  wordFrameCollectionForPage(
    page: IPage,
    createWord: (verse: IAyahNumber, wordNumber: number) => IWord
  ): Promise<WordFrame[]>;

  /**
   * Gets sura headers for a page.
   */
  suraHeaders(
    page: IPage,
    createSura: (suraNumber: number) => ISura | null
  ): Promise<SuraHeaderLocation[]>;

  /**
   * Gets ayah number markers for a page.
   */
  ayahNumbers(
    page: IPage,
    createAyah: (sura: number, ayah: number) => IAyahNumber | null
  ): Promise<AyahNumberLocation[]>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

/**
 * Table names.
 */
const TableNames = {
  glyphs: 'glyphs',
  suraHeaders: 'sura_headers',
  ayahMarkers: 'ayah_markers',
} as const;

/**
 * Column names for glyphs table.
 */
const GlyphColumns = {
  id: 'glyph_id',
  page: 'page_number',
  sura: 'sura_number',
  ayah: 'ayah_number',
  line: 'line_number',
  position: 'position',
  minX: 'min_x',
  maxX: 'max_x',
  minY: 'min_y',
  maxY: 'max_y',
} as const;

/**
 * Column names for sura_headers table.
 */
const SuraHeaderColumns = {
  suraNumber: 'sura_number',
  x: 'x',
  y: 'y',
  width: 'width',
  height: 'height',
  page: 'page_number',
} as const;

/**
 * Column names for ayah_markers table.
 */
const AyahMarkerColumns = {
  suraNumber: 'sura_number',
  ayahNumber: 'ayah_number',
  x: 'x',
  y: 'y',
  page: 'page_number',
} as const;

/**
 * Row types.
 */
interface GlyphRow {
  glyph_id: number;
  page_number: number;
  sura_number: number;
  ayah_number: number;
  line_number: number;
  position: number;
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
}

interface SuraHeaderRow {
  sura_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  page_number: number;
}

interface AyahMarkerRow {
  sura_number: number;
  ayah_number: number;
  x: number;
  y: number;
  page_number: number;
}

/**
 * SQLite implementation of WordFramePersistence.
 */
export class SQLiteWordFramePersistence implements WordFramePersistence {
  private readonly db: DatabaseConnection;

  constructor(connection: DatabaseConnection) {
    this.db = connection;
  }

  static fromPath(databasePath: string): SQLiteWordFramePersistence {
    console.log(`[WordFramePersistence] Creating with database path: ${databasePath}`);
    return new SQLiteWordFramePersistence(
      new DatabaseConnection(databasePath, true) // readonly
    );
  }

  async wordFrameCollectionForPage(
    page: IPage,
    createWord: (verse: IAyahNumber, wordNumber: number) => IWord
  ): Promise<WordFrame[]> {
    return this.db.read(async (executeSql) => {
      // First check if table exists
      try {
        const tableCheck = await executeSql(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${TableNames.glyphs}'`
        );
        if (tableCheck.rows.length === 0) {
          console.warn(`[WordFramePersistence] Table '${TableNames.glyphs}' does not exist in database!`);
          return [];
        }
      } catch (e) {
        console.warn(`[WordFramePersistence] Error checking table: ${e}`);
        return [];
      }

      const result = await executeSql(
        `SELECT * FROM ${TableNames.glyphs} WHERE ${GlyphColumns.page} = ?`,
        [page.pageNumber]
      );

      console.log(`[WordFramePersistence] Found ${result.rows.length} glyphs for page ${page.pageNumber}`);

      const frames: WordFrame[] = [];

      for (const row of result.rows as GlyphRow[]) {
        // Create the ayah number
        const ayah = this.createAyahFromPage(page, row.sura_number, row.ayah_number);
        if (!ayah) {
          console.warn(`[WordFramePersistence] Found glyph for unknown verse ${row.sura_number}:${row.ayah_number}`);
          continue;
        }

        // Create the word
        const word = createWord(ayah, row.position);

        if (row.page_number === 1 && (row.ayah_number === 1 || row.ayah_number === 2)) {
          console.log(`[DEBUG] Loaded Page 1 Frame: Sura ${row.sura_number} Ayah ${row.ayah_number} Pos ${row.position} Line ${row.line_number} Y: ${row.min_y}-${row.max_y}`);
        }

        frames.push(
          createWordFrame({
            line: row.line_number,
            word,
            minX: row.min_x,
            maxX: row.max_x,
            minY: row.min_y,
            maxY: row.max_y,
          })
        );
      }

      return frames;
    });
  }

  async suraHeaders(
    page: IPage,
    createSura: (suraNumber: number) => ISura | null
  ): Promise<SuraHeaderLocation[]> {
    return this.db.read(async (executeSql) => {
      try {
        // Skip if table is missing (our ayahinfo.db only has glyphs)
        const tableCheck = await executeSql(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${TableNames.suraHeaders}'`
        );
        if (tableCheck.rows.length === 0) {
          return [];
        }

        const result = await executeSql(
          `SELECT * FROM ${TableNames.suraHeaders} WHERE ${SuraHeaderColumns.page} = ?`,
          [page.pageNumber]
        );

        const headers: SuraHeaderLocation[] = [];

        for (const row of result.rows as SuraHeaderRow[]) {
          const sura = createSura(row.sura_number);
          if (!sura) continue;

          headers.push(
            createSuraHeaderLocation({
              sura,
              x: row.x,
              y: row.y,
              width: row.width,
              height: row.height,
            })
          );
        }

        return headers;
      } catch (e) {
        // If table doesn't exist, just return empty list
        console.warn(`[WordFramePersistence] Failed to load sura headers: ${e}`);
        return [];
      }
    });
  }

  async ayahNumbers(
    page: IPage,
    createAyah: (sura: number, ayah: number) => IAyahNumber | null
  ): Promise<AyahNumberLocation[]> {
    return this.db.read(async (executeSql) => {
      try {
        // Skip if table is missing (our ayahinfo.db only has glyphs)
        const tableCheck = await executeSql(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${TableNames.ayahMarkers}'`
        );
        if (tableCheck.rows.length === 0) {
          return [];
        }

        const result = await executeSql(
          `SELECT * FROM ${TableNames.ayahMarkers} WHERE ${AyahMarkerColumns.page} = ?`,
          [page.pageNumber]
        );

        const locations: AyahNumberLocation[] = [];

        for (const row of result.rows as AyahMarkerRow[]) {
          const ayah = createAyah(row.sura_number, row.ayah_number);
          if (!ayah) continue;

          locations.push(
            createAyahNumberLocation(ayah, row.x, row.y)
          );
        }

        return locations;
      } catch (e) {
        // If table doesn't exist, just return empty list
        console.warn(`[WordFramePersistence] Failed to load ayah markers: ${e}`);
        return [];
      }
    });
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  /**
   * Creates an AyahNumber from page context.
   */
  private createAyahFromPage(
    page: IPage,
    suraNumber: number,
    ayahNumber: number
  ): IAyahNumber | null {
    // Use the page's quran to create the ayah
    const quran = page.quran;
    if (!quran) return null;

    const sura = quran.suras.find((s) => s.suraNumber === suraNumber);
    if (!sura) return null;

    // Find the ayah in the quran's verses
    return (
      quran.verses.find(
        (v) => v.sura.suraNumber === suraNumber && v.ayah === ayahNumber
      ) ?? null
    );
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a word frame persistence.
 */
export function createWordFramePersistence(
  databasePath: string
): WordFramePersistence {
  return SQLiteWordFramePersistence.fromPath(databasePath);
}
