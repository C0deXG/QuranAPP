/**
 * NotePersistence.swift → note-persistence.ts
 *
 * Interface and implementation for notes and highlights persistence.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { AnnotationsDatabase } from '../core-data-persistence';
import {
  TableNames,
  NoteColumns,
  VerseColumns,
  NoteRow,
  VerseRow,
  dateToString,
  stringToDate,
} from '../core-data-model';
import { DatabasePublisher, createDatabasePublisher } from '../core-data-persistence/database-publisher';
import type { SystemTime } from '../../core/system-dependencies';
import { DefaultSystemTime } from '../../core/system-dependencies';

// ============================================================================
// Models
// ============================================================================

/**
 * Persistence model for a verse reference.
 */
export interface VersePersistenceModel {
  readonly ayah: number;
  readonly sura: number;
}

/**
 * Creates a VersePersistenceModel.
 */
export function createVersePersistenceModel(params: {
  ayah: number;
  sura: number;
}): VersePersistenceModel {
  return {
    ayah: params.ayah,
    sura: params.sura,
  };
}

/**
 * Creates a unique key for a verse.
 */
function verseKey(verse: VersePersistenceModel): string {
  return `${verse.sura}:${verse.ayah}`;
}

/**
 * Compares two verses for equality.
 */
export function versesEqual(a: VersePersistenceModel, b: VersePersistenceModel): boolean {
  return a.sura === b.sura && a.ayah === b.ayah;
}

/**
 * Persistence model for a note.
 */
export interface NotePersistenceModel {
  readonly verses: Set<VersePersistenceModel>;
  readonly modifiedDate: Date;
  readonly note: string | null;
  readonly color: number;
}

/**
 * Creates a NotePersistenceModel.
 */
export function createNotePersistenceModel(params: {
  verses: VersePersistenceModel[];
  modifiedDate: Date;
  note: string | null;
  color: number;
}): NotePersistenceModel {
  return {
    verses: new Set(params.verses),
    modifiedDate: params.modifiedDate,
    note: params.note,
    color: params.color,
  };
}

/**
 * Compares two note models for equality.
 */
export function notesEqual(a: NotePersistenceModel, b: NotePersistenceModel): boolean {
  if (a.color !== b.color) return false;
  if (a.note !== b.note) return false;
  if (a.verses.size !== b.verses.size) return false;

  const aVerses = Array.from(a.verses);
  const bVerses = Array.from(b.verses);

  for (const av of aVerses) {
    if (!bVerses.some((bv) => versesEqual(av, bv))) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for note persistence operations.
 */
export interface NotePersistence {
  /**
   * Observes notes, returning a publisher that emits on changes.
   */
  notes(): DatabasePublisher<NotePersistenceModel[]>;

  /**
   * Creates or updates an existing note.
   *
   * Ensures that a single note is created from the selected verses.
   * If the selected verses are linked to different notes, and these notes contain verses not included in the selection,
   * those verses will be incorporated into a unified note. This unified note represents the union of all verses
   * associated with the notes containing any of the provided `selectedVerses`.
   */
  setNote(
    note: string | null,
    verses: VersePersistenceModel[],
    color: number
  ): Promise<NotePersistenceModel>;

  /**
   * Removes notes that contain any of the specified verses.
   */
  removeNotes(verses: VersePersistenceModel[]): Promise<NotePersistenceModel[]>;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

/**
 * SQLite implementation of NotePersistence.
 */
export class SQLiteNotePersistence implements NotePersistence {
  private readonly db: AnnotationsDatabase;
  private readonly time: SystemTime;

  constructor(database: AnnotationsDatabase, time: SystemTime = new DefaultSystemTime()) {
    this.db = database;
    this.time = time;
  }

  notes(): DatabasePublisher<NotePersistenceModel[]> {
    return createDatabasePublisher(
      this.db,
      TableNames.note,
      async () => this.fetchAllNotes()
    );
  }

  async setNote(
    note: string | null,
    verses: VersePersistenceModel[],
    color: number
  ): Promise<NotePersistenceModel> {
    return this.db.write(async (executeSql) => {
      // Get existing notes touching these verses
      const existingNotes = await this.findNotesWithVerses(verses, executeSql);

      // Get the first note to update (or we'll create a new one)
      const selectedNoteId = existingNotes.length > 0 ? existingNotes[0].id : null;

      // Delete other notes (if multiple notes touch these verses, merge them)
      for (let i = 1; i < existingNotes.length; i++) {
        await this.deleteNote(existingNotes[i].id, executeSql);
      }

      // Early break if no change needed
      if (existingNotes.length === 1) {
        const existingNote = existingNotes[0];
        const existingVerseSet = new Set(existingNote.verses.map(verseKey));
        const newVerseSet = new Set(verses.map(verseKey));

        // Check if all new verses are already in the note
        const isSuperset = verses.every((v) => existingVerseSet.has(verseKey(v)));

        if (
          isSuperset &&
          color === existingNote.color &&
          (note === null || note === existingNote.note)
        ) {
          return createNotePersistenceModel({
            verses: existingNote.verses,
            modifiedDate: existingNote.modifiedDate,
            note: existingNote.note,
            color: existingNote.color,
          });
        }
      }

      // Merge existing notes' verses with new verses
      const allVersesMap = new Map<string, VersePersistenceModel>();
      for (const existingNote of existingNotes) {
        for (const verse of existingNote.verses) {
          allVersesMap.set(verseKey(verse), verse);
        }
      }
      for (const verse of verses) {
        allVersesMap.set(verseKey(verse), verse);
      }
      const allVerses = Array.from(allVersesMap.values());

      // Merge text of other notes if no new note text provided
      let noteText: string;
      if (note !== null) {
        noteText = note;
      } else {
        const existingNotesText = existingNotes
          .map((n) => n.note || '')
          .filter((t) => t.length > 0);
        noteText = existingNotesText.join('\n\n').trim();
      }

      const now = this.time.now;

      if (selectedNoteId !== null) {
        // Update existing note
        await this.deleteVersesForNote(selectedNoteId, executeSql);

        await executeSql(
          `UPDATE ${TableNames.note} 
           SET ${NoteColumns.note} = ?, 
               ${NoteColumns.color} = ?, 
               ${NoteColumns.modifiedOn} = ?
           WHERE ${NoteColumns.id} = ?`,
          [noteText || null, color, dateToString(now), selectedNoteId]
        );

        // Add all verses
        for (const verse of allVerses) {
          await executeSql(
            `INSERT INTO ${TableNames.verse} 
             (${VerseColumns.sura}, ${VerseColumns.ayah}, ${VerseColumns.noteId})
             VALUES (?, ?, ?)`,
            [verse.sura, verse.ayah, selectedNoteId]
          );
        }

        return createNotePersistenceModel({
          verses: allVerses,
          modifiedDate: now,
          note: noteText || null,
          color,
        });
      } else {
        // Create new note
        await executeSql(
          `INSERT INTO ${TableNames.note} 
           (${NoteColumns.color}, ${NoteColumns.createdOn}, ${NoteColumns.modifiedOn}, ${NoteColumns.note})
           VALUES (?, ?, ?, ?)`,
          [color, dateToString(now), dateToString(now), noteText || null]
        );

        // Get the new note ID
        const result = await executeSql(
          `SELECT last_insert_rowid() as id`,
          []
        );
        const newNoteId = (result.rows as Array<{ id: number }>)[0].id;

        // Add all verses
        for (const verse of allVerses) {
          await executeSql(
            `INSERT INTO ${TableNames.verse} 
             (${VerseColumns.sura}, ${VerseColumns.ayah}, ${VerseColumns.noteId})
             VALUES (?, ?, ?)`,
            [verse.sura, verse.ayah, newNoteId]
          );
        }

        return createNotePersistenceModel({
          verses: allVerses,
          modifiedDate: now,
          note: noteText || null,
          color,
        });
      }
    });
  }

  async removeNotes(verses: VersePersistenceModel[]): Promise<NotePersistenceModel[]> {
    return this.db.write(async (executeSql) => {
      const notesToRemove = await this.findNotesWithVerses(verses, executeSql);

      const result = notesToRemove.map((n) =>
        createNotePersistenceModel({
          verses: n.verses,
          modifiedDate: n.modifiedDate,
          note: n.note,
          color: n.color,
        })
      );

      // Delete all found notes and their verses
      for (const note of notesToRemove) {
        await this.deleteNote(note.id, executeSql);
      }

      return result;
    });
  }

  // MARK: - Private

  private async fetchAllNotes(): Promise<NotePersistenceModel[]> {
    return this.db.read(async (executeSql) => {
      // Fetch all notes
      const notesResult = await executeSql(
        `SELECT * FROM ${TableNames.note} ORDER BY ${NoteColumns.modifiedOn} DESC`,
        []
      );
      const noteRows = notesResult.rows as NoteRow[];

      // Fetch all verses
      const versesResult = await executeSql(
        `SELECT * FROM ${TableNames.verse}`,
        []
      );
      const verseRows = versesResult.rows as VerseRow[];

      // Group verses by note ID
      const versesByNoteId = new Map<number, VersePersistenceModel[]>();
      for (const verseRow of verseRows) {
        const noteId = verseRow[VerseColumns.noteId];
        if (!versesByNoteId.has(noteId)) {
          versesByNoteId.set(noteId, []);
        }
        versesByNoteId.get(noteId)!.push(
          createVersePersistenceModel({
            sura: verseRow[VerseColumns.sura],
            ayah: verseRow[VerseColumns.ayah],
          })
        );
      }

      // Build note models
      return noteRows.map((noteRow) =>
        createNotePersistenceModel({
          verses: versesByNoteId.get(noteRow[NoteColumns.id]) || [],
          modifiedDate: stringToDate(noteRow[NoteColumns.modifiedOn]),
          note: noteRow[NoteColumns.note],
          color: noteRow[NoteColumns.color],
        })
      );
    });
  }

  private async findNotesWithVerses(
    verses: VersePersistenceModel[],
    executeSql: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>
  ): Promise<
    Array<{
      id: number;
      verses: VersePersistenceModel[];
      modifiedDate: Date;
      note: string | null;
      color: number;
    }>
  > {
    if (verses.length === 0) return [];

    // Build OR conditions for verses
    const conditions = verses
      .map(() => `(${VerseColumns.sura} = ? AND ${VerseColumns.ayah} = ?)`)
      .join(' OR ');
    const params = verses.flatMap((v) => [v.sura, v.ayah]);

    // Find verse rows matching any of the input verses
    const verseResult = await executeSql(
      `SELECT DISTINCT ${VerseColumns.noteId} FROM ${TableNames.verse} WHERE ${conditions}`,
      params
    );
    const noteIds = (verseResult.rows as Array<{ [VerseColumns.noteId]: number }>).map(
      (r) => r[VerseColumns.noteId]
    );

    if (noteIds.length === 0) return [];

    // Fetch the notes
    const placeholders = noteIds.map(() => '?').join(',');
    const notesResult = await executeSql(
      `SELECT * FROM ${TableNames.note} WHERE ${NoteColumns.id} IN (${placeholders})`,
      noteIds
    );
    const noteRows = notesResult.rows as NoteRow[];

    // Fetch all verses for these notes
    const allVersesResult = await executeSql(
      `SELECT * FROM ${TableNames.verse} WHERE ${VerseColumns.noteId} IN (${placeholders})`,
      noteIds
    );
    const allVerseRows = allVersesResult.rows as VerseRow[];

    // Group verses by note ID
    const versesByNoteId = new Map<number, VersePersistenceModel[]>();
    for (const verseRow of allVerseRows) {
      const noteId = verseRow[VerseColumns.noteId];
      if (!versesByNoteId.has(noteId)) {
        versesByNoteId.set(noteId, []);
      }
      versesByNoteId.get(noteId)!.push(
        createVersePersistenceModel({
          sura: verseRow[VerseColumns.sura],
          ayah: verseRow[VerseColumns.ayah],
        })
      );
    }

    return noteRows.map((noteRow) => ({
      id: noteRow[NoteColumns.id],
      verses: versesByNoteId.get(noteRow[NoteColumns.id]) || [],
      modifiedDate: stringToDate(noteRow[NoteColumns.modifiedOn]),
      note: noteRow[NoteColumns.note],
      color: noteRow[NoteColumns.color],
    }));
  }

  private async deleteNote(
    noteId: number,
    executeSql: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>
  ): Promise<void> {
    // Delete verses first (if not using ON DELETE CASCADE)
    await executeSql(
      `DELETE FROM ${TableNames.verse} WHERE ${VerseColumns.noteId} = ?`,
      [noteId]
    );
    // Delete note
    await executeSql(
      `DELETE FROM ${TableNames.note} WHERE ${NoteColumns.id} = ?`,
      [noteId]
    );
  }

  private async deleteVersesForNote(
    noteId: number,
    executeSql: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>
  ): Promise<void> {
    await executeSql(
      `DELETE FROM ${TableNames.verse} WHERE ${VerseColumns.noteId} = ?`,
      [noteId]
    );
  }
}

// ============================================================================
// Uniquifier (for sync operations)
// ============================================================================

/**
 * Removes notes that have no associated verses.
 */
export class NoteUniquifier {
  async removeNotesWithNoVerses(db: AnnotationsDatabase): Promise<void> {
    await db.write(async (executeSql) => {
      // Find notes with no verses
      const result = await executeSql(
        `SELECT n.${NoteColumns.id} 
         FROM ${TableNames.note} n
         LEFT JOIN ${TableNames.verse} v ON n.${NoteColumns.id} = v.${VerseColumns.noteId}
         GROUP BY n.${NoteColumns.id}
         HAVING COUNT(v.${VerseColumns.id}) = 0`,
        []
      );

      const noteIds = (result.rows as Array<{ [NoteColumns.id]: number }>).map(
        (r) => r[NoteColumns.id]
      );

      if (noteIds.length > 0) {
        const placeholders = noteIds.map(() => '?').join(',');
        await executeSql(
          `DELETE FROM ${TableNames.note} WHERE ${NoteColumns.id} IN (${placeholders})`,
          noteIds
        );
      }
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a note persistence instance.
 */
export function createNotePersistence(
  database: AnnotationsDatabase,
  time?: SystemTime
): NotePersistence {
  return new SQLiteNotePersistence(database, time);
}

