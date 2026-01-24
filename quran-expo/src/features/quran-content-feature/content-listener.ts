/**
 * ContentViewModel.swift (ContentListener) → content-listener.ts
 *
 * Listener interface for content events.
 *
 * Quran.com. All rights reserved.
 */

import type { AyahNumber } from '../../model/quran-kit';
import type { Point } from '../../model/quran-geometry';

// ============================================================================
// ContentListener
// ============================================================================

/**
 * Listener for content view events.
 *
 * 1:1 translation of iOS ContentListener.
 */
export interface ContentListener {
  /**
   * Called when the user will begin dragging to scroll.
   */
  userWillBeginDragScroll(): void;

  /**
   * Called to present the ayah menu.
   *
   * @param point The point where the menu should appear
   * @param verses The selected verses
   */
  presentAyahMenu(point: Point, verses: AyahNumber[]): void;
}

