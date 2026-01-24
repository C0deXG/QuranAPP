/**
 * NoorFont - Custom font definitions and loading
 *
 * Translated from quran-ios/UI/NoorFont
 *
 * This module provides:
 * - Custom font definitions (Quran, Arabic, SuraNames)
 * - Font loading for Expo
 * - Font size utilities and scaling
 */

// Font Name
export {
  FontName,
  FontFamily,
  getFontDetails,
  getFontFamily,
  allFonts,
  type FontDetails,
} from './font-name';

// Font Loader
export {
  loadFonts,
  areFontsLoaded,
  fontAssets,
} from './font-loader';

// Font Size
export {
  ARABIC_QURAN_TEXT_FONT_SIZE,
  ARABIC_TAFSEER_TEXT_FONT_SIZE,
  getFontSizeFactor,
  calculateFontSize,
  getQuranFontSize,
  getArabicTafseerFontSize,
} from './font-size';

