/**
 * PreferencesLastAyahFinder.swift → preferences-last-ayah-finder.ts
 *
 * Finds last ayah based on user preferences.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../../../model/quran-kit/types';
import type { LastAyahFinder } from '../../../model/quran-kit';
import {
  JuzBasedLastAyahFinder,
  SuraBasedLastAyahFinder,
  PageBasedLastAyahFinder,
} from '../../../model/quran-kit';
import { AudioEnd } from '../../../model/quran-audio';
import { AudioPreferences } from './audio-preferences';

// ============================================================================
// PreferencesLastAyahFinder
// ============================================================================

/**
 * Finds the last ayah based on user preferences.
 */
class PreferencesLastAyahFinderImpl implements LastAyahFinder {
  private static _instance: PreferencesLastAyahFinderImpl | null = null;

  static get shared(): PreferencesLastAyahFinderImpl {
    if (!PreferencesLastAyahFinderImpl._instance) {
      PreferencesLastAyahFinderImpl._instance = new PreferencesLastAyahFinderImpl();
    }
    return PreferencesLastAyahFinderImpl._instance;
  }

  private constructor() {}

  /**
   * Finds the last ayah starting from the given ayah.
   */
  findLastAyah(startAyah: IAyahNumber): IAyahNumber {
    const pageLastVerse = this.pageFinder.findLastAyah(startAyah);
    const lastVerse = this.finder.findLastAyah(startAyah);
    
    // Return the maximum of the two
    if (pageLastVerse.sura.suraNumber > lastVerse.sura.suraNumber) {
      return pageLastVerse;
    }
    if (pageLastVerse.sura.suraNumber < lastVerse.sura.suraNumber) {
      return lastVerse;
    }
    // Same sura, compare ayah
    return pageLastVerse.ayah > lastVerse.ayah ? pageLastVerse : lastVerse;
  }

  /**
   * Gets the appropriate finder based on preferences.
   */
  private get finder(): LastAyahFinder {
    const audioEnd = AudioPreferences.shared.audioEnd;
    
    switch (audioEnd) {
      case AudioEnd.juz:
        return new JuzBasedLastAyahFinder();
      case AudioEnd.sura:
        return new SuraBasedLastAyahFinder();
      case AudioEnd.page:
        return this.pageFinder;
      default:
        return new JuzBasedLastAyahFinder();
    }
  }

  /**
   * Page-based finder.
   */
  private get pageFinder(): LastAyahFinder {
    return new PageBasedLastAyahFinder();
  }
}

export const PreferencesLastAyahFinder = PreferencesLastAyahFinderImpl;

