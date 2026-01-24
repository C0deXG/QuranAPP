/**
 * QuranGeometry - Geometry models for Quran page layout
 *
 * Translated from quran-ios/Model/QuranGeometry
 *
 * This module provides:
 * - Word frame positioning for touch targets
 * - Page image handling
 * - Ayah number and sura header locations
 * - Scaling utilities
 */

// Geometry types
export type { Point, Size, Rect } from './geometry-types';
export {
  createPoint,
  createSize,
  createRect,
  createRectFromMinMax,
  POINT_ZERO,
  SIZE_ZERO,
  RECT_ZERO,
  isSizeZero,
  rectMinX,
  rectMaxX,
  rectMinY,
  rectMaxY,
  rectCenter,
  rectContainsPoint,
  rectsEqual,
} from './geometry-types';

// Word frame scale
export type { WordFrameScale } from './word-frame-scale';
export {
  createWordFrameScale,
  WORD_FRAME_SCALE_ZERO,
  scalingImageIntoView,
  scaleRect,
} from './word-frame-scale';

// Word frame
export type { WordFrame } from './word-frame';
export {
  createWordFrame,
  wordFrameRect,
  wordFramesEqual,
  wordFrameHashCode,
  wordFrameToJSON,
} from './word-frame';

// Word frame line
export type { WordFrameLine } from './word-frame-line';
export {
  createWordFrameLine,
  wordFrameLinesEqual,
  wordFrameLineHashCode,
} from './word-frame-line';

// Word frame collection
export type { WordFrameCollection } from './word-frame-collection';
export {
  createWordFrameCollection,
  wordFramesForVerse,
  lineFramesForVerse,
  wordFrameForWord,
  wordAtLocation,
  topPaddingAtLine,
  allWordFrames,
  wordFrameCollectionsEqual,
} from './word-frame-collection';

// Ayah number location
export type { AyahNumberLocation } from './ayah-number-location';
export {
  createAyahNumberLocation,
  ayahNumberLocationCenter,
  ayahNumberLocationsEqual,
  ayahNumberLocationHashCode,
} from './ayah-number-location';

// Sura header location
export type { SuraHeaderLocation } from './sura-header-location';
export {
  createSuraHeaderLocation,
  suraHeaderLocationRect,
  suraHeaderLocationsEqual,
  suraHeaderLocationHashCode,
} from './sura-header-location';

// Image page
export type { ImagePage, ImageInfo } from './image-page';
export {
  createImagePage,
  imagePagesEqual,
} from './image-page';

