/**
 * AyahNumber.swift → ayah-number.ts
 *
 * AyahNumber (verse) model.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, ISura, IAyahNumber, IPage } from './types';
import { binarySearchFirst } from './util';
import { compareAyahs } from './types';

/**
 * Represents a verse (ayah) in the Quran.
 */
export class AyahNumber implements IAyahNumber {
  private readonly _sura: ISura;
  private readonly _ayah: number;

  constructor(sura: ISura, ayah: number) {
    if (ayah < 1 || ayah > sura.numberOfVerses) {
      throw new Error(`Invalid ayah number: ${ayah} for sura ${sura.suraNumber}`);
    }
    this._sura = sura;
    this._ayah = ayah;
  }

  /**
   * Creates an AyahNumber from quran, sura number, and ayah number.
   */
  static create(quran: IQuran, suraNumber: number, ayahNumber: number): AyahNumber | undefined {
    const sura = quran.suras[suraNumber - 1];
    if (!sura) {
      return undefined;
    }
    if (ayahNumber < 1 || ayahNumber > sura.numberOfVerses) {
      return undefined;
    }
    return new AyahNumber(sura, ayahNumber);
  }

  /**
   * Creates an AyahNumber from a sura, returns undefined if invalid.
   */
  static createFromSura(sura: ISura, ayah: number): AyahNumber | undefined {
    if (ayah < 1 || ayah > sura.numberOfVerses) {
      return undefined;
    }
    return new AyahNumber(sura, ayah);
  }

  get quran(): IQuran {
    return this._sura.quran;
  }

  get sura(): ISura {
    return this._sura;
  }

  get ayah(): number {
    return this._ayah;
  }

  /**
   * The page this verse appears on.
   */
  get page(): IPage {
    return binarySearchFirst(this.quran.pages, (page) =>
      compareAyahs(this, page.firstVerse) >= 0
    );
  }

  /**
   * Previous verse, or undefined if this is the first verse of the Quran.
   */
  get previous(): IAyahNumber | undefined {
    // Same sura
    if (this._ayah > 1) {
      return AyahNumber.createFromSura(this._sura, this._ayah - 1);
    }
    // Previous sura, last verse
    const prevSura = this._sura.previous;
    return prevSura?.lastVerse;
  }

  /**
   * Next verse, or undefined if this is the last verse of the Quran.
   */
  get next(): IAyahNumber | undefined {
    // Same sura
    if (this._ayah < this._sura.numberOfVerses) {
      return AyahNumber.createFromSura(this._sura, this._ayah + 1);
    }
    // Next sura, first verse
    const nextSura = this._sura.next;
    return nextSura?.firstVerse;
  }

  /**
   * Description for debugging.
   */
  get description(): string {
    return `<AyahNumber sura=${this._sura.suraNumber} ayah=${this._ayah}>`;
  }

  /**
   * Unique identifier.
   */
  get id(): string {
    return `${this._sura.suraNumber}:${this._ayah}`;
  }

  /**
   * Equality check.
   */
  equals(other: IAyahNumber): boolean {
    return this._sura.suraNumber === other.sura.suraNumber && this._ayah === other.ayah;
  }

  /**
   * Comparison for sorting.
   */
  compareTo(other: IAyahNumber): number {
    return compareAyahs(this, other);
  }

  /**
   * Check if this verse is less than another.
   */
  lessThan(other: IAyahNumber): boolean {
    return this.compareTo(other) < 0;
  }

  /**
   * Check if this verse is greater than another.
   */
  greaterThan(other: IAyahNumber): boolean {
    return this.compareTo(other) > 0;
  }

  /**
   * Check if this verse is less than or equal to another.
   */
  lessThanOrEqual(other: IAyahNumber): boolean {
    return this.compareTo(other) <= 0;
  }

  /**
   * Check if this verse is greater than or equal to another.
   */
  greaterThanOrEqual(other: IAyahNumber): boolean {
    return this.compareTo(other) >= 0;
  }

  /**
   * Hash code for use in collections.
   */
  get hashCode(): number {
    return this._sura.suraNumber * 1000 + this._ayah;
  }

  /**
   * Creates an array of verses from this verse to the end verse (inclusive).
   */
  arrayTo(end: IAyahNumber): IAyahNumber[] {
    if (compareAyahs(end, this) < 0) {
      throw new Error('End verse is less than start verse.');
    }

    const values: IAyahNumber[] = [this];
    let pointer: IAyahNumber = this;

    while (pointer.next !== undefined && compareAyahs(pointer.next, end) <= 0) {
      pointer = pointer.next;
      values.push(pointer);
    }

    return values;
  }

  /**
   * Serializes to JSON-compatible object.
   */
  toJSON(): { sura: number; ayah: number } {
    return {
      sura: this._sura.suraNumber,
      ayah: this._ayah,
    };
  }

  /**
   * Gets the localized name of this verse (e.g., "Al-Fatiha: 1")
   */
  get localizedName(): string {
    return `${this._sura.localizedName}: ${this._ayah}`;
  }

  /**
   * Gets the localized name with sura number (e.g., "1. Al-Fatiha: 1")
   */
  get localizedNameWithSuraNumber(): string {
    return `${this._sura.suraNumber}. ${this._sura.localizedName}: ${this._ayah}`;
  }
}

