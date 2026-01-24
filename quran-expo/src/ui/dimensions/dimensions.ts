/**
 * Dimensions.swift → dimensions.ts
 *
 * Layout dimension constants for the app.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Dimensions as RNDimensions, PixelRatio } from 'react-native';

// ============================================================================
// Layout Constants
// ============================================================================

/**
 * Standard corner radius for cards and containers.
 */
export const CORNER_RADIUS = 12;

/**
 * Standard padding values.
 */
export const Spacing = {
  /** Extra small spacing */
  xs: 4,
  /** Small spacing */
  sm: 8,
  /** Medium spacing */
  md: 16,
  /** Large spacing */
  lg: 24,
  /** Extra large spacing */
  xl: 32,
  /** Double extra large spacing */
  xxl: 48,
} as const;

/**
 * Standard border radius values.
 */
export const BorderRadius = {
  /** Small radius for buttons */
  sm: 4,
  /** Medium radius for cards */
  md: 8,
  /** Standard radius for containers */
  lg: 12,
  /** Extra large for pills/rounded elements */
  xl: 16,
  /** Full rounding for circles */
  full: 9999,
} as const;

// ============================================================================
// Screen Dimensions
// ============================================================================

/**
 * Gets the screen dimensions.
 */
export function getScreenDimensions() {
  const { width, height } = RNDimensions.get('window');
  return { width, height };
}

/**
 * Gets the screen width.
 */
export function getScreenWidth(): number {
  return RNDimensions.get('window').width;
}

/**
 * Gets the screen height.
 */
export function getScreenHeight(): number {
  return RNDimensions.get('window').height;
}

/**
 * Checks if the device is in landscape orientation.
 */
export function isLandscape(): boolean {
  const { width, height } = RNDimensions.get('window');
  return width > height;
}

/**
 * Gets the pixel ratio for the device.
 */
export function getPixelRatio(): number {
  return PixelRatio.get();
}

/**
 * Converts points to pixels.
 */
export function pointsToPixels(points: number): number {
  return PixelRatio.getPixelSizeForLayoutSize(points);
}

/**
 * Rounds to the nearest pixel.
 */
export function roundToNearestPixel(points: number): number {
  return PixelRatio.roundToNearestPixel(points);
}

// ============================================================================
// Content Dimension
// ============================================================================

/**
 * Represents a content dimension that can be sized or filling.
 */
export type ContentDimension = 
  | { type: 'sized'; value: number }
  | { type: 'fill' };

/**
 * Creates a sized content dimension.
 */
export function sized(value: number): ContentDimension {
  return { type: 'sized', value };
}

/**
 * Creates a fill content dimension.
 */
export function fill(): ContentDimension {
  return { type: 'fill' };
}

/**
 * Gets the style value for a content dimension.
 */
export function getContentDimensionStyle(dimension: ContentDimension): number | '100%' {
  if (dimension.type === 'fill') {
    return '100%';
  }
  return dimension.value;
}

