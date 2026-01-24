/**
 * TranslationItem.swift → translation-item.ts
 *
 * Translation item models.
 *
 * Quran.com. All rights reserved.
 */

import type { Page, Sura, AyahNumber, IPage, ISura, IAyahNumber } from '../../model/quran-kit';
import type { Translation, TranslationString, FontSize } from '../../model/quran-text';

// ============================================================================
// TranslationItemId
// ============================================================================

/**
 * Unique identifier for translation items.
 *
 * 1:1 translation of iOS TranslationItemId.
 */
export type TranslationItemId =
  | { type: 'pageHeader'; page: IPage }
  | { type: 'pageFooter'; page: IPage }
  | { type: 'separator'; verse: IAyahNumber }
  | { type: 'suraName'; sura: ISura }
  | { type: 'arabic'; verse: IAyahNumber }
  | { type: 'translator'; verse: IAyahNumber; translationId: Translation['id'] }
  | { type: 'translationReference'; verse: IAyahNumber; translationId: Translation['id'] }
  | { type: 'translationTextChunk'; verse: IAyahNumber; translationId: Translation['id']; chunkIndex: number };

/**
 * Get the unique string key for a TranslationItemId.
 */
export function translationItemIdKey(id: TranslationItemId): string {
  switch (id.type) {
    case 'pageHeader':
      return `pageHeader-${id.page.pageNumber}`;
    case 'pageFooter':
      return `pageFooter-${id.page.pageNumber}`;
    case 'separator':
      return `separator-${id.verse.sura.suraNumber}-${id.verse.ayah}`;
    case 'suraName':
      return `suraName-${id.sura.suraNumber}`;
    case 'arabic':
      return `arabic-${id.verse.sura.suraNumber}-${id.verse.ayah}`;
    case 'translator':
      return `translator-${id.verse.sura.suraNumber}-${id.verse.ayah}-${id.translationId}`;
    case 'translationReference':
      return `translationReference-${id.verse.sura.suraNumber}-${id.verse.ayah}-${id.translationId}`;
    case 'translationTextChunk':
      return `translationTextChunk-${id.verse.sura.suraNumber}-${id.verse.ayah}-${id.translationId}-${id.chunkIndex}`;
  }
}

/**
 * Get the ayah for a TranslationItemId.
 */
export function translationItemIdAyah(id: TranslationItemId): AyahNumber | null {
  switch (id.type) {
    case 'pageHeader':
    case 'pageFooter':
      return null;
    case 'suraName':
      return id.sura.firstVerse;
    case 'separator':
    case 'arabic':
    case 'translator':
    case 'translationReference':
    case 'translationTextChunk':
      return id.verse;
  }
}

// ============================================================================
// Translation Item Data Models
// ============================================================================

export interface TranslationPageHeader {
  page: Page;
  id: TranslationItemId;
}

export function createTranslationPageHeader(page: Page): TranslationPageHeader {
  return { page, id: { type: 'pageHeader', page } };
}

export interface TranslationPageFooter {
  page: Page;
  id: TranslationItemId;
}

export function createTranslationPageFooter(page: Page): TranslationPageFooter {
  return { page, id: { type: 'pageFooter', page } };
}

export interface TranslationVerseSeparator {
  verse: AyahNumber;
  id: TranslationItemId;
}

export function createTranslationVerseSeparator(verse: AyahNumber): TranslationVerseSeparator {
  return { verse, id: { type: 'separator', verse } };
}

export interface TranslationSuraName {
  sura: ISura;
  arabicFontSize: FontSize;
  id: TranslationItemId;
}

export function createTranslationSuraName(sura: ISura, arabicFontSize: FontSize): TranslationSuraName {
  return { sura, arabicFontSize, id: { type: 'suraName', sura: sura as Sura } };
}

export interface TranslationArabicText {
  verse: IAyahNumber;
  text: string;
  arabicFontSize: FontSize;
  id: TranslationItemId;
}

export function createTranslationArabicText(
  verse: IAyahNumber,
  text: string,
  arabicFontSize: FontSize
): TranslationArabicText {
  return { verse, text, arabicFontSize, id: { type: 'arabic', verse } };
}

export interface TranslationTextChunk {
  verse: AyahNumber;
  translation: Translation;
  text: TranslationString;
  chunks: Array<{ start: number; end: number }>;
  chunkIndex: number;
  readMore: boolean;
  translationFontSize: FontSize;
  id: TranslationItemId;
}

export function createTranslationTextChunk(
  verse: AyahNumber,
  translation: Translation,
  text: TranslationString,
  chunks: Array<{ start: number; end: number }>,
  chunkIndex: number,
  readMore: boolean,
  translationFontSize: FontSize
): TranslationTextChunk {
  return {
    verse,
    translation,
    text,
    chunks,
    chunkIndex,
    readMore,
    translationFontSize,
    id: { type: 'translationTextChunk', verse, translationId: translation.id, chunkIndex },
  };
}

export interface TranslationReferenceVerse {
  verse: AyahNumber;
  translation: Translation;
  reference: AyahNumber;
  translationFontSize: FontSize;
  id: TranslationItemId;
}

export function createTranslationReferenceVerse(
  verse: AyahNumber,
  translation: Translation,
  reference: AyahNumber,
  translationFontSize: FontSize
): TranslationReferenceVerse {
  return {
    verse,
    translation,
    reference,
    translationFontSize,
    id: { type: 'translationReference', verse, translationId: translation.id },
  };
}

export interface TranslatorText {
  verse: AyahNumber;
  translation: Translation;
  translationFontSize: FontSize;
  id: TranslationItemId;
}

export function createTranslatorText(
  verse: AyahNumber,
  translation: Translation,
  translationFontSize: FontSize
): TranslatorText {
  return {
    verse,
    translation,
    translationFontSize,
    id: { type: 'translator', verse, translationId: translation.id },
  };
}

// ============================================================================
// TranslationItem
// ============================================================================

/**
 * Union type for all translation items.
 *
 * 1:1 translation of iOS TranslationItem.
 */
export type TranslationItem =
  | { type: 'pageHeader'; data: TranslationPageHeader }
  | { type: 'pageFooter'; data: TranslationPageFooter }
  | { type: 'verseSeparator'; data: TranslationVerseSeparator; color: string | null }
  | { type: 'suraName'; data: TranslationSuraName; color: string | null }
  | { type: 'arabicText'; data: TranslationArabicText; color: string | null }
  | { type: 'translationTextChunk'; data: TranslationTextChunk; color: string | null }
  | { type: 'translationReferenceVerse'; data: TranslationReferenceVerse; color: string | null }
  | { type: 'translatorText'; data: TranslatorText; color: string | null };

/**
 * Get the id of a TranslationItem.
 */
export function getTranslationItemId(item: TranslationItem): TranslationItemId {
  return item.data.id;
}

/**
 * Get the color of a TranslationItem.
 */
export function getTranslationItemColor(item: TranslationItem): string | null {
  switch (item.type) {
    case 'pageHeader':
    case 'pageFooter':
      return null;
    default:
      return item.color;
  }
}

