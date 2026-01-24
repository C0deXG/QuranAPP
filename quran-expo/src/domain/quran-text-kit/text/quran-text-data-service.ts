/**
 * QuranTextDataService.swift → quran-text-data-service.ts
 *
 * Service for retrieving Quran text and translations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Directories } from '../../../core/utilities/file-manager';
import type { IAyahNumber } from '../../../model/quran-kit/types';
import type {
  Translation,
  TranslatedVerses,
  VerseText,
  TranslationText,
  TranslationString,
  StringRange,
} from '../../../model/quran-text';
import {
  createTranslatedVerses,
  createVerseText,
  createTranslationString,
  translationTextReference,
  translationTextString,
} from '../../../model/quran-text';
import type { VerseTextPersistence, TranslationVerseTextPersistence, TranslationTextModel } from '../../../data/verse-text-persistence';
import { ayahKey } from '../../../data/verse-text-persistence';
import { LocalTranslationsRetriever, SelectedTranslationsPreferences } from '../../translation-service';
import { crasher } from '../../../core/crashing';
import { l, lFormat } from '../../../core/localization';
import { sortedAs } from '../../../core/utilities/array';

// ============================================================================
// Regex Patterns
// ============================================================================

/** Regex to detect quran text in translation text. */
const QURAN_REGEX = /([«{﴿][\s\S]*?[﴾}»])/g;

/** Regex to detect footnotes in translation text. */
const FOOTNOTES_REGEX = /\[\[[\s\S]*?]]/g;

// ============================================================================
// QuranTextDataService
// ============================================================================

/**
 * Service for retrieving Quran text and translations.
 */
export class QuranTextDataService {
  private readonly localTranslationRetriever: LocalTranslationsRetriever;
  private readonly arabicPersistence: VerseTextPersistence;
  private readonly translationsPersistenceBuilder: (translation: Translation) => TranslationVerseTextPersistence;

  constructor(
    databasesPath: string,
    quranFilePath: string,
    arabicPersistence?: VerseTextPersistence,
    translationsPersistenceBuilder?: (translation: Translation) => TranslationVerseTextPersistence
  ) {
    this.localTranslationRetriever = new LocalTranslationsRetriever(databasesPath);
    
    // Use passed persistence or create a stub that will be replaced
    this.arabicPersistence = arabicPersistence ?? this.createStubPersistence();
    this.translationsPersistenceBuilder = translationsPersistenceBuilder ?? (() => this.createStubTranslationPersistence());
  }

  /**
   * Creates a stub persistence for when no implementation is provided.
   */
  private createStubPersistence(): VerseTextPersistence {
    return {
      textForVerse: async () => '',
      textForVerses: async () => new Map(),
      autocomplete: async () => [],
      search: async () => [],
    };
  }

  /**
   * Creates a stub translation persistence.
   */
  private createStubTranslationPersistence(): TranslationVerseTextPersistence {
    return {
      textForVerse: async () => ({ type: 'string', text: '' }),
      textForVerses: async () => new Map(),
      autocomplete: async () => [],
      search: async () => [],
    };
  }

  /**
   * Gets text for verses with specific translations.
   */
  async textForVersesMap(
    verses: IAyahNumber[],
    translations: Translation[]
  ): Promise<Map<IAyahNumber, VerseText>> {
    const translatedVerses = await this.textForVerses(verses, translations);
    const result = new Map<IAyahNumber, VerseText>();

    for (let i = 0; i < verses.length; i++) {
      result.set(verses[i], translatedVerses.verses[i]);
    }

    return result;
  }

  /**
   * Gets text for verses with selected translations.
   */
  async textForVerses(verses: IAyahNumber[], translations?: Translation[]): Promise<TranslatedVerses> {
    const effectiveTranslations = translations ?? await this.localTranslations();

    // Get Arabic text and translations text in parallel
    const [arabicText, translationsText] = await Promise.all([
      this.retrieveArabicText(verses),
      this.fetchTranslationsText(verses, effectiveTranslations),
    ]);

    return createTranslatedVerses({
      translations: translationsText.map(([t]) => t),
      verses: this.mergeVerses(verses, translationsText, arabicText),
    });
  }

  /**
   * Merges Arabic text with translation text.
   */
  private mergeVerses(
    verses: IAyahNumber[],
    translations: Array<[Translation, TranslationText[]]>,
    arabic: string[]
  ): VerseText[] {
    const versesText: VerseText[] = [];

    for (let i = 0; i < verses.length; i++) {
      const verse = verses[i];
      const arabicText = arabic[i];
      const ayahTranslations = translations.map(([, ayahs]) => ayahs[i]);

      // Add Bismillah prefix if first verse of sura (except Fatiha and Tawbah)
      const prefix = verse.ayah === 1 &&
        verse.sura.suraNumber !== 1 &&
        verse.sura.suraNumber !== 9
        ? [verse.quran.arabicBesmAllah]
        : [];

      versesText.push(
        createVerseText({
          arabicText,
          translations: ayahTranslations,
          arabicPrefix: prefix,
          arabicSuffix: [],
        })
      );
    }

    return versesText;
  }

  /**
   * Gets selected local translations.
   */
  private async localTranslations(): Promise<Translation[]> {
    const translations = await this.localTranslationRetriever.getLocalTranslations();
    return this.selectedTranslations(translations);
  }

  /**
   * Filters to selected translations.
   */
  private selectedTranslations(allTranslations: Translation[]): Translation[] {
    const selected = SelectedTranslationsPreferences.shared.selectedTranslationIds;
    const translationsById = new Map(allTranslations.map((t) => [t.id, t]));
    return selected.map((id) => translationsById.get(id)).filter((t): t is Translation => t !== undefined);
  }

  /**
   * Retrieves Arabic text for verses.
   */
  private async retrieveArabicText(verses: IAyahNumber[]): Promise<string[]> {
    const versesText = await this.arabicPersistence.textForVerses(verses);
    return verses.map((verse) => versesText.get(ayahKey(verse)) ?? '');
  }

  /**
   * Fetches translation text for all translations.
   */
  private async fetchTranslationsText(
    verses: IAyahNumber[],
    translations: Translation[]
  ): Promise<Array<[Translation, TranslationText[]]>> {
    const results = await Promise.all(
      translations.map((translation) => this.fetchTranslation(verses, translation))
    );

    return sortedAs(results, translations.map((t) => t.id), ([t]) => t.id);
  }

  /**
   * Fetches text for a single translation.
   */
  private async fetchTranslation(
    verses: IAyahNumber[],
    translation: Translation
  ): Promise<[Translation, TranslationText[]]> {
    const translationPersistence = this.translationsPersistenceBuilder(translation);

    try {
      const versesText = await translationPersistence.textForVerses(verses, verses[0].quran);
      const textList: TranslationText[] = verses.map((verse) => {
        const text = versesText.get(ayahKey(verse));
        if (!text) {
          return translationTextString(createTranslationString({
            text: l('error.translation.text-not-available'),
          }));
        }
        return this.translationText(text);
      });

      return [translation, textList];
    } catch (error) {
      crasher.recordError(
        error as Error,
        `Issue getting verse ${verses.map((v) => `${v.sura.suraNumber}:${v.ayah}`).join(', ')}, translation: ${translation.id}`
      );

      const errorText = l('error.translation.text-retrieval');
      const textList: TranslationText[] = verses.map(() =>
        translationTextString(createTranslationString({
          text: errorText,
        }))
      );

      return [translation, textList];
    }
  }

  /**
   * Converts persistence model to TranslationText.
   */
  private translationText(from: TranslationTextModel): TranslationText {
    if (from.type === 'reference') {
      return translationTextReference(from.verse);
    }
    return translationTextString(this.translationString(from.text));
  }

  /**
   * Processes translation string with footnotes and quran ranges.
   */
  private translationString(originalString: string): TranslationString {
    // Find footnote ranges
    const footnoteMatches = Array.from(originalString.matchAll(FOOTNOTES_REGEX));
    const footnotes = footnoteMatches.map((m) => m[0]);

    // Replace footnotes with numbered markers
    let processedString = originalString;
    let offset = 0;
    const footnoteRanges: StringRange[] = [];

    footnoteMatches.forEach((match, index) => {
      const replacement = `[${index + 1}]`;
      const startIndex = match.index! + offset;
      const endIndex = startIndex + replacement.length;

      processedString =
        processedString.slice(0, startIndex) +
        replacement +
        processedString.slice(startIndex + match[0].length);

      footnoteRanges.push({ start: startIndex, end: endIndex });
      offset += replacement.length - match[0].length;
    });

    // Find quran text ranges
    const quranMatches = Array.from(processedString.matchAll(QURAN_REGEX));
    const quranRanges: StringRange[] = quranMatches.map((m) => ({
      start: m.index!,
      end: m.index! + m[0].length,
    }));

    return createTranslationString({
      text: processedString,
      quranRanges,
      footnoteRanges,
      footnotes,
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a QuranTextDataService.
 */
export function createQuranTextDataService(
  databasesPath?: string,
  quranFilePath?: string
): QuranTextDataService {
  const dbPath = databasesPath ?? `${Directories.documents}translations/`;
  const quranPath = quranFilePath ?? `${Directories.documents}quran.ar.db`;
  return new QuranTextDataService(dbPath, quranPath);
}
