/**
 * Sequence+Extension.swift → sequence.ts
 *
 * Sequence/Array utility functions translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2/19/17.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Creates a flat dictionary from an array, using a key extractor.
 * If multiple elements have the same key, the last one wins.
 *
 * @param array - The array to process
 * @param keyFn - Function to extract the key from each element
 * @returns A Map with keys pointing to elements
 *
 * @example
 * const items = [{ id: 'a', value: 1 }, { id: 'b', value: 2 }];
 * flatGroup(items, item => item.id);
 * // Map { 'a' => { id: 'a', value: 1 }, 'b' => { id: 'b', value: 2 } }
 */
export function flatGroup<T, K>(
  array: T[],
  keyFn: (element: T) => K
): Map<K, T> {
  const categories = new Map<K, T>();
  for (const element of array) {
    const key = keyFn(element);
    categories.set(key, element);
  }
  return categories;
}

/**
 * Creates a flat object from an array, using a key extractor.
 * If multiple elements have the same key, the last one wins.
 *
 * @param array - The array to process
 * @param keyFn - Function to extract the string key from each element
 * @returns An object with keys pointing to elements
 */
export function flatGroupToObject<T>(
  array: T[],
  keyFn: (element: T) => string
): Record<string, T> {
  const categories: Record<string, T> = {};
  for (const element of array) {
    const key = keyFn(element);
    categories[key] = element;
  }
  return categories;
}

/**
 * Returns unique elements while preserving order.
 * Uses a Set to track seen elements for O(1) lookup.
 *
 * @param array - The array to deduplicate
 * @returns A new array with only unique elements, in original order
 *
 * @example
 * orderedUnique([1, 2, 1, 3, 2]) // [1, 2, 3]
 */
export function orderedUnique<T>(array: T[]): T[] {
  const buffer: T[] = [];
  const added = new Set<T>();

  for (const elem of array) {
    if (!added.has(elem)) {
      buffer.push(elem);
      added.add(elem);
    }
  }

  return buffer;
}

/**
 * Maps an array asynchronously, processing elements sequentially.
 * This is equivalent to Swift's async map.
 *
 * @param array - The array to map
 * @param transform - Async function to transform each element
 * @returns Promise resolving to the transformed array
 *
 * @example
 * await asyncMap([1, 2, 3], async (n) => n * 2) // [2, 4, 6]
 */
export async function asyncMap<T, U>(
  array: T[],
  transform: (element: T) => Promise<U>
): Promise<U[]> {
  const values: U[] = [];
  for (const element of array) {
    values.push(await transform(element));
  }
  return values;
}

/**
 * Filters an array asynchronously, processing elements sequentially.
 * This is equivalent to Swift's async filter.
 *
 * @param array - The array to filter
 * @param predicate - Async function that returns true to include element
 * @returns Promise resolving to the filtered array
 *
 * @example
 * await asyncFilter([1, 2, 3], async (n) => n > 1) // [2, 3]
 */
export async function asyncFilter<T>(
  array: T[],
  predicate: (element: T) => Promise<boolean>
): Promise<T[]> {
  const filtered: T[] = [];
  for (const element of array) {
    if (await predicate(element)) {
      filtered.push(element);
    }
  }
  return filtered;
}

/**
 * Maps an array asynchronously, processing all elements in parallel.
 * Use this when order of execution doesn't matter.
 *
 * @param array - The array to map
 * @param transform - Async function to transform each element
 * @returns Promise resolving to the transformed array
 */
export async function asyncMapParallel<T, U>(
  array: T[],
  transform: (element: T) => Promise<U>
): Promise<U[]> {
  return Promise.all(array.map(transform));
}

/**
 * Filters an array asynchronously, processing all elements in parallel.
 * Use this when order of execution doesn't matter.
 *
 * @param array - The array to filter
 * @param predicate - Async function that returns true to include element
 * @returns Promise resolving to the filtered array
 */
export async function asyncFilterParallel<T>(
  array: T[],
  predicate: (element: T) => Promise<boolean>
): Promise<T[]> {
  const results = await Promise.all(
    array.map(async (element) => ({
      element,
      include: await predicate(element),
    }))
  );
  return results.filter((r) => r.include).map((r) => r.element);
}

