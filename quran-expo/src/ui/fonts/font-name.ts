/**
 * FontName.swift → font-name.ts
 *
 * Custom font definitions for the Quran app.
 * 
 * Fonts:
 * - Kitab-Regular: Arabic tafseer text
 * - UthmanicHafs: Quran text in translation view
 * - surah_names (icomoon): Arabic sura name icons
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Font Name Enum
// ============================================================================

/**
 * Available custom fonts in the app.
 */
export enum FontName {
  /** Used in Arabic tafseer */
  Arabic = 'arabic',
  
  /** Used in Quran text in translation view */
  Quran = 'quran',
  
  /** Used in Arabic suras in Uthmanic font */
  SuraNames = 'suraNames',
}

// ============================================================================
// Font Details
// ============================================================================

/**
 * Details about a font including file name and font family name.
 */
export interface FontDetails {
  /** The PostScript name of the font */
  readonly name: string;
  /** The font family name */
  readonly family: string;
  /** The font file name */
  readonly fileName: string;
}

/**
 * Gets the details for a font.
 */
export function getFontDetails(font: FontName): FontDetails {
  switch (font) {
    case FontName.Arabic:
      return {
        name: 'Kitab-Regular',
        family: 'Kitab',
        fileName: 'Kitab-Regular.ttf',
      };
    case FontName.Quran:
      return {
        name: 'KFGQPCHAFSUthmanicScript-Bold',
        family: 'KFGQPC HAFS Uthmanic Script',
        fileName: 'UthmanicHafs1B Ver13.ttf',
      };
    case FontName.SuraNames:
      return {
        name: 'icomoon',
        family: 'icomoon',
        fileName: 'surah_names.ttf',
      };
  }
}

/**
 * All available fonts.
 */
export const allFonts: FontName[] = [
  FontName.Arabic,
  FontName.Quran,
  FontName.SuraNames,
];

// ============================================================================
// Font Family Names for StyleSheet
// ============================================================================

/**
 * Gets the font family name to use in React Native StyleSheet.
 * After loading fonts with expo-font, use these names.
 */
export function getFontFamily(font: FontName): string {
  return getFontDetails(font).family;
}

/**
 * Font families for use in StyleSheet.
 */
export const FontFamily = {
  /** Kitab font for Arabic tafseer */
  arabic: 'Kitab',
  
  /** Uthmanic Hafs font for Quran text */
  quran: 'KFGQPC HAFS Uthmanic Script',
  
  /** Icon font for sura names */
  suraNames: 'icomoon',
} as const;

