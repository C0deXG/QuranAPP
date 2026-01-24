/**
 * Translation+UI.swift → translation-ui.ts
 *
 * Translation UI extensions.
 *
 * Quran.com. All rights reserved.
 */

import type { Translation } from '../../model/quran-text';

// ============================================================================
// Translation UI Extensions
// ============================================================================

/**
 * Font style for translation text.
 */
export type TranslationTextFont = 'arabicTafseer' | 'body';

/**
 * Text direction for a language.
 */
export type CharacterDirection = 'ltr' | 'rtl';

/**
 * Get the text font for a translation.
 *
 * 1:1 translation of iOS Translation.textFont.
 */
export function getTranslationTextFont(translation: Translation): TranslationTextFont {
  return translation.languageCode === 'ar' ? 'arabicTafseer' : 'body';
}

/**
 * Get the character direction for a translation.
 *
 * 1:1 translation of iOS Translation.characterDirection.
 */
export function getTranslationCharacterDirection(translation: Translation): CharacterDirection {
  // RTL languages
  const rtlLanguages = ['ar', 'fa', 'ur', 'he', 'ps', 'ku', 'sd'];
  return rtlLanguages.includes(translation.languageCode) ? 'rtl' : 'ltr';
}

