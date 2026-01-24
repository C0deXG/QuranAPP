/**
 * ThemeService.swift → theme-style.ts
 *
 * Theme style and appearance mode definitions.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { ThemeColors, type ColorScheme } from './colors';

// ============================================================================
// Appearance Mode
// ============================================================================

/**
 * The appearance mode (light/dark/auto).
 */
export enum AppearanceMode {
  Light = 0,
  Dark = 1,
  Auto = 2,
}

/**
 * Gets the display name for an appearance mode.
 */
export function getAppearanceModeName(mode: AppearanceMode): string {
  switch (mode) {
    case AppearanceMode.Light:
      return 'light';
    case AppearanceMode.Dark:
      return 'dark';
    case AppearanceMode.Auto:
      return 'auto';
  }
}

// ============================================================================
// Theme Style
// ============================================================================

/**
 * The theme style for Quran reading.
 */
export enum ThemeStyle {
  Calm = 0,
  Focus = 1,
  Original = 2,
  Paper = 3,
  Quiet = 4,
}

/**
 * All available theme styles in display order.
 */
export const allThemeStyles: ThemeStyle[] = [
  ThemeStyle.Paper,
  ThemeStyle.Original,
  ThemeStyle.Quiet,
  ThemeStyle.Calm,
  ThemeStyle.Focus,
];

/**
 * Gets the display name for a theme style.
 */
export function getThemeStyleName(style: ThemeStyle): string {
  switch (style) {
    case ThemeStyle.Calm:
      return 'Calm';
    case ThemeStyle.Focus:
      return 'Focus';
    case ThemeStyle.Original:
      return 'Original';
    case ThemeStyle.Paper:
      return 'Paper';
    case ThemeStyle.Quiet:
      return 'Quiet';
  }
}

// ============================================================================
// Theme Colors Resolution
// ============================================================================

/**
 * Theme colors for background and text.
 */
export interface ThemeColorsSet {
  readonly background: string;
  readonly text: string;
  /** Alias for background */
  readonly backgroundColor: string;
  /** Alias for text */
  readonly textColor: string;
}

/**
 * Gets the theme colors for a given style and color scheme.
 */
export function getThemeColors(style: ThemeStyle, scheme: ColorScheme): ThemeColorsSet {
  const themeKey = getThemeKey(style);
  const colors = ThemeColors[themeKey][scheme];
  return {
    background: colors.background,
    text: colors.text,
    backgroundColor: colors.background,
    textColor: colors.text,
  };
}

/**
 * Maps ThemeStyle enum to ThemeColors key.
 */
function getThemeKey(style: ThemeStyle): keyof typeof ThemeColors {
  switch (style) {
    case ThemeStyle.Calm:
      return 'calm';
    case ThemeStyle.Focus:
      return 'focus';
    case ThemeStyle.Original:
      return 'original';
    case ThemeStyle.Paper:
      return 'paper';
    case ThemeStyle.Quiet:
      return 'quiet';
  }
}

/**
 * Determines the effective color scheme based on theme style and appearance mode.
 * The "Quiet" theme always uses dark mode.
 */
export function getEffectiveColorScheme(
  themeStyle: ThemeStyle,
  appearanceMode: AppearanceMode,
  systemColorScheme: ColorScheme
): ColorScheme {
  // Quiet theme is always dark
  if (themeStyle === ThemeStyle.Quiet) {
    return 'dark';
  }
  
  // Otherwise, use the appearance mode
  switch (appearanceMode) {
    case AppearanceMode.Light:
      return 'light';
    case AppearanceMode.Dark:
      return 'dark';
    case AppearanceMode.Auto:
      return systemColorScheme;
  }
}

