/**
 * QuranKit - Core Quran data models
 *
 * Translated from quran-ios/Model/QuranKit
 *
 * This module provides:
 * - Quran class with static instances for different readings
 * - Sura, Page, Juz, Hizb, Quarter models
 * - AyahNumber and Word models
 * - Navigation utilities
 * - LastAyahFinder implementations
 */

// Types (forward declarations)
export type {
  IQuran,
  ISura,
  IPage,
  IJuz,
  IHizb,
  IQuarter,
  IAyahNumber,
  IWord,
} from './types';

export {
  compareSuras,
  comparePages,
  compareJuzs,
  compareHizbs,
  compareQuarters,
  compareAyahs,
  compareWords,
} from './types';

// Raw data
export type { QuranReadingInfoRawData } from './quran-reading-info';
export {
  Madani1405QuranReadingInfoRawData,
  Madani1440QuranReadingInfoRawData,
} from './quran-reading-info';

// Utilities
export { binarySearchIndex, binarySearchFirst } from './util';
export type { Navigatable } from './navigatable';
export { navigatableArray } from './navigatable';

// Models (concrete classes)
export { Quran } from './quran';
export { Sura } from './sura';
export { Page } from './page';
export { Juz } from './juz';
export { Hizb } from './hizb';
export { Quarter } from './quarter';
export { AyahNumber } from './ayah-number';
export { Word } from './word';

// Type aliases for interface-based usage (preferred for function parameters)
// These allow functions to accept both concrete instances and interface-compatible objects
import type { IAyahNumber, ISura, IPage, IJuz, IHizb, IQuarter, IWord } from './types';
export type AyahNumberType = IAyahNumber;
export type SuraType = ISura;
export type PageType = IPage;
export type JuzType = IJuz;
export type HizbType = IHizb;
export type QuarterType = IQuarter;
export type WordType = IWord;

// Re-export interfaces as common names for backwards compatibility
// This allows code that was written for concrete classes to work with interfaces
export type { IAyahNumber as AyahNumberLike } from './types';
export type { ISura as SuraLike } from './types';
export type { IPage as PageLike } from './types';
export type { IJuz as JuzLike } from './types';
export type { IHizb as HizbLike } from './types';
export type { IQuarter as QuarterLike } from './types';

// Reading types
export { Reading, SORTED_READINGS, quranForReading, setQuranForReading } from './reading';

// LastAyahFinder
export type { LastAyahFinder, LastAyahScope } from './last-ayah-finder';
export {
  SuraBasedLastAyahFinder,
  PageBasedLastAyahFinder,
  JuzBasedLastAyahFinder,
  createLastAyahFinder,
} from './last-ayah-finder';

