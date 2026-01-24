/**
 * NoteService.swift → note-service.ts
 *
 * Service for managing notes and highlights.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, IAyahNumber } from '../../model/quran-kit/types';
import { AyahNumber } from '../../model/quran-kit';
import type { Note } from '../../model/quran-annotations';
import { NoteColor, createNote } from '../../model/quran-annotations';
import type { NotePersistence, NotePersistenceModel, VersePersistenceModel } from '../../data/note-persistence';
import type { AnalyticsLibrary } from '../../core/analytics';
import type { QuranTextDataService } from '../quran-text-kit';
import { PreferenceKey } from '../../core/preferences';
import { Preferences } from '../../core/preferences';
import { createAsyncPublisher } from '../../core/utilities/async-publisher';
import { arabicNumberFormatter } from '../../core/localization/number-formatter';
import { logHighlightEvent, logUnhighlightEvent, logUpdateNoteEvent } from './analytics-events';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_HIGHLIGHT_COLOR = NoteColor.Red;

const lastUsedNoteHighlightColorKey = new PreferenceKey<number>(
  'lastUsedNoteHighlightColor',
  DEFAULT_HIGHLIGHT_COLOR
);

// ============================================================================
// NoteService
// ============================================================================

/**
 * Service for managing notes and highlights.
 */
export class NoteService {
  private readonly persistence: NotePersistence;
  private readonly textService: QuranTextDataService;
  private readonly analytics: AnalyticsLibrary;

  constructor(
    persistence: NotePersistence,
    textService: QuranTextDataService,
    analytics: AnalyticsLibrary
  ) {
    this.persistence = persistence;
    this.textService = textService;
    this.analytics = analytics;
  }

  /**
   * Gets the last used highlight color.
   */
  get lastUsedHighlightColor(): NoteColor {
    const raw = Preferences.shared.get(lastUsedNoteHighlightColorKey);
    if (Object.values(NoteColor).includes(raw as NoteColor)) {
      return raw as NoteColor;
    }
    return DEFAULT_HIGHLIGHT_COLOR;
  }

  /**
   * Sets the last used highlight color.
   */
  set lastUsedHighlightColor(value: NoteColor) {
    Preferences.shared.set(lastUsedNoteHighlightColorKey, value);
  }

  /**
   * Gets the color from a list of notes (most recently modified).
   */
  colorFromNotes(notes: Note[]): NoteColor {
    if (notes.length === 0) return this.lastUsedHighlightColor;

    const mostRecent = notes.reduce((latest, note) =>
      note.modifiedDate > latest.modifiedDate ? note : latest
    );
    return mostRecent.color;
  }

  /**
   * Updates highlight for verses.
   */
  async updateHighlight(
    verses: IAyahNumber[],
    color: NoteColor,
    quran: IQuran
  ): Promise<Note> {
    // Update last used highlight color
    this.lastUsedHighlightColor = color;

    logHighlightEvent(this.analytics, verses);

    const versePersistenceModels = verses.map(toVersePersistenceModel);
    const persistenceModel = await this.persistence.setNote(
      null,
      versePersistenceModels,
      color
    );

    return this.createNote(quran, persistenceModel);
  }

  /**
   * Sets a note with text.
   */
  async setNote(
    note: string,
    verses: Set<IAyahNumber>,
    color: NoteColor
  ): Promise<void> {
    // Update last used highlight color
    this.lastUsedHighlightColor = color;

    logUpdateNoteEvent(this.analytics, verses);

    const versePersistenceModels = Array.from(verses).map(toVersePersistenceModel);
    await this.persistence.setNote(note, versePersistenceModels, color);
  }

  /**
   * Removes notes with the given verses.
   */
  async removeNotes(verses: IAyahNumber[]): Promise<void> {
    logUnhighlightEvent(this.analytics, verses);

    const versePersistenceModels = verses.map(toVersePersistenceModel);
    await this.persistence.removeNotes(versePersistenceModels);
  }

  /**
   * Gets an async iterable of notes.
   */
  notes(quran: IQuran): AsyncIterable<Note[]> {
    const self = this;
    return createAsyncPublisher<Note[]>((emit) => {
      // Subscribe to persistence updates
      const subscription = self.persistence.notes();

      // Process updates
      (async () => {
        for await (const notes of subscription) {
          const mapped = notes.map((model) =>
            self.createNote(quran, model)
          );
          emit(mapped);
        }
      })();

      return () => {
        // Cleanup if needed
      };
    });
  }

  /**
   * Gets text for verses for display/sharing.
   */
  async textForVerses(verses: IAyahNumber[]): Promise<string> {
    const versesWithText = await this.textDictionaryForVerses(verses);
    const sortedVerses = [...verses].sort((a, b) => {
      if (a.sura.suraNumber !== b.sura.suraNumber) {
        return a.sura.suraNumber - b.sura.suraNumber;
      }
      return a.ayah - b.ayah;
    });

    const versesText = sortedVerses
      .map((verse) => {
        const text = versesWithText.get(verse);
        if (!text) return null;
        const ayahNumber = arabicNumberFormatter.format(verse.ayah);
        return `${text} ${ayahNumber}`;
      })
      .filter((t): t is string => t !== null);

    return versesText.join(' ');
  }

  /**
   * Gets a dictionary of verse texts.
   */
  private async textDictionaryForVerses(
    verses: IAyahNumber[]
  ): Promise<Map<IAyahNumber, string>> {
    const translatedVerses = await this.textService.textForVerses(verses, []);

    const result = new Map<IAyahNumber, string>();
    for (let i = 0; i < verses.length; i++) {
      result.set(verses[i], translatedVerses.verses[i].arabicText);
    }
    return result;
  }

  /**
   * Creates a Note from persistence model.
   */
  private createNote(quran: IQuran, model: NotePersistenceModel): Note {
    const versesArray = model.verses ? (Array.isArray(model.verses)
      ? model.verses
      : Array.from(model.verses)) : [];
    const verses = new Set(
      versesArray.map((v: VersePersistenceModel) => fromVersePersistenceModel(quran, v))
    );

    return createNote({
      verses,
      modifiedDate: model.modifiedDate,
      note: model.note ?? undefined,
      color: (model.color as NoteColor) ?? NoteColor.Red,
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts an AyahNumber to VersePersistenceModel.
 */
function toVersePersistenceModel(verse: IAyahNumber): VersePersistenceModel {
  return {
    ayah: verse.ayah,
    sura: verse.sura.suraNumber,
  };
}

/**
 * Creates an AyahNumber from VersePersistenceModel.
 */
function fromVersePersistenceModel(
  quran: IQuran,
  model: VersePersistenceModel
): IAyahNumber {
  const ayah = AyahNumber.create(quran, model.sura, model.ayah);
  if (!ayah) {
    throw new Error(`Invalid verse: ${model.sura}:${model.ayah}`);
  }
  return ayah;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a NoteService.
 */
export function createNoteService(
  persistence: NotePersistence,
  textService: QuranTextDataService,
  analytics: AnalyticsLibrary
): NoteService {
  return new NoteService(persistence, textService, analytics);
}

