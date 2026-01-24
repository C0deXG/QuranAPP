/**
 * Hizb.swift → hizb.ts
 *
 * Hizb model.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, IHizb, IQuarter, IJuz, IAyahNumber } from './types';
import { navigatableArray } from './navigatable';
import { compareAyahs } from './types';

/**
 * Represents a Hizb in the Quran.
 * There are 60 hizbs (2 per juz × 30 juzs).
 */
export class Hizb implements IHizb {
  private readonly _quran: IQuran;
  private readonly _hizbNumber: number;

  constructor(quran: IQuran, hizbNumber: number) {
    const hizbCount = quran.raw.quarters.length / 4; // 4 quarters per hizb
    if (hizbNumber < 1 || hizbNumber > hizbCount) {
      throw new Error(`Invalid hizb number: ${hizbNumber}`);
    }
    this._quran = quran;
    this._hizbNumber = hizbNumber;
  }

  /**
   * Creates a Hizb if valid, returns undefined otherwise.
   */
  static create(quran: IQuran, hizbNumber: number): Hizb | undefined {
    const hizbCount = quran.raw.quarters.length / 4;
    if (hizbNumber < 1 || hizbNumber > hizbCount) {
      return undefined;
    }
    return new Hizb(quran, hizbNumber);
  }

  get quran(): IQuran {
    return this._quran;
  }

  get hizbNumber(): number {
    return this._hizbNumber;
  }

  /**
   * The first quarter of this hizb.
   */
  get quarter(): IQuarter {
    const quartersPerHizb = this._quran.quarters.length / this._quran.hizbs.length;
    const quarterNumber = (this._hizbNumber - 1) * quartersPerHizb + 1;
    return this._quran.quarters[quarterNumber - 1];
  }

  /**
   * The first verse of this hizb.
   */
  get firstVerse(): IAyahNumber {
    return this.quarter.firstVerse;
  }

  /**
   * The last verse of this hizb.
   */
  get lastVerse(): IAyahNumber {
    const nextHizb = this.next;
    if (nextHizb) {
      return nextHizb.firstVerse.previous!;
    }
    return this._quran.lastVerse;
  }

  /**
   * All verses in this hizb.
   */
  get verses(): IAyahNumber[] {
    return navigatableArray(this.firstVerse, this.lastVerse, compareAyahs);
  }

  /**
   * The juz this hizb belongs to.
   */
  get juz(): IJuz {
    return this.quarter.juz;
  }

  /**
   * Next hizb, or undefined if this is the last hizb.
   */
  get next(): IHizb | undefined {
    return Hizb.create(this._quran, this._hizbNumber + 1);
  }

  /**
   * Previous hizb, or undefined if this is the first hizb.
   */
  get previous(): IHizb | undefined {
    return Hizb.create(this._quran, this._hizbNumber - 1);
  }

  /**
   * Unique identifier.
   */
  get id(): string {
    return `hizb-${this._hizbNumber}`;
  }

  /**
   * Description for debugging.
   */
  get description(): string {
    return `<Hizb ${this._hizbNumber}>`;
  }

  /**
   * Equality check.
   */
  equals(other: IHizb): boolean {
    return this._hizbNumber === other.hizbNumber;
  }

  /**
   * Hash code for use in collections.
   */
  get hashCode(): number {
    return this._hizbNumber;
  }
}

