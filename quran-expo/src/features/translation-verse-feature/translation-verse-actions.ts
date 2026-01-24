/**
 * TranslationVerseActions from TranslationVerseViewModel.swift
 *
 * Actions that can be performed from the translation verse view.
 *
 * Quran.com. All rights reserved.
 */

import type { AyahNumber } from '../../model/quran-kit';

// ============================================================================
// TranslationVerseActions
// ============================================================================

/**
 * Actions that can be performed from the translation verse view.
 *
 * 1:1 translation of iOS TranslationVerseActions.
 */
export interface TranslationVerseActions {
  /**
   * Called when the current verse changes.
   * Used to update highlights in the parent view.
   */
  updateCurrentVerseTo: (verse: AyahNumber) => void;
}

