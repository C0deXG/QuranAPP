/**
 * Core type definitions for QuranKit.
 *
 * Forward declarations to handle circular dependencies.
 */

import type { QuranReadingInfoRawData } from './quran-reading-info';

/**
 * Quran instance interface (forward declaration).
 * The actual implementation is in quran.ts.
 */
export interface IQuran {
  readonly raw: QuranReadingInfoRawData;
  readonly arabicBesmAllah: string;
  readonly suras: ISura[];
  readonly pages: IPage[];
  readonly juzs: IJuz[];
  readonly quarters: IQuarter[];
  readonly hizbs: IHizb[];
  readonly verses: IAyahNumber[];
  readonly firstSura: ISura;
  readonly firstVerse: IAyahNumber;
  readonly lastVerse: IAyahNumber;
}

/**
 * Sura interface (forward declaration).
 */
export interface ISura {
  readonly quran: IQuran;
  readonly suraNumber: number;
  readonly startsWithBesmAllah: boolean;
  readonly isMakki: boolean;
  readonly page: IPage;
  readonly firstVerse: IAyahNumber;
  readonly lastVerse: IAyahNumber;
  readonly numberOfVerses: number;
  /** Alias for numberOfVerses (iOS compatibility) */
  readonly numberOfAyahs: number;
  readonly verses: IAyahNumber[];
  readonly next: ISura | undefined;
  readonly previous: ISura | undefined;
  /** Get the localized name of this sura */
  localizedName(): string;
  /** Get the Arabic name of this sura */
  readonly arabicSuraName: string;
}

/**
 * Page interface (forward declaration).
 */
export interface IPage {
  readonly quran: IQuran;
  readonly pageNumber: number;
  readonly firstVerse: IAyahNumber;
  readonly lastVerse: IAyahNumber;
  readonly startSura: ISura;
  readonly startJuz: IJuz;
  readonly quarter: IQuarter | undefined;
  readonly verses: IAyahNumber[];
  readonly next: IPage | undefined;
  readonly previous: IPage | undefined;
}

/**
 * Juz interface (forward declaration).
 */
export interface IJuz {
  readonly quran: IQuran;
  readonly juzNumber: number;
  readonly firstVerse: IAyahNumber;
  readonly lastVerse: IAyahNumber;
  readonly page: IPage;
  readonly hizb: IHizb;
  readonly quarter: IQuarter;
  readonly verses: IAyahNumber[];
  readonly next: IJuz | undefined;
  readonly previous: IJuz | undefined;
}

/**
 * Hizb interface (forward declaration).
 */
export interface IHizb {
  readonly quran: IQuran;
  readonly hizbNumber: number;
  readonly firstVerse: IAyahNumber;
  readonly lastVerse: IAyahNumber;
  readonly quarter: IQuarter;
  readonly juz: IJuz;
  readonly verses: IAyahNumber[];
  readonly next: IHizb | undefined;
  readonly previous: IHizb | undefined;
}

/**
 * Quarter interface (forward declaration).
 */
export interface IQuarter {
  readonly quran: IQuran;
  readonly quarterNumber: number;
  readonly firstVerse: IAyahNumber;
  readonly lastVerse: IAyahNumber;
  readonly page: IPage;
  readonly hizb: IHizb;
  readonly juz: IJuz;
  readonly verses: IAyahNumber[];
  readonly next: IQuarter | undefined;
  readonly previous: IQuarter | undefined;
}

/**
 * AyahNumber interface (forward declaration).
 */
export interface IAyahNumber {
  readonly quran: IQuran;
  readonly sura: ISura;
  readonly ayah: number;
  readonly page: IPage;
  readonly next: IAyahNumber | undefined;
  readonly previous: IAyahNumber | undefined;
  readonly localizedName?: string;
  readonly localizedNameWithSuraNumber?: string;
}

/**
 * Word interface.
 */
export interface IWord {
  readonly verse: IAyahNumber;
  readonly wordNumber: number;
}

/**
 * Comparison functions for Quran types.
 */
export function compareSuras(a: ISura, b: ISura): number {
  return a.suraNumber - b.suraNumber;
}

export function comparePages(a: IPage, b: IPage): number {
  return a.pageNumber - b.pageNumber;
}

export function compareJuzs(a: IJuz, b: IJuz): number {
  return a.juzNumber - b.juzNumber;
}

export function compareHizbs(a: IHizb, b: IHizb): number {
  return a.hizbNumber - b.hizbNumber;
}

export function compareQuarters(a: IQuarter, b: IQuarter): number {
  return a.quarterNumber - b.quarterNumber;
}

export function compareAyahs(a: IAyahNumber, b: IAyahNumber): number {
  if (a.sura.suraNumber === b.sura.suraNumber) {
    return a.ayah - b.ayah;
  }
  return a.sura.suraNumber - b.sura.suraNumber;
}

export function compareWords(a: IWord, b: IWord): number {
  const verseComparison = compareAyahs(a.verse, b.verse);
  if (verseComparison !== 0) {
    return verseComparison;
  }
  return a.wordNumber - b.wordNumber;
}

