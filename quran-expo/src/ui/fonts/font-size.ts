/**
 * FontSize++.swift → font-size.ts
 *
 * Font size utilities and scaling based on user preferences.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { FontSize } from '../../model/quran-text';

// ============================================================================
// Font Size Constants
// ============================================================================

/** Default Arabic Quran text font size */
export const ARABIC_QURAN_TEXT_FONT_SIZE = 21;

/** Default Arabic tafseer text font size */
export const ARABIC_TAFSEER_TEXT_FONT_SIZE = 21;

// ============================================================================
// Font Size Scaling
// ============================================================================

/**
 * Gets the scaling factor for a font size relative to the large size.
 */
export function getFontSizeFactor(size: FontSize): number {
  switch (size) {
    case FontSize.XSmall:
      return 0.7 * 0.7 * 0.7; // ~0.343
    case FontSize.Small:
      return 0.7 * 0.7; // 0.49
    case FontSize.Medium:
      return 0.7;
    case FontSize.Large:
      return 1;
    case FontSize.XLarge:
      return 1 / 0.8; // 1.25
    case FontSize.XXLarge:
      return 1 / 0.8 / 0.8; // ~1.5625
    case FontSize.XXXLarge:
      return 1 / 0.8 / 0.8 / 0.8; // ~1.953
    case FontSize.Accessibility1:
      return 1 / 0.8 / 0.8 / 0.8 / 0.8; // ~2.44
    case FontSize.Accessibility2:
      return 1 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8; // ~3.05
    case FontSize.Accessibility3:
      return 1 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8; // ~3.81
    case FontSize.Accessibility4:
      return 1 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8; // ~4.77
    case FontSize.Accessibility5:
      return 1 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8 / 0.8; // ~5.96
    default:
      return 1;
  }
}

/**
 * Calculates font size based on the user preference.
 * @param size The user's font size preference
 * @param mediumSize The base size when FontSize is Large
 * @returns The calculated font size
 */
export function calculateFontSize(size: FontSize, mediumSize: number): number {
  return mediumSize * getFontSizeFactor(size);
}

/**
 * Gets the Quran text font size based on user preference.
 */
export function getQuranFontSize(size?: FontSize): number {
  if (!size) {
    return ARABIC_QURAN_TEXT_FONT_SIZE;
  }
  return calculateFontSize(size, ARABIC_QURAN_TEXT_FONT_SIZE);
}

/**
 * Gets the Arabic tafseer font size.
 */
export function getArabicTafseerFontSize(): number {
  return ARABIC_TAFSEER_TEXT_FONT_SIZE;
}

