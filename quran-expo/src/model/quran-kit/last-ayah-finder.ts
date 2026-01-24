/**
 * LastAyahFinder.swift → last-ayah-finder.ts
 * JuzBasedLastAyahFinder.swift
 * PageBasedLastAyahFinder.swift
 * SuraBasedLastAyahFinder.swift
 *
 * Utilities for finding the last ayah in different scopes.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from './types';

/**
 * Interface for finding the last ayah given a starting ayah.
 */
export interface LastAyahFinder {
  findLastAyah(startAyah: IAyahNumber): IAyahNumber;
}

/**
 * Finds the last ayah of the sura containing the start ayah.
 */
export class SuraBasedLastAyahFinder implements LastAyahFinder {
  findLastAyah(startAyah: IAyahNumber): IAyahNumber {
    return startAyah.sura.lastVerse;
  }
}

/**
 * Finds the last ayah of the page containing the start ayah.
 */
export class PageBasedLastAyahFinder implements LastAyahFinder {
  findLastAyah(startAyah: IAyahNumber): IAyahNumber {
    return startAyah.page.lastVerse;
  }
}

/**
 * Finds the last ayah of the juz containing the start ayah.
 */
export class JuzBasedLastAyahFinder implements LastAyahFinder {
  findLastAyah(startAyah: IAyahNumber): IAyahNumber {
    return startAyah.page.startJuz.lastVerse;
  }
}

/**
 * Creates a LastAyahFinder based on the scope type.
 */
export type LastAyahScope = 'sura' | 'page' | 'juz';

export function createLastAyahFinder(scope: LastAyahScope): LastAyahFinder {
  switch (scope) {
    case 'sura':
      return new SuraBasedLastAyahFinder();
    case 'page':
      return new PageBasedLastAyahFinder();
    case 'juz':
      return new JuzBasedLastAyahFinder();
  }
}

