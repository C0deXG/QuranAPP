/**
 * ImagePage.swift → image-page.ts
 *
 * Represents a page image with word frames.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../quran-kit/types';
import type { WordFrameCollection } from './word-frame-collection';
import { wordFrameCollectionsEqual } from './word-frame-collection';

/**
 * Represents image information with dimensions.
 */
export interface ImageInfo {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Represents a page image with associated word frame data.
 *
 * In React Native, the image is represented as a URI string
 * rather than a UIImage object.
 */
export interface ImagePage {
  /** Image URI (can be a local file path or remote URL) */
  readonly imageUri: string;
  /** Image info with dimensions (optional, for layout) */
  readonly image?: ImageInfo;
  /** Collection of word frames for this page */
  readonly wordFrames: WordFrameCollection;
  /** First ayah on this page */
  readonly startAyah: IAyahNumber;
}

/**
 * Creates an ImagePage.
 */
export function createImagePage(params: {
  imageUri: string;
  image?: ImageInfo;
  wordFrames: WordFrameCollection;
  startAyah: IAyahNumber;
}): ImagePage {
  return {
    imageUri: params.imageUri,
    image: params.image ?? {
      uri: params.imageUri,
      width: 1024, // Default dimensions
      height: 1792,
    },
    wordFrames: params.wordFrames,
    startAyah: params.startAyah,
  };
}

/**
 * Checks if two image pages are equal.
 */
export function imagePagesEqual(a: ImagePage, b: ImagePage): boolean {
  return (
    a.imageUri === b.imageUri &&
    a.startAyah.sura.suraNumber === b.startAyah.sura.suraNumber &&
    a.startAyah.ayah === b.startAyah.ayah &&
    wordFrameCollectionsEqual(a.wordFrames, b.wordFrames)
  );
}

