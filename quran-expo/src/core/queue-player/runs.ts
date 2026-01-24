/**
 * Runs.swift → runs.ts
 *
 * Repeat count enum translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 2018-04-04.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2018 Quran.com
 */

/**
 * Represents how many times to repeat playback.
 * Equivalent to Swift's Runs enum.
 */
export enum Runs {
  One = 'one',
  Two = 'two',
  Three = 'three',
  Four = 'four',
  Indefinite = 'indefinite',
}

/**
 * Gets the maximum number of runs for a Runs value.
 *
 * @param runs - The runs value
 * @returns Maximum number of repetitions
 */
export function getMaxRuns(runs: Runs): number {
  switch (runs) {
    case Runs.One:
      return 1;
    case Runs.Two:
      return 2;
    case Runs.Three:
      return 3;
    case Runs.Four:
      return 4;
    case Runs.Indefinite:
      return Number.MAX_SAFE_INTEGER;
  }
}

/**
 * Creates a Runs value from a number.
 *
 * @param count - Number of runs (1-4, or 0 for indefinite)
 * @returns The Runs enum value
 */
export function runsFromCount(count: number): Runs {
  switch (count) {
    case 1:
      return Runs.One;
    case 2:
      return Runs.Two;
    case 3:
      return Runs.Three;
    case 4:
      return Runs.Four;
    default:
      return Runs.Indefinite;
  }
}

/**
 * All available runs options.
 */
export const allRuns: Runs[] = [
  Runs.One,
  Runs.Two,
  Runs.Three,
  Runs.Four,
  Runs.Indefinite,
];

// Lowercase aliases for compatibility
export const RunsAliases = {
  one: Runs.One,
  two: Runs.Two,
  three: Runs.Three,
  four: Runs.Four,
  indefinite: Runs.Indefinite,
} as const;

// Extend Runs namespace with lowercase values
export namespace Runs {
  export const one = Runs.One;
  export const two = Runs.Two;
  export const three = Runs.Three;
  export const four = Runs.Four;
  export const indefinite = Runs.Indefinite;
}

