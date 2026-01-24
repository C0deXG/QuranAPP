/**
 * SuraHeaderLocation.swift → sura-header-location.ts
 *
 * Location and size of a sura header on a page.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { ISura } from '../quran-kit/types';
import type { Rect } from './geometry-types';
import { createRect } from './geometry-types';

/**
 * Represents the location and size of a sura header on a page.
 */
export interface SuraHeaderLocation {
  /** The sura */
  readonly sura: ISura;
  /** X coordinate (left edge) */
  readonly x: number;
  /** Y coordinate (center) */
  readonly y: number;
  /** Width */
  readonly width: number;
  /** Height */
  readonly height: number;
}

/**
 * Creates a SuraHeaderLocation.
 */
export function createSuraHeaderLocation(params: {
  sura: ISura;
  x: number;
  y: number;
  width: number;
  height: number;
}): SuraHeaderLocation {
  return {
    sura: params.sura,
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
  };
}

/**
 * Gets the rect for a sura header location.
 * Note: y is the center, so we offset by half the height.
 */
export function suraHeaderLocationRect(location: SuraHeaderLocation): Rect {
  return createRect(
    location.x,
    location.y - location.height / 2,
    location.width,
    location.height
  );
}

/**
 * Checks if two sura header locations are equal.
 */
export function suraHeaderLocationsEqual(
  a: SuraHeaderLocation,
  b: SuraHeaderLocation
): boolean {
  return (
    a.sura.suraNumber === b.sura.suraNumber &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

/**
 * Gets a hash code for a sura header location.
 */
export function suraHeaderLocationHashCode(
  location: SuraHeaderLocation
): number {
  return (
    location.sura.suraNumber * 10000000 +
    location.x * 100000 +
    location.y * 1000 +
    location.width * 10 +
    location.height
  );
}

