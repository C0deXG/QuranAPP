/**
 * ShareableVerseTextRetriever.swift → shareable-verse-text-retriever.ts
 *
 * Retrieves formatted text for sharing.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Directories } from '../../../core/utilities/file-manager';
import type { IAyahNumber } from '../../../model/quran-kit/types';
import type { TranslationText } from '../../../model/quran-text';
import { QuranMode } from '../../../model/quran-text';
import type { VerseTextPersistence } from '../../../data/verse-text-persistence';
import { SQLiteQuranVerseTextPersistence } from '../../../data/verse-text-persistence';
import { QuranTextDataService } from './quran-text-data-service';
import { QuranContentStatePreferences } from '../preferences/quran-content-state-preferences';
import { getLocalizedAyahName } from '../localization/quran-kit-localization';
import { arabicNumberFormatter } from '../../../core/localization/number-formatter';
import { lFormat } from '../../../core/localization';

// ============================================================================
// ShareableVerseTextRetriever
// ============================================================================

/**
 * Retrieves formatted text for sharing.
 */
export class ShareableVerseTextRetriever {
  private readonly textService: QuranTextDataService;
  private readonly shareableVersePersistence: VerseTextPersistence;

  constructor(databasesPath: string, quranFilePath: string) {
    this.textService = new QuranTextDataService(databasesPath, quranFilePath);
    // Use share mode persistence (without tajweed)
    this.shareableVersePersistence = new SQLiteQuranVerseTextPersistence(quranFilePath, 'share');
  }

  /**
   * Gets formatted text for verses for sharing.
   */
  async textForVerses(verses: IAyahNumber[]): Promise<string[]> {
    const [arabicText, translationText] = await Promise.all([
      this.arabicScript(verses),
      this.translations(verses),
    ]);

    const result = [...arabicText, ...translationText];
    result.push('');
    result.push(this.versesSummary(verses));

    return result;
  }

  /**
   * Gets summary text for verses.
   */
  private versesSummary(verses: IAyahNumber[]): string {
    if (verses.length === 1) {
      return getLocalizedAyahName(verses[0]);
    }
    return `${getLocalizedAyahName(verses[0])} - ${getLocalizedAyahName(verses[verses.length - 1])}`;
  }

  /**
   * Gets formatted Arabic text for a verse.
   */
  private async arabicText(verse: IAyahNumber): Promise<string> {
    const verseNumber = arabicNumberFormatter.format(verse.ayah);

    // RTL marks to ensure proper display
    const rightToLeftMark = '\u202B';
    const endMark = '\u202C';

    const arabicVerse = await this.shareableVersePersistence.textForVerse(verse);
    const formattedVerse = `${arabicVerse}﴿ ${verseNumber} ﴾`;

    return `${rightToLeftMark}${formattedVerse}${endMark}`;
  }

  /**
   * Gets Arabic script for all verses.
   */
  private async arabicScript(verses: IAyahNumber[]): Promise<string[]> {
    const arabicTexts = await Promise.all(verses.map((v) => this.arabicText(v)));
    return [arabicTexts.join(' ')];
  }

  /**
   * Gets translations if in translation mode.
   */
  private async translations(verses: IAyahNumber[]): Promise<string[]> {
    const preferences = QuranContentStatePreferences.shared;

    if (preferences.quranMode !== QuranMode.translation) {
      return [];
    }

    const translatedVerses = await this.textService.textForVerses(verses);
    return this.versesTranslationsText(translatedVerses);
  }

  /**
   * Formats translation text for sharing.
   */
  private versesTranslationsText(translatedVerses: { translations: Array<{ translationName: string }>; verses: Array<{ translations: TranslationText[] }> }): string[] {
    const components: string[] = [''];

    for (let i = 0; i < translatedVerses.translations.length; i++) {
      const translation = translatedVerses.translations[i];

      // Translator name
      components.push(`• ${translation.translationName}:`);

      // Translation text for all verses
      for (const verse of translatedVerses.verses) {
        components.push(this.stringFromTranslationText(verse.translations[i]));
      }

      // Separate multiple translations
      components.push('');
    }

    // Remove last empty line
    return components.slice(0, -1);
  }

  /**
   * Converts TranslationText to string.
   */
  private stringFromTranslationText(text: TranslationText): string {
    if (text.type === 'reference') {
      return lFormat('translation.text.see-referenced-verse', text.verse.ayah);
    }
    return text.string.text;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a ShareableVerseTextRetriever.
 */
export function createShareableVerseTextRetriever(
  databasesPath?: string,
  quranFilePath?: string
): ShareableVerseTextRetriever {
  const dbPath = databasesPath ?? `${Directories.documents}translations/`;
  const quranPath = quranFilePath ?? `${Directories.documents}quran.ar.db`;
  return new ShareableVerseTextRetriever(dbPath, quranPath);
}

