/**
 * Page.swift → page.ts
 *
 * Page model.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, IPage, ISura, IAyahNumber, IJuz, IQuarter } from './types';
import { binarySearchFirst } from './util';
import { navigatableArray } from './navigatable';
import { compareAyahs, comparePages } from './types';

/**
 * Represents a page in the Quran.
 */
export class Page implements IPage {
  private readonly _quran: IQuran;
  private readonly _pageNumber: number;

  constructor(quran: IQuran, pageNumber: number) {
    const pagesCount = quran.raw.startSuraOfPage.length;
    if (pageNumber < 1 || pageNumber > pagesCount) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }
    this._quran = quran;
    this._pageNumber = pageNumber;
  }

  /**
   * Creates a Page if valid, returns undefined otherwise.
   */
  static create(quran: IQuran, pageNumber: number): Page | undefined {
    const pagesCount = quran.raw.startSuraOfPage.length;
    if (pageNumber < 1 || pageNumber > pagesCount) {
      return undefined;
    }
    return new Page(quran, pageNumber);
  }

  get quran(): IQuran {
    return this._quran;
  }

  get pageNumber(): number {
    return this._pageNumber;
  }

  /**
   * The sura that starts on this page.
   */
  get startSura(): ISura {
    const suraNumber = this._quran.raw.startSuraOfPage[this._pageNumber - 1];
    return this._quran.suras[suraNumber - 1];
  }

  /**
   * The first verse on this page.
   */
  get firstVerse(): IAyahNumber {
    const sura = this.startSura;
    const ayahNumber = this._quran.raw.startAyahOfPage[this._pageNumber - 1];
    return this._quran.verses.find(
      (v) => v.sura.suraNumber === sura.suraNumber && v.ayah === ayahNumber
    )!;
  }

  /**
   * The last verse on this page.
   */
  get lastVerse(): IAyahNumber {
    const nextPage = this.next;
    if (nextPage) {
      return nextPage.firstVerse.previous!;
    }
    return this._quran.lastVerse;
  }

  /**
   * All verses on this page.
   */
  get verses(): IAyahNumber[] {
    return navigatableArray(this.firstVerse, this.lastVerse, compareAyahs);
  }

  /**
   * The juz that starts on or before this page.
   */
  get startJuz(): IJuz {
    return binarySearchFirst(this._quran.juzs, (juz) =>
      comparePages(this, juz.page) >= 0
    );
  }

  /**
   * The quarter that starts on this page, if any.
   */
  get quarter(): IQuarter | undefined {
    return this._quran.quarters.find((q) => q.page.pageNumber === this._pageNumber);
  }

  /**
   * Next page, or undefined if this is the last page.
   */
  get next(): IPage | undefined {
    return Page.create(this._quran, this._pageNumber + 1);
  }

  /**
   * Previous page, or undefined if this is the first page.
   */
  get previous(): IPage | undefined {
    return Page.create(this._quran, this._pageNumber - 1);
  }

  /**
   * Unique identifier.
   */
  get id(): string {
    return `page-${this._pageNumber}`;
  }

  /**
   * Description for debugging.
   */
  get description(): string {
    return `<Page ${this._pageNumber}>`;
  }

  /**
   * Equality check.
   */
  equals(other: IPage): boolean {
    return this._pageNumber === other.pageNumber;
  }

  /**
   * Hash code for use in collections.
   */
  get hashCode(): number {
    return this._pageNumber;
  }
}

