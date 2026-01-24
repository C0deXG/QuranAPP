/**
 * WordFrameScale.swift → word-frame-scale.ts
 *
 * Scale information for word frames.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { Size, Rect } from './geometry-types';
import { isSizeZero } from './geometry-types';

/**
 * Represents scaling information for word frames.
 */
export interface WordFrameScale {
  /** Scale factor */
  readonly scale: number;
  /** Scale factor X (alias for scale) */
  readonly scaleX?: number;
  /** Scale factor Y (alias for scale) */
  readonly scaleY?: number;
  /** X offset for centering */
  readonly xOffset: number;
  /** Y offset for centering */
  readonly yOffset: number;
}

/**
 * Creates a WordFrameScale.
 */
export function createWordFrameScale(
  scale: number,
  xOffset: number,
  yOffset: number
): WordFrameScale {
  return { scale, xOffset, yOffset };
}

/**
 * Zero scale (no scaling).
 */
export const WORD_FRAME_SCALE_ZERO: WordFrameScale = {
  scale: 0,
  xOffset: 0,
  yOffset: 0,
};

/**
 * Calculates scaling to fit an image into a view while maintaining aspect ratio.
 */
export function scalingImageIntoView(
  imageSize: Size,
  viewSize: Size
): WordFrameScale {
  // Return zero scaling if either size is zero
  if (isSizeZero(imageSize) || isSizeZero(viewSize)) {
    return WORD_FRAME_SCALE_ZERO;
  }

  // Calculate the scaling factor to fit the image within the view while maintaining aspect ratio
  let scale: number;
  const imageAspectRatio = imageSize.width / imageSize.height;
  const viewAspectRatio = viewSize.width / viewSize.height;

  if (imageAspectRatio < viewAspectRatio) {
    // Image is taller relative to the view, fit by height
    scale = viewSize.height / imageSize.height;
  } else {
    // Image is wider relative to the view, fit by width
    scale = viewSize.width / imageSize.width;
  }

  // Calculate offsets to center the image within the view
  const xOffset = (viewSize.width - scale * imageSize.width) / 2;
  const yOffset = (viewSize.height - scale * imageSize.height) / 2;

  return { scale, xOffset, yOffset };
}

/**
 * Scales a rect by a WordFrameScale.
 */
export function scaleRect(rect: Rect, scale: WordFrameScale): Rect {
  return {
    x: rect.x * scale.scale + scale.xOffset,
    y: rect.y * scale.scale + scale.yOffset,
    width: rect.width * scale.scale,
    height: rect.height * scale.scale,
  };
}

