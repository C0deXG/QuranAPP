/**
 * Quran.swift → quran.ts
 *
 * Main Quran class - the entry point for accessing Quran data.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran, ISura, IPage, IJuz, IHizb, IQuarter, IAyahNumber } from './types';
import type { QuranReadingInfoRawData } from './quran-reading-info';
import {
  Madani1405QuranReadingInfoRawData,
  Madani1440QuranReadingInfoRawData,
} from './quran-reading-info';
import { Sura } from './sura';
import { Page } from './page';
import { Juz } from './juz';
import { Hizb } from './hizb';
import { Quarter } from './quarter';
import { AyahNumber } from './ayah-number';
import { Reading, setQuranForReading } from './reading';

/**
 * Main Quran class providing access to all Quran data.
 */
export class Quran implements IQuran {
  private readonly _raw: QuranReadingInfoRawData;
  private readonly _id: string;

  // Lazy-loaded collections
  private _suras: ISura[] | undefined;
  private _pages: IPage[] | undefined;
  private _juzs: IJuz[] | undefined;
  private _hizbs: IHizb[] | undefined;
  private _quarters: IQuarter[] | undefined;
  private _verses: IAyahNumber[] | undefined;

  private constructor(raw: QuranReadingInfoRawData, id: string) {
    this._raw = raw;
    this._id = id;
  }

  /**
   * Hafs Madani 1405 edition (classic).
   */
  static readonly hafsMadani1405: Quran = new Quran(
    Madani1405QuranReadingInfoRawData,
    'hafs-madani-1405'
  );

  /**
   * Hafs Madani 1440 edition.
   */
  static readonly hafsMadani1440: Quran = new Quran(
    Madani1440QuranReadingInfoRawData,
    'hafs-madani-1440'
  );

  /**
   * Alias for hafsMadani1405 - the default page-based Quran.
   * Used in iOS as madpiPageQuran.
   */
  static readonly hafpiPageQuran: Quran = Quran.hafsMadani1405;

  /**
   * Alias for hafsMadani1405 - the default page-based Quran.
   * Used in iOS as madpiPageQuran.
   */
  static readonly madpiPageQuran: Quran = Quran.hafsMadani1405;

  /**
   * Initialize the reading-to-quran mapping.
   * Call this once during app initialization.
   */
  static initialize(): void {
    setQuranForReading((reading: Reading) => {
      switch (reading) {
        case Reading.Hafs1405:
          return Quran.hafsMadani1405;
        case Reading.Hafs1440:
        case Reading.Hafs1421:
          return Quran.hafsMadani1440;
        case Reading.Tajweed:
          return Quran.hafsMadani1405;
      }
    });
  }

  get raw(): QuranReadingInfoRawData {
    return this._raw;
  }

  get arabicBesmAllah(): string {
    return this._raw.arabicBesmAllah;
  }

  /**
   * All 114 suras.
   */
  get suras(): ISura[] {
    if (!this._suras) {
      this._suras = [];
      for (let i = 1; i <= this._raw.startPageOfSura.length; i++) {
        this._suras.push(new Sura(this, i));
      }
    }
    return this._suras;
  }

  /**
   * All pages.
   */
  get pages(): IPage[] {
    if (!this._pages) {
      this._pages = [];
      for (let i = 1; i <= this._raw.startSuraOfPage.length; i++) {
        this._pages.push(new Page(this, i));
      }
    }
    return this._pages;
  }

  /**
   * All 30 juzs.
   */
  get juzs(): IJuz[] {
    if (!this._juzs) {
      const numberOfJuzs = this._raw.quarters.length / 8; // 8 quarters per juz
      this._juzs = [];
      for (let i = 1; i <= numberOfJuzs; i++) {
        this._juzs.push(new Juz(this, i));
      }
    }
    return this._juzs;
  }

  /**
   * All 60 hizbs.
   */
  get hizbs(): IHizb[] {
    if (!this._hizbs) {
      const numberOfHizbs = this._raw.quarters.length / 4; // 4 quarters per hizb
      this._hizbs = [];
      for (let i = 1; i <= numberOfHizbs; i++) {
        this._hizbs.push(new Hizb(this, i));
      }
    }
    return this._hizbs;
  }

  /**
   * All 240 quarters.
   */
  get quarters(): IQuarter[] {
    if (!this._quarters) {
      this._quarters = [];
      for (let i = 1; i <= this._raw.quarters.length; i++) {
        this._quarters.push(new Quarter(this, i));
      }
    }
    return this._quarters;
  }

  /**
   * All verses in the Quran.
   */
  get verses(): IAyahNumber[] {
    if (!this._verses) {
      this._verses = [];
      for (const sura of this.suras) {
        for (let ayah = 1; ayah <= sura.numberOfVerses; ayah++) {
          this._verses.push(new AyahNumber(sura, ayah));
        }
      }
    }
    return this._verses;
  }

  /**
   * First sura (Al-Fatiha).
   */
  get firstSura(): ISura {
    return this.suras[0];
  }

  /**
   * First verse of the Quran.
   */
  get firstVerse(): IAyahNumber {
    return this.verses[0];
  }

  /**
   * Last verse of the Quran.
   */
  get lastVerse(): IAyahNumber {
    return this.verses[this.verses.length - 1];
  }

  /**
   * Total number of pages.
   */
  get numberOfPages(): number {
    return this._raw.startSuraOfPage.length;
  }

  /**
   * Total number of verses.
   */
  get numberOfVerses(): number {
    return this.verses.length;
  }

  /**
   * Unique identifier for this Quran instance.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Equality check.
   */
  equals(other: IQuran): boolean {
    return this._id === (other as Quran)._id;
  }

  /**
   * Hash code for use in collections.
   */
  get hashCode(): number {
    let hash = 0;
    for (let i = 0; i < this._id.length; i++) {
      const char = this._id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Description for debugging.
   */
  get description(): string {
    return `<Quran ${this._id}>`;
  }
}

