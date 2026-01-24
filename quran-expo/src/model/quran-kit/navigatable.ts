/**
 * Navigatable.swift → navigatable.ts
 *
 * Protocol for navigatable Quran elements (next/previous).
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Interface for types that can be navigated (have next/previous).
 */
export interface Navigatable<T> {
  readonly next: T | undefined;
  readonly previous: T | undefined;
}

/**
 * Creates an array of navigatable elements from start to end (inclusive).
 */
export function navigatableArray<T extends Navigatable<T>>(
  start: T,
  end: T,
  compareFn: (a: T, b: T) => number
): T[] {
  if (compareFn(end, start) < 0) {
    throw new Error('End element is less than start element.');
  }

  const values: T[] = [start];
  let pointer: T = start;

  while (pointer.next !== undefined && compareFn(pointer.next, end) <= 0) {
    pointer = pointer.next;
    values.push(pointer);
  }

  return values;
}

