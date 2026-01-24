/**
 * Array+Extension.swift → array.ts
 *
 * Array utility functions translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-04-29.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Removes consecutive duplicate elements from an array.
 * Only removes duplicates that are next to each other.
 *
 * @example
 * removingNeighboringDuplicates([1, 1, 2, 2, 1]) // returns [1, 2, 1]
 */
export function removingNeighboringDuplicates<T>(array: T[]): T[] {
  const uniqueList: T[] = [];
  for (const value of array) {
    if (uniqueList.length === 0 || value !== uniqueList[uniqueList.length - 1]) {
      uniqueList.push(value);
    }
  }
  return uniqueList;
}

/**
 * Sorts an array based on the order of elements in another array.
 * Uses a key extractor to determine the sorting key.
 *
 * @param array - The array to sort
 * @param orderArray - The array that defines the desired order
 * @param keyExtractor - Function to extract the key from each element
 *
 * @example
 * const items = [{ id: 'b', name: 'B' }, { id: 'a', name: 'A' }];
 * const order = ['a', 'b'];
 * sortedAs(items, order, item => item.id);
 * // returns [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
 */
export function sortedAs<T, K>(
  array: T[],
  orderArray: K[],
  keyExtractor: (element: T) => K
): T[] {
  const indices = new Map<K, number>();
  orderArray.forEach((element, index) => {
    indices.set(element, index);
  });

  return [...array].sort((lhs, rhs) => {
    const lhsIndex = indices.get(keyExtractor(lhs)) ?? Number.MAX_SAFE_INTEGER;
    const rhsIndex = indices.get(keyExtractor(rhs)) ?? Number.MAX_SAFE_INTEGER;
    return lhsIndex - rhsIndex;
  });
}

/**
 * Binary search to find the first element that matches a predicate.
 * The array must be sorted such that all elements matching the predicate
 * come before all elements that don't match.
 *
 * @param array - The sorted array to search
 * @param predicate - Function that returns true for matching elements
 * @returns The first matching element, or undefined if not found
 */
export function binarySearchFirst<T>(
  array: T[],
  predicate: (element: T) => boolean
): T | undefined {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (predicate(array[mid])) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low < array.length && predicate(array[low]) ? array[low] : undefined;
}

