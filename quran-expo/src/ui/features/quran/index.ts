/**
 * Features/Quran - Quran-specific UI components
 *
 * Translated from quran-ios/UI/NoorUI/Features/Quran
 *
 * This module provides:
 * - Page header/footer
 * - Arabic text display
 * - Sura name header
 * - Translation text chunks
 * - Verse separators
 * - Themed image display
 */

// Content Dimensions
export {
  INTER_SPACING,
  INTER_PAGE_SPACING,
  CONTENT_DIMENSION,
  getReadableInsets,
  useReadableInsets,
  type ContentInsets,
} from './ContentDimension';

// Page Layout
export { QuranPageHeader, type QuranPageHeaderProps } from './QuranPageHeader';
export { QuranPageFooter, type QuranPageFooterProps } from './QuranPageFooter';

// Arabic Text
export { QuranArabicText, type QuranArabicTextProps } from './QuranArabicText';
export { QuranSuraName, type QuranSuraNameProps } from './QuranSuraName';

// Translation
export {
  QuranTranslationTextChunk,
  type QuranTranslationTextChunkProps,
  type TextRange,
} from './QuranTranslationTextChunk';
export { QuranTranslatorName, type QuranTranslatorNameProps } from './QuranTranslatorName';
export {
  QuranTranslationReferenceVerse,
  type QuranTranslationReferenceVerseProps,
} from './QuranTranslationReferenceVerse';

// Visual Elements
export { QuranVerseSeparator } from './QuranVerseSeparator';
export { QuranThemedImage, type QuranThemedImageProps } from './QuranThemedImage';

