/**
 * Pair.swift → pair.ts
 *
 * Pair type utility translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2024-02-02.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * A simple pair/tuple type with named properties.
 * Equivalent to Swift's Pair struct.
 */
export interface Pair<First, Second> {
  first: First;
  second: Second;
}

/**
 * Creates a new Pair.
 *
 * @param first - The first value
 * @param second - The second value
 * @returns A Pair object
 *
 * @example
 * const pair = createPair('hello', 42);
 * console.log(pair.first);  // 'hello'
 * console.log(pair.second); // 42
 */
export function createPair<First, Second>(
  first: First,
  second: Second
): Pair<First, Second> {
  return { first, second };
}

/**
 * Type alias for a readonly pair
 */
export type ReadonlyPair<First, Second> = Readonly<Pair<First, Second>>;

/**
 * Creates an immutable pair.
 *
 * @param first - The first value
 * @param second - The second value
 * @returns A frozen Pair object
 */
export function createReadonlyPair<First, Second>(
  first: First,
  second: Second
): ReadonlyPair<First, Second> {
  return Object.freeze({ first, second });
}

/**
 * Checks if two pairs are equal.
 * Uses strict equality (===) for comparison.
 *
 * @param a - First pair
 * @param b - Second pair
 * @returns true if both pairs have equal first and second values
 */
export function pairsEqual<First, Second>(
  a: Pair<First, Second>,
  b: Pair<First, Second>
): boolean {
  return a.first === b.first && a.second === b.second;
}

/**
 * Checks if two pairs are equal using a custom equality function.
 *
 * @param a - First pair
 * @param b - Second pair
 * @param firstEquals - Equality function for first values
 * @param secondEquals - Equality function for second values
 * @returns true if both pairs are equal according to the provided functions
 */
export function pairsEqualWith<First, Second>(
  a: Pair<First, Second>,
  b: Pair<First, Second>,
  firstEquals: (a: First, b: First) => boolean,
  secondEquals: (a: Second, b: Second) => boolean
): boolean {
  return firstEquals(a.first, b.first) && secondEquals(a.second, b.second);
}

/**
 * Maps both values of a pair.
 *
 * @param pair - The pair to map
 * @param firstMapper - Function to transform the first value
 * @param secondMapper - Function to transform the second value
 * @returns A new pair with transformed values
 */
export function mapPair<First, Second, NewFirst, NewSecond>(
  pair: Pair<First, Second>,
  firstMapper: (first: First) => NewFirst,
  secondMapper: (second: Second) => NewSecond
): Pair<NewFirst, NewSecond> {
  return {
    first: firstMapper(pair.first),
    second: secondMapper(pair.second),
  };
}

/**
 * Swaps the first and second values of a pair.
 *
 * @param pair - The pair to swap
 * @returns A new pair with swapped values
 */
export function swapPair<First, Second>(
  pair: Pair<First, Second>
): Pair<Second, First> {
  return { first: pair.second, second: pair.first };
}

/**
 * Converts a pair to a tuple array.
 *
 * @param pair - The pair to convert
 * @returns A tuple [first, second]
 */
export function pairToTuple<First, Second>(
  pair: Pair<First, Second>
): [First, Second] {
  return [pair.first, pair.second];
}

/**
 * Creates a pair from a tuple array.
 *
 * @param tuple - The tuple [first, second]
 * @returns A Pair object
 */
export function tupleTopair<First, Second>(
  tuple: [First, Second]
): Pair<First, Second> {
  return { first: tuple[0], second: tuple[1] };
}

