/**
 * WordPointerViewModel.swift → word-pointer-view-model.ts
 *
 * View model for the word pointer feature.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { Word } from '../../model/quran-kit';
import type { Point } from '../../model/quran-geometry';
import type { WordTextService } from '../../domain/word-text-service';
import type { WordPointerListener } from './word-pointer-listener';

// ============================================================================
// PanResult
// ============================================================================

/**
 * Result of a pan gesture.
 *
 * 1:1 translation of iOS WordPointerViewModel.PanResult.
 */
export type PanResult =
  | { type: 'none' }
  | { type: 'hidePopover' }
  | { type: 'showPopover'; text: string };

// ============================================================================
// WordPointerViewModel
// ============================================================================

/**
 * View model for the word pointer feature.
 *
 * 1:1 translation of iOS WordPointerViewModel.
 */
export class WordPointerViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Listener for word pointer events */
  listener: WordPointerListener | null = null;

  private readonly service: WordTextService;
  private selectedWord: Word | null = null;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(service: WordTextService) {
    this.service = service;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Called when the user begins panning.
   */
  viewPanBegan(): void {
    this.listener?.onWordPointerPanBegan();
  }

  /**
   * Called when the user pans to a new point.
   *
   * @param point The point in screen coordinates
   * @returns The result of the pan
   */
  async viewPanned(to: Point): Promise<PanResult> {
    const word = this.listener?.word(to) ?? null;

    if (!word) {
      logger.debug(`No word found at position ${JSON.stringify(to)}`);
      this.unhighlightWord();
      return { type: 'hidePopover' };
    }

    logger.debug(`Highlighting word ${word.wordNumber} at position: ${JSON.stringify(to)}`);
    this.listener?.highlightWord(word);

    // Check if same word is already selected
    if (this.selectedWord && this.isSameWord(this.selectedWord, word)) {
      logger.debug('Same word selected before');
      return { type: 'none' };
    }

    try {
      const text = await this.service.textForWord(word);

      if (text) {
        logger.debug(`Found text '${text}' for word ${word.wordNumber}`);
        this.selectedWord = word;
        return { type: 'showPopover', text };
      } else {
        logger.debug(`No text found for word ${word.wordNumber}`);
        return { type: 'hidePopover' };
      }
    } catch (error) {
      crasher.recordError(error as Error, 'Error calling WordTextService');
      return { type: 'hidePopover' };
    }
  }

  /**
   * Unhighlight the current word.
   */
  unhighlightWord(): void {
    this.listener?.highlightWord(null);
    this.selectedWord = null;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Check if two words are the same.
   */
  private isSameWord(a: Word, b: Word): boolean {
    return (
      a.verse.sura.suraNumber === b.verse.sura.suraNumber &&
      a.verse.ayah === b.verse.ayah &&
      a.wordNumber === b.wordNumber
    );
  }
}

