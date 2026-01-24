/**
 * Util.swift → util.ts
 *
 * Binary search utilities for Quran data structures.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Binary search utilities for arrays.
 */

/**
 * Finds such index N that predicate is true for all elements up to
 * but not including the index N, and is false for all elements
 * starting with index N.
 * Behavior is undefined if there is no such N.
 */
export function binarySearchIndex<T>(
  array: readonly T[],
  predicate: (element: T) => boolean
): number {
  let low = 0;
  let high = array.length;

  while (low !== high) {
    const mid = low + Math.floor((high - low) / 2);
    if (predicate(array[mid])) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

/**
 * Finds the first element where the predicate becomes false.
 * Returns the element just before that transition point.
 */
export function binarySearchFirst<T>(
  array: readonly T[],
  predicate: (element: T) => boolean
): T {
  const index = binarySearchIndex(array, predicate);
  const previousIndex = index - 1;
  return array[previousIndex];
}

