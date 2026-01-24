/**
 * Juz.swift → juz.ts
 *
 * Juz model.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, IJuz, IHizb, IQuarter, IPage, IAyahNumber } from './types';
import { navigatableArray } from './navigatable';
import { compareAyahs } from './types';

/**
 * Represents a Juz (part) in the Quran.
 * There are 30 juzs in the Quran.
 */
export class Juz implements IJuz {
  private readonly _quran: IQuran;
  private readonly _juzNumber: number;

  constructor(quran: IQuran, juzNumber: number) {
    const juzCount = quran.raw.quarters.length / 8; // 8 quarters per juz (4 per hizb × 2 hizbs)
    if (juzNumber < 1 || juzNumber > juzCount) {
      throw new Error(`Invalid juz number: ${juzNumber}`);
    }
    this._quran = quran;
    this._juzNumber = juzNumber;
  }

  /**
   * Creates a Juz if valid, returns undefined otherwise.
   */
  static create(quran: IQuran, juzNumber: number): Juz | undefined {
    const juzCount = quran.raw.quarters.length / 8;
    if (juzNumber < 1 || juzNumber > juzCount) {
      return undefined;
    }
    return new Juz(quran, juzNumber);
  }

  get quran(): IQuran {
    return this._quran;
  }

  get juzNumber(): number {
    return this._juzNumber;
  }

  /**
   * The first hizb of this juz.
   */
  get hizb(): IHizb {
    const hizbsPerJuz = this._quran.hizbs.length / this._quran.juzs.length;
    const hizbNumber = (this._juzNumber - 1) * hizbsPerJuz + 1;
    return this._quran.hizbs[hizbNumber - 1];
  }

  /**
   * The first quarter of this juz.
   */
  get quarter(): IQuarter {
    return this.hizb.quarter;
  }

  /**
   * The first verse of this juz.
   */
  get firstVerse(): IAyahNumber {
    return this.quarter.firstVerse;
  }

  /**
   * The last verse of this juz.
   */
  get lastVerse(): IAyahNumber {
    const nextJuz = this.next;
    if (nextJuz) {
      return nextJuz.firstVerse.previous!;
    }
    return this._quran.lastVerse;
  }

  /**
   * All verses in this juz.
   */
  get verses(): IAyahNumber[] {
    return navigatableArray(this.firstVerse, this.lastVerse, compareAyahs);
  }

  /**
   * The page where this juz starts.
   */
  get page(): IPage {
    return this.firstVerse.page;
  }

  /**
   * Next juz, or undefined if this is the last juz.
   */
  get next(): IJuz | undefined {
    return Juz.create(this._quran, this._juzNumber + 1);
  }

  /**
   * Previous juz, or undefined if this is the first juz.
   */
  get previous(): IJuz | undefined {
    return Juz.create(this._quran, this._juzNumber - 1);
  }

  /**
   * Unique identifier.
   */
  get id(): string {
    return `juz-${this._juzNumber}`;
  }

  /**
   * Description for debugging.
   */
  get description(): string {
    return `<Juz ${this._juzNumber}>`;
  }

  /**
   * Equality check.
   */
  equals(other: IJuz): boolean {
    return this._juzNumber === other.juzNumber;
  }

  /**
   * Hash code for use in collections.
   */
  get hashCode(): number {
    return this._juzNumber;
  }
}

