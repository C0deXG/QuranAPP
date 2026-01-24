/**
 * MoreMenuViewModel.swift (MoreMenuListener) → more-menu-listener.ts
 *
 * Listener interface for more menu events.
 *
 * Quran.com. All rights reserved.
 */

// ============================================================================
// MoreMenuListener
// ============================================================================

/**
 * Listener for more menu events.
 *
 * 1:1 translation of iOS MoreMenuListener.
 */
export interface MoreMenuListener {
  /**
   * Called when translations selection is tapped.
   */
  onTranslationsSelectionsTapped(): void;

  /**
   * Called when word pointer active state is updated.
   */
  onIsWordPointerActiveUpdated(isWordPointerActive: boolean): void;
}

