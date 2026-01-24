/**
 * Quarter.swift → quarter.ts
 *
 * Quarter (Rub' al-Hizb) model.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, IQuarter, IPage, IAyahNumber, IHizb, IJuz } from './types';
import { navigatableArray } from './navigatable';
import { compareAyahs } from './types';

/**
 * Represents a quarter (Rub' al-Hizb) in the Quran.
 * There are 240 quarters (4 per hizb × 60 hizbs).
 */
export class Quarter implements IQuarter {
  private readonly _quran: IQuran;
  private readonly _quarterNumber: number;

  constructor(quran: IQuran, quarterNumber: number) {
    if (quarterNumber < 1 || quarterNumber > quran.raw.quarters.length) {
      throw new Error(`Invalid quarter number: ${quarterNumber}`);
    }
    this._quran = quran;
    this._quarterNumber = quarterNumber;
  }

  /**
   * Creates a Quarter if valid, returns undefined otherwise.
   */
  static create(quran: IQuran, quarterNumber: number): Quarter | undefined {
    if (quarterNumber < 1 || quarterNumber > quran.raw.quarters.length) {
      return undefined;
    }
    return new Quarter(quran, quarterNumber);
  }

  get quran(): IQuran {
    return this._quran;
  }

  get quarterNumber(): number {
    return this._quarterNumber;
  }

  /**
   * The first verse of this quarter.
   */
  get firstVerse(): IAyahNumber {
    const verseInfo = this._quran.raw.quarters[this._quarterNumber - 1];
    return this._quran.verses.find(
      (v) => v.sura.suraNumber === verseInfo.sura && v.ayah === verseInfo.ayah
    )!;
  }

  /**
   * The last verse of this quarter.
   */
  get lastVerse(): IAyahNumber {
    const nextQuarter = this.next;
    if (nextQuarter) {
      return nextQuarter.firstVerse.previous!;
    }
    return this._quran.lastVerse;
  }

  /**
   * All verses in this quarter.
   */
  get verses(): IAyahNumber[] {
    return navigatableArray(this.firstVerse, this.lastVerse, compareAyahs);
  }

  /**
   * The page where this quarter starts.
   */
  get page(): IPage {
    return this.firstVerse.page;
  }

  /**
   * The hizb this quarter belongs to.
   */
  get hizb(): IHizb {
    const quartersPerHizb = this._quran.quarters.length / this._quran.hizbs.length;
    const hizbNumber = Math.floor((this._quarterNumber - 1) / quartersPerHizb) + 1;
    return this._quran.hizbs[hizbNumber - 1];
  }

  /**
   * The juz this quarter belongs to.
   */
  get juz(): IJuz {
    const quartersPerJuz = this._quran.quarters.length / this._quran.juzs.length;
    const juzNumber = Math.floor((this._quarterNumber - 1) / quartersPerJuz) + 1;
    return this._quran.juzs[juzNumber - 1];
  }

  /**
   * Next quarter, or undefined if this is the last quarter.
   */
  get next(): IQuarter | undefined {
    return Quarter.create(this._quran, this._quarterNumber + 1);
  }

  /**
   * Previous quarter, or undefined if this is the first quarter.
   */
  get previous(): IQuarter | undefined {
    return Quarter.create(this._quran, this._quarterNumber - 1);
  }

  /**
   * Unique identifier.
   */
  get id(): string {
    return `quarter-${this._quarterNumber}`;
  }

  /**
   * Description for debugging.
   */
  get description(): string {
    return `<Quarter ${this._quarterNumber}>`;
  }

  /**
   * Equality check.
   */
  equals(other: IQuarter): boolean {
    return this._quarterNumber === other.quarterNumber;
  }

  /**
   * Hash code for use in collections.
   */
  get hashCode(): number {
    return this._quarterNumber;
  }
}

