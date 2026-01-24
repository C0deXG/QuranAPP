/**
 * WordPointerListener from WordPointerViewModel.swift
 *
 * Listener protocol for word pointer events.
 *
 * Quran.com. All rights reserved.
 */

import type { Word } from '../../model/quran-kit';
import type { Point } from '../../model/quran-geometry';

// ============================================================================
// WordPointerListener
// ============================================================================

/**
 * Listener protocol for word pointer events.
 *
 * 1:1 translation of iOS WordPointerListener.
 */
export interface WordPointerListener {
  /**
   * Called when the user begins panning the word pointer.
   */
  onWordPointerPanBegan(): void;

  /**
   * Get the word at a given point on the screen.
   *
   * @param point The point in screen coordinates
   * @returns The word at that point, or null if none
   */
  word(at: Point): Word | null;

  /**
   * Highlight or unhighlight a word.
   *
   * @param word The word to highlight, or null to clear highlight
   */
  highlightWord(word: Word | null): void;
}

