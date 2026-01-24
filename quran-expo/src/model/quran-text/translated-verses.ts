/**
 * TranslatedVerses.swift → translated-verses.ts
 *
 * Models for translated verse text.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../quran-kit/types';
import type { Translation } from './translation';

/**
 * Represents a range within a string.
 */
export interface StringRange {
  start: number;
  end: number;
}

/**
 * Represents a translation string with metadata about special ranges.
 */
export interface TranslationString {
  /** The full text */
  readonly text: string;
  /** Ranges that contain Quran text (Arabic) */
  readonly quranRanges: readonly StringRange[];
  /** Ranges that contain footnote markers */
  readonly footnoteRanges: readonly StringRange[];
  /** The actual footnote texts */
  readonly footnotes: readonly string[];
}

/**
 * Creates a TranslationString.
 */
export function createTranslationString(params: {
  text: string;
  quranRanges?: StringRange[];
  footnoteRanges?: StringRange[];
  footnotes?: string[];
}): TranslationString {
  return {
    text: params.text,
    quranRanges: params.quranRanges ?? [],
    footnoteRanges: params.footnoteRanges ?? [],
    footnotes: params.footnotes ?? [],
  };
}

/**
 * Translation text can be either a string or a reference to another verse.
 */
export type TranslationText =
  | { type: 'string'; value: TranslationString }
  | { type: 'reference'; ayah: IAyahNumber };

/**
 * Creates a TranslationText from a string.
 */
export function translationTextString(value: TranslationString): TranslationText {
  return { type: 'string', value };
}

/**
 * Creates a TranslationText as a reference to another verse.
 */
export function translationTextReference(ayah: IAyahNumber): TranslationText {
  return { type: 'reference', ayah };
}

/**
 * Checks if a TranslationText is a string.
 */
export function isTranslationTextString(
  text: TranslationText
): text is { type: 'string'; value: TranslationString } {
  return text.type === 'string';
}

/**
 * Checks if a TranslationText is a reference.
 */
export function isTranslationTextReference(
  text: TranslationText
): text is { type: 'reference'; ayah: IAyahNumber } {
  return text.type === 'reference';
}

/**
 * Represents the text of a single verse with its translations.
 */
export interface VerseText {
  /** The Arabic text of the verse */
  readonly arabicText: string;
  /** Translations of the verse (one per selected translation) */
  readonly translations: readonly TranslationText[];
  /** Arabic text to show before the verse (e.g., Bismillah) */
  readonly arabicPrefix: readonly string[];
  /** Arabic text to show after the verse */
  readonly arabicSuffix: readonly string[];
}

/**
 * Creates a VerseText.
 */
export function createVerseText(params: {
  arabicText: string;
  translations?: TranslationText[];
  arabicPrefix?: string[];
  arabicSuffix?: string[];
}): VerseText {
  return {
    arabicText: params.arabicText,
    translations: params.translations ?? [],
    arabicPrefix: params.arabicPrefix ?? [],
    arabicSuffix: params.arabicSuffix ?? [],
  };
}

/**
 * Collection of translated verses.
 */
export interface TranslatedVerses {
  /** The translations used */
  readonly translations: readonly Translation[];
  /** The verse texts */
  readonly verses: readonly VerseText[];
}

/**
 * Creates a TranslatedVerses collection.
 */
export function createTranslatedVerses(params: {
  translations: Translation[];
  verses: VerseText[];
}): TranslatedVerses {
  return {
    translations: params.translations,
    verses: params.verses,
  };
}

/**
 * Checks if two TranslationStrings are equal.
 */
export function translationStringsEqual(a: TranslationString, b: TranslationString): boolean {
  if (a.text !== b.text) return false;
  if (a.quranRanges.length !== b.quranRanges.length) return false;
  if (a.footnoteRanges.length !== b.footnoteRanges.length) return false;
  if (a.footnotes.length !== b.footnotes.length) return false;

  for (let i = 0; i < a.quranRanges.length; i++) {
    if (a.quranRanges[i].start !== b.quranRanges[i].start) return false;
    if (a.quranRanges[i].end !== b.quranRanges[i].end) return false;
  }

  for (let i = 0; i < a.footnoteRanges.length; i++) {
    if (a.footnoteRanges[i].start !== b.footnoteRanges[i].start) return false;
    if (a.footnoteRanges[i].end !== b.footnoteRanges[i].end) return false;
  }

  for (let i = 0; i < a.footnotes.length; i++) {
    if (a.footnotes[i] !== b.footnotes[i]) return false;
  }

  return true;
}

