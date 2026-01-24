/**
 * Sura.swift → sura.ts
 *
 * Sura (chapter) model.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, ISura, IPage, IAyahNumber } from './types';
import { navigatableArray } from './navigatable';
import { compareAyahs } from './types';
import { getSuraName, getArabicSuraName } from '../../core/localization';

/**
 * Represents a Sura (chapter) in the Quran.
 */
export class Sura implements ISura {
  private readonly _quran: IQuran;
  private readonly _suraNumber: number;

  constructor(quran: IQuran, suraNumber: number) {
    if (suraNumber < 1 || suraNumber > quran.raw.startPageOfSura.length) {
      throw new Error(`Invalid sura number: ${suraNumber}`);
    }
    this._quran = quran;
    this._suraNumber = suraNumber;
  }

  /**
   * Creates a Sura if valid, returns undefined otherwise.
   */
  static create(quran: IQuran, suraNumber: number): Sura | undefined {
    if (suraNumber < 1 || suraNumber > quran.raw.startPageOfSura.length) {
      return undefined;
    }
    return new Sura(quran, suraNumber);
  }

  get quran(): IQuran {
    return this._quran;
  }

  get suraNumber(): number {
    return this._suraNumber;
  }

  /**
   * Whether this sura starts with Bismillah.
   * Al-Fatiha (1) doesn't need it (it's included as verse 1).
   * At-Tawbah (9) doesn't have it.
   */
  get startsWithBesmAllah(): boolean {
    return this._suraNumber !== 1 && this._suraNumber !== 9;
  }

  /**
   * Whether this sura was revealed in Makkah.
   */
  get isMakki(): boolean {
    return this._quran.raw.isMakkiSura[this._suraNumber - 1];
  }

  /**
   * The page where this sura starts.
   */
  get page(): IPage {
    const pageNumber = this._quran.raw.startPageOfSura[this._suraNumber - 1];
    return this._quran.pages[pageNumber - 1];
  }

  /**
   * Number of verses in this sura.
   */
  get numberOfVerses(): number {
    return this._quran.raw.numberOfAyahsInSura[this._suraNumber - 1];
  }

  /**
   * Alias for numberOfVerses (iOS compatibility).
   */
  get numberOfAyahs(): number {
    return this.numberOfVerses;
  }

  /**
   * Gets the starting page of this sura.
   */
  startPage(quran: IQuran): IPage {
    return this.page;
  }

  /**
   * Gets the localized name of this sura.
   */
  localizedName(): string {
    return getSuraName(this._suraNumber - 1);
  }

  /**
   * First verse of this sura.
   */
  get firstVerse(): IAyahNumber {
    return this._quran.verses.find(
      (v) => v.sura.suraNumber === this._suraNumber && v.ayah === 1
    )!;
  }

  /**
   * Last verse of this sura.
   */
  get lastVerse(): IAyahNumber {
    return this._quran.verses.find(
      (v) => v.sura.suraNumber === this._suraNumber && v.ayah === this.numberOfVerses
    )!;
  }

  /**
   * All verses in this sura.
   */
  get verses(): IAyahNumber[] {
    return navigatableArray(this.firstVerse, this.lastVerse, compareAyahs);
  }

  /**
   * Next sura, or undefined if this is the last sura.
   */
  get next(): ISura | undefined {
    return Sura.create(this._quran, this._suraNumber + 1);
  }

  /**
   * Previous sura, or undefined if this is the first sura.
   */
  get previous(): ISura | undefined {
    return Sura.create(this._quran, this._suraNumber - 1);
  }

  /**
   * Arabic name of the sura.
   */
  get arabicSuraName(): string {
    return getArabicSuraName(this._suraNumber);
  }

  /**
   * Unique identifier.
   */
  get id(): string {
    return `sura-${this._suraNumber}`;
  }

  /**
   * Description for debugging.
   */
  get description(): string {
    return `<Sura ${this._suraNumber}>`;
  }

  /**
   * Equality check.
   */
  equals(other: ISura): boolean {
    return this._suraNumber === other.suraNumber;
  }

  /**
   * Hash code for use in collections.
   */
  get hashCode(): number {
    return this._suraNumber;
  }
}

