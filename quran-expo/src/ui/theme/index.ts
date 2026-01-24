/**
 * NoorUI/Theme - Theming system
 *
 * Translated from quran-ios/UI/NoorUI/Theme and Colors
 *
 * This module provides:
 * - Color definitions (theme colors, system colors)
 * - Theme styles (Paper, Original, Quiet, Calm, Focus)
 * - Appearance modes (Light, Dark, Auto)
 * - Theme service for managing preferences
 * - React hooks for consuming theme
 */

// Colors
export {
  AppColors,
  ThemeColors,
  NoteHighlightColors,
  SystemColors,
  getAppIdentityColor,
  getPageMarkerTintColor,
  type ColorScheme,
} from './colors';

// Theme Style
export {
  AppearanceMode,
  ThemeStyle,
  allThemeStyles,
  getAppearanceModeName,
  getThemeStyleName,
  getThemeColors,
  getEffectiveColorScheme,
  type ThemeColorsSet,
} from './theme-style';

// Theme Service
export {
  ThemeService,
  ThemeProvider,
  useTheme,
  useQuranTheme,
  useThemeActions,
  type Theme,
} from './theme-service';

