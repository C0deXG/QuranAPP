/**
 * Dimensions - Layout constants and utilities
 *
 * Translated from quran-ios/UI/NoorUI/Miscellaneous/Dimensions.swift
 *
 * This module provides:
 * - Layout spacing constants
 * - Border radius values
 * - Screen dimension utilities
 * - Content dimension types
 */

// Re-export react-native Dimensions
import { Dimensions } from 'react-native';
export { Dimensions };

export {
  CORNER_RADIUS,
  Spacing,
  BorderRadius,
  getScreenDimensions,
  getScreenWidth,
  getScreenHeight,
  isLandscape,
  getPixelRatio,
  pointsToPixels,
  roundToNearestPixel,
  sized,
  fill,
  getContentDimensionStyle,
  type ContentDimension,
} from './dimensions';

