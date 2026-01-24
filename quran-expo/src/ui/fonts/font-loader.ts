/**
 * Font loading utilities for Expo.
 *
 * This module handles loading custom fonts using expo-font.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as Font from 'expo-font';
import { FontFamily } from './font-name';

// ============================================================================
// Font Assets
// ============================================================================

/**
 * Font asset map for expo-font.
 * Maps font family names to their font files.
 */
export const fontAssets = {
  [FontFamily.arabic]: require('./assets/Kitab-Regular.ttf'),
  [FontFamily.quran]: require('./assets/UthmanicHafs1B Ver13.ttf'),
  [FontFamily.suraNames]: require('./assets/surah_names.ttf'),
};

// ============================================================================
// Font Loading
// ============================================================================

/**
 * Loads all custom fonts.
 * Call this during app initialization.
 */
export async function loadFonts(): Promise<void> {
  await Font.loadAsync(fontAssets);
}

/**
 * Checks if fonts are loaded.
 */
export function areFontsLoaded(): boolean {
  return (
    Font.isLoaded(FontFamily.arabic) &&
    Font.isLoaded(FontFamily.quran) &&
    Font.isLoaded(FontFamily.suraNames)
  );
}

