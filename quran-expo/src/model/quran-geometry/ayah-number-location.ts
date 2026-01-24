/**
 * AyahNumberLocation.swift → ayah-number-location.ts
 *
 * Location of an ayah number marker on a page.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../quran-kit/types';
import type { Point } from './geometry-types';
import { createPoint } from './geometry-types';

/**
 * Represents the location of an ayah number marker on a page.
 */
export interface AyahNumberLocation {
  /** The ayah */
  readonly ayah: IAyahNumber;
  /** X coordinate */
  readonly x: number;
  /** Y coordinate */
  readonly y: number;
}

/**
 * Creates an AyahNumberLocation.
 */
export function createAyahNumberLocation(
  ayah: IAyahNumber,
  x: number,
  y: number
): AyahNumberLocation {
  return { ayah, x, y };
}

/**
 * Gets the center point of an ayah number location.
 */
export function ayahNumberLocationCenter(
  location: AyahNumberLocation
): Point {
  return createPoint(location.x, location.y);
}

/**
 * Checks if two ayah number locations are equal.
 */
export function ayahNumberLocationsEqual(
  a: AyahNumberLocation,
  b: AyahNumberLocation
): boolean {
  return (
    a.ayah.sura.suraNumber === b.ayah.sura.suraNumber &&
    a.ayah.ayah === b.ayah.ayah &&
    a.x === b.x &&
    a.y === b.y
  );
}

/**
 * Gets a hash code for an ayah number location.
 */
export function ayahNumberLocationHashCode(
  location: AyahNumberLocation
): number {
  return (
    location.ayah.sura.suraNumber * 1000000 +
    location.ayah.ayah * 10000 +
    location.x * 100 +
    location.y
  );
}

