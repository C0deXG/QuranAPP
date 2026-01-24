/**
 * Word.swift → word.ts
 *
 * Word model representing a word within a verse.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber, IWord } from './types';
import { compareWords } from './types';

/**
 * Represents a word within a verse.
 */
export class Word implements IWord {
  private readonly _verse: IAyahNumber;
  private readonly _wordNumber: number;

  constructor(verse: IAyahNumber, wordNumber: number) {
    this._verse = verse;
    this._wordNumber = wordNumber;
  }

  get verse(): IAyahNumber {
    return this._verse;
  }

  get wordNumber(): number {
    return this._wordNumber;
  }

  /**
   * Unique identifier.
   */
  get id(): string {
    return `${this._verse.sura.suraNumber}:${this._verse.ayah}:${this._wordNumber}`;
  }

  /**
   * Description for debugging.
   */
  get description(): string {
    return `<Word ${this._verse.sura.suraNumber}:${this._verse.ayah}:${this._wordNumber}>`;
  }

  /**
   * Equality check.
   */
  equals(other: IWord): boolean {
    return (
      this._verse.sura.suraNumber === other.verse.sura.suraNumber &&
      this._verse.ayah === other.verse.ayah &&
      this._wordNumber === other.wordNumber
    );
  }

  /**
   * Comparison for sorting.
   */
  compareTo(other: IWord): number {
    return compareWords(this, other);
  }

  /**
   * Check if this word is less than another.
   */
  lessThan(other: IWord): boolean {
    return this.compareTo(other) < 0;
  }

  /**
   * Check if this word is greater than another.
   */
  greaterThan(other: IWord): boolean {
    return this.compareTo(other) > 0;
  }

  /**
   * Hash code for use in collections.
   */
  get hashCode(): number {
    return this._verse.hashCode * 100 + this._wordNumber;
  }

  /**
   * Serializes to JSON-compatible object.
   */
  toJSON(): { verse: { sura: number; ayah: number }; word: number } {
    return {
      verse: this._verse.toJSON(),
      word: this._wordNumber,
    };
  }
}

