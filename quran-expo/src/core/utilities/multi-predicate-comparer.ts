/**
 * MultiPredicateComparer.swift → multi-predicate-comparer.ts
 *
 * Multi-predicate comparison utilities translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-07-09.
 *
 * This allows sorting with multiple criteria, falling back to the next
 * predicate when elements are equal according to the current one.
 */

/**
 * A predicate function that compares two values.
 * Returns true if the first value should come before the second.
 */
export type ComparePredicate<T> = (lhs: T, rhs: T) => boolean;

/**
 * A comparer that uses multiple predicates for sorting.
 * If two elements are equal according to one predicate, it falls back
 * to the next predicate in the list.
 *
 * Equivalent to Swift's MultiPredicateComparer struct.
 *
 * @example
 * interface Person {
 *   name: string;
 *   age: number;
 * }
 *
 * const comparer = new MultiPredicateComparer<Person>([
 *   (a, b) => a.name < b.name,  // Sort by name first
 *   (a, b) => a.age < b.age,    // Then by age
 * ]);
 *
 * const people = [
 *   { name: 'Bob', age: 30 },
 *   { name: 'Alice', age: 25 },
 *   { name: 'Alice', age: 20 },
 * ];
 *
 * people.sort((a, b) => comparer.compare(a, b));
 * // Result: Alice(20), Alice(25), Bob(30)
 */
export class MultiPredicateComparer<T> {
  private predicates: ComparePredicate<T>[];

  /**
   * Creates a new multi-predicate comparer.
   *
   * @param increasingOrderPredicates - Array of predicates for ascending order
   */
  constructor(increasingOrderPredicates: ComparePredicate<T>[]) {
    this.predicates = increasingOrderPredicates;
  }

  /**
   * Checks if lhs should come before rhs in increasing order.
   *
   * @param lhs - Left-hand side value
   * @param rhs - Right-hand side value
   * @returns true if lhs should come before rhs
   */
  areInIncreasingOrder(lhs: T, rhs: T): boolean {
    for (const predicate of this.predicates) {
      const lhsBeforeRhs = predicate(lhs, rhs);
      const rhsBeforeLhs = predicate(rhs, lhs);

      // If they're different, we have a definitive answer
      if (lhsBeforeRhs !== rhsBeforeLhs) {
        return lhsBeforeRhs;
      }
      // Otherwise they're equal by this predicate, try the next one
    }

    // All predicates consider them equal, so lhs is not before rhs
    return false;
  }

  /**
   * Comparison function suitable for Array.sort().
   * Returns negative if lhs < rhs, positive if lhs > rhs, 0 if equal.
   *
   * @param lhs - Left-hand side value
   * @param rhs - Right-hand side value
   * @returns Comparison result (-1, 0, or 1)
   */
  compare(lhs: T, rhs: T): number {
    if (this.areInIncreasingOrder(lhs, rhs)) {
      return -1;
    }
    if (this.areInIncreasingOrder(rhs, lhs)) {
      return 1;
    }
    return 0;
  }

  /**
   * Creates a sort function for use with Array.sort().
   *
   * @returns A comparison function
   */
  toSortFunction(): (lhs: T, rhs: T) => number {
    return (lhs, rhs) => this.compare(lhs, rhs);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a predicate that compares by a key in ascending order.
 *
 * @param keyFn - Function to extract the comparable key
 * @returns A predicate function
 *
 * @example
 * const byName = ascending((person: Person) => person.name);
 */
export function ascending<T, K>(keyFn: (value: T) => K): ComparePredicate<T> {
  return (lhs, rhs) => keyFn(lhs) < keyFn(rhs);
}

/**
 * Creates a predicate that compares by a key in descending order.
 *
 * @param keyFn - Function to extract the comparable key
 * @returns A predicate function
 *
 * @example
 * const byAgeDesc = descending((person: Person) => person.age);
 */
export function descending<T, K>(keyFn: (value: T) => K): ComparePredicate<T> {
  return (lhs, rhs) => keyFn(lhs) > keyFn(rhs);
}

/**
 * Creates a comparer from key extractors (ascending order).
 *
 * @param keyFns - Array of functions to extract comparable keys
 * @returns A MultiPredicateComparer
 *
 * @example
 * const comparer = comparerFromKeys<Person>(
 *   (p) => p.lastName,
 *   (p) => p.firstName,
 *   (p) => p.age
 * );
 */
export function comparerFromKeys<T>(
  ...keyFns: Array<(value: T) => unknown>
): MultiPredicateComparer<T> {
  const predicates = keyFns.map((keyFn) => ascending(keyFn));
  return new MultiPredicateComparer(predicates);
}

/**
 * Sorts an array using multiple predicates.
 *
 * @param array - The array to sort (not modified)
 * @param predicates - Array of predicates for ascending order
 * @returns A new sorted array
 *
 * @example
 * const sorted = sortByPredicates(people, [
 *   (a, b) => a.name < b.name,
 *   (a, b) => a.age < b.age,
 * ]);
 */
export function sortByPredicates<T>(
  array: T[],
  predicates: ComparePredicate<T>[]
): T[] {
  const comparer = new MultiPredicateComparer(predicates);
  return [...array].sort(comparer.toSortFunction());
}

/**
 * Sorts an array using key extractors (ascending order).
 *
 * @param array - The array to sort (not modified)
 * @param keyFns - Functions to extract comparable keys
 * @returns A new sorted array
 *
 * @example
 * const sorted = sortByKeys(people,
 *   (p) => p.lastName,
 *   (p) => p.firstName
 * );
 */
export function sortByKeys<T>(
  array: T[],
  ...keyFns: Array<(value: T) => unknown>
): T[] {
  const comparer = comparerFromKeys(...keyFns);
  return [...array].sort(comparer.toSortFunction());
}

/**
 * Creates a standard comparison function from a predicate.
 * Useful when you need a (a, b) => number function.
 *
 * @param predicate - A "less than" predicate
 * @returns A comparison function returning -1, 0, or 1
 */
export function predicateToComparator<T>(
  predicate: ComparePredicate<T>
): (lhs: T, rhs: T) => number {
  return (lhs, rhs) => {
    if (predicate(lhs, rhs)) return -1;
    if (predicate(rhs, lhs)) return 1;
    return 0;
  };
}

