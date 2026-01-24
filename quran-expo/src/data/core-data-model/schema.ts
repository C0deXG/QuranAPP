/**
 * Schema.swift → schema.ts
 *
 * Database schema definitions for annotations.
 * Replaces CoreData model with SQLite schema.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Schema Key Types
// ============================================================================

/**
 * Column names for the Note table.
 */
export const NoteColumns = {
  id: 'id',
  color: 'color',
  createdOn: 'created_on',
  modifiedOn: 'modified_on',
  note: 'note',
} as const;

export type NoteColumn = (typeof NoteColumns)[keyof typeof NoteColumns];

/**
 * Column names for the Verse table (for note-verse relationships).
 */
export const VerseColumns = {
  id: 'id',
  ayah: 'ayah',
  sura: 'sura',
  noteId: 'note_id',
} as const;

export type VerseColumn = (typeof VerseColumns)[keyof typeof VerseColumns];

/**
 * Column names for the PageBookmark table.
 */
export const PageBookmarkColumns = {
  id: 'id',
  page: 'page',
  createdOn: 'created_on',
  modifiedOn: 'modified_on',
} as const;

export type PageBookmarkColumn =
  (typeof PageBookmarkColumns)[keyof typeof PageBookmarkColumns];

/**
 * Column names for the LastPage table.
 */
export const LastPageColumns = {
  id: 'id',
  page: 'page',
  createdOn: 'created_on',
  modifiedOn: 'modified_on',
} as const;

export type LastPageColumn =
  (typeof LastPageColumns)[keyof typeof LastPageColumns];

// ============================================================================
// Table Names
// ============================================================================

/**
 * Table names in the annotations database.
 */
export const TableNames = {
  note: 'notes',
  verse: 'note_verses',
  pageBookmark: 'page_bookmarks',
  lastPage: 'last_pages',
} as const;

export type TableName = (typeof TableNames)[keyof typeof TableNames];

// ============================================================================
// SQL Schema Definitions
// ============================================================================

/**
 * SQL to create the notes table.
 */
export const CREATE_NOTES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.note} (
    ${NoteColumns.id} INTEGER PRIMARY KEY AUTOINCREMENT,
    ${NoteColumns.color} INTEGER NOT NULL DEFAULT 0,
    ${NoteColumns.createdOn} TEXT NOT NULL,
    ${NoteColumns.modifiedOn} TEXT NOT NULL,
    ${NoteColumns.note} TEXT
  )
`;

/**
 * SQL to create the note_verses table (many-to-one relationship with notes).
 */
export const CREATE_NOTE_VERSES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.verse} (
    ${VerseColumns.id} INTEGER PRIMARY KEY AUTOINCREMENT,
    ${VerseColumns.sura} INTEGER NOT NULL,
    ${VerseColumns.ayah} INTEGER NOT NULL,
    ${VerseColumns.noteId} INTEGER NOT NULL,
    FOREIGN KEY (${VerseColumns.noteId}) REFERENCES ${TableNames.note}(${NoteColumns.id}) ON DELETE CASCADE,
    UNIQUE(${VerseColumns.sura}, ${VerseColumns.ayah}, ${VerseColumns.noteId})
  )
`;

/**
 * SQL to create the page_bookmarks table.
 */
export const CREATE_PAGE_BOOKMARKS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.pageBookmark} (
    ${PageBookmarkColumns.id} INTEGER PRIMARY KEY AUTOINCREMENT,
    ${PageBookmarkColumns.page} INTEGER NOT NULL UNIQUE,
    ${PageBookmarkColumns.createdOn} TEXT NOT NULL,
    ${PageBookmarkColumns.modifiedOn} TEXT NOT NULL
  )
`;

/**
 * SQL to create the last_pages table.
 */
export const CREATE_LAST_PAGES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.lastPage} (
    ${LastPageColumns.id} INTEGER PRIMARY KEY AUTOINCREMENT,
    ${LastPageColumns.page} INTEGER NOT NULL UNIQUE,
    ${LastPageColumns.createdOn} TEXT NOT NULL,
    ${LastPageColumns.modifiedOn} TEXT NOT NULL
  )
`;

/**
 * SQL to create indexes.
 */
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_note_verses_note_id ON ${TableNames.verse}(${VerseColumns.noteId})`,
  `CREATE INDEX IF NOT EXISTS idx_note_verses_sura_ayah ON ${TableNames.verse}(${VerseColumns.sura}, ${VerseColumns.ayah})`,
  `CREATE INDEX IF NOT EXISTS idx_page_bookmarks_page ON ${TableNames.pageBookmark}(${PageBookmarkColumns.page})`,
  `CREATE INDEX IF NOT EXISTS idx_last_pages_page ON ${TableNames.lastPage}(${LastPageColumns.page})`,
  `CREATE INDEX IF NOT EXISTS idx_last_pages_modified ON ${TableNames.lastPage}(${LastPageColumns.modifiedOn})`,
];

/**
 * All table creation SQL statements in order.
 */
export const ALL_CREATE_STATEMENTS = [
  CREATE_NOTES_TABLE,
  CREATE_NOTE_VERSES_TABLE,
  CREATE_PAGE_BOOKMARKS_TABLE,
  CREATE_LAST_PAGES_TABLE,
  ...CREATE_INDEXES,
];

// ============================================================================
// Row Types (for query results)
// ============================================================================

/**
 * Raw row from the notes table.
 */
export interface NoteRow {
  [NoteColumns.id]: number;
  [NoteColumns.color]: number;
  [NoteColumns.createdOn]: string;
  [NoteColumns.modifiedOn]: string;
  [NoteColumns.note]: string | null;
}

/**
 * Raw row from the note_verses table.
 */
export interface VerseRow {
  [VerseColumns.id]: number;
  [VerseColumns.sura]: number;
  [VerseColumns.ayah]: number;
  [VerseColumns.noteId]: number;
}

/**
 * Raw row from the page_bookmarks table.
 */
export interface PageBookmarkRow {
  [PageBookmarkColumns.id]: number;
  [PageBookmarkColumns.page]: number;
  [PageBookmarkColumns.createdOn]: string;
  [PageBookmarkColumns.modifiedOn]: string;
}

/**
 * Raw row from the last_pages table.
 */
export interface LastPageRow {
  [LastPageColumns.id]: number;
  [LastPageColumns.page]: number;
  [LastPageColumns.createdOn]: string;
  [LastPageColumns.modifiedOn]: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Converts a Date to ISO string for storage.
 */
export function dateToString(date: Date): string {
  return date.toISOString();
}

/**
 * Converts a stored ISO string back to a Date.
 */
export function stringToDate(str: string): Date {
  return new Date(str);
}

