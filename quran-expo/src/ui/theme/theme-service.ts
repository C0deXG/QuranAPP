/**
 * ThemeService.swift → theme-service.ts
 *
 * Theme service for managing app appearance.
 *
 * Quran.com. All rights reserved.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { PreferenceKey, Preferences } from '../../core/preferences';
import type { PreferenceTransformer } from '../../core/preferences';
import { AppearanceMode, ThemeStyle, getEffectiveColorScheme, getThemeColors } from './theme-style';
import type { ThemeColorsSet } from './theme-style';
import { AppColors, SystemColors, type ColorScheme } from './colors';

// ============================================================================
// Preference Keys
// ============================================================================

const appearanceModeRawKey = new PreferenceKey<number | null>('theme', null);

const appearanceModeTransformer: PreferenceTransformer<number | null, AppearanceMode> = {
  rawToValue: (raw: number | null): AppearanceMode => {
    if (raw === null) return AppearanceMode.Auto;
    return raw as AppearanceMode;
  },
  valueToRaw: (value: AppearanceMode): number => value,
};

const themeStyleRawKey = new PreferenceKey<number | null>('themeStyle', null);

const themeStyleTransformer: PreferenceTransformer<number | null, ThemeStyle> = {
  rawToValue: (raw: number | null): ThemeStyle => {
    if (raw === null) return ThemeStyle.Paper;
    return raw as ThemeStyle;
  },
  valueToRaw: (value: ThemeStyle): number => value,
};

// ============================================================================
// Theme Service
// ============================================================================

/**
 * Theme service singleton for managing app appearance.
 */
class ThemeServiceImpl {
  private static _instance: ThemeServiceImpl | null = null;

  static get shared(): ThemeServiceImpl {
    if (!ThemeServiceImpl._instance) {
      ThemeServiceImpl._instance = new ThemeServiceImpl();
    }
    return ThemeServiceImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the current appearance mode.
   */
  get appearanceMode(): AppearanceMode {
    const raw = Preferences.shared.getValueSync(appearanceModeRawKey);
    return appearanceModeTransformer.rawToValue(raw);
  }

  /**
   * Sets the appearance mode.
   */
  set appearanceMode(value: AppearanceMode) {
    const raw = appearanceModeTransformer.valueToRaw(value);
    Preferences.shared.setValue(raw, appearanceModeRawKey);
  }

  /**
   * Gets the current theme style.
   */
  get themeStyle(): ThemeStyle {
    const raw = Preferences.shared.getValueSync(themeStyleRawKey);
    return themeStyleTransformer.rawToValue(raw);
  }

  /**
   * Sets the theme style.
   */
  set themeStyle(value: ThemeStyle) {
    const raw = themeStyleTransformer.valueToRaw(value);
    Preferences.shared.setValue(raw, themeStyleRawKey);
  }
}

export const ThemeService = ThemeServiceImpl;

// ============================================================================
// Theme Interface
// ============================================================================

/**
 * Full theme object returned by useTheme.
 */
export interface Theme {
  /** Current color scheme (light/dark) */
  readonly colorScheme: ColorScheme;
  /** Current theme style */
  readonly themeStyle: ThemeStyle;
  /** Current appearance mode */
  readonly appearanceMode: AppearanceMode;
  /** Theme colors for Quran reading */
  readonly themeColors: ThemeColorsSet;
  /** App identity color */
  readonly appIdentity: string;
  /** Page marker tint color */
  readonly pageMarkerTint: string;
  /** System colors */
  readonly colors: typeof SystemColors.light | typeof SystemColors.dark;
  /** Whether we're in dark mode */
  readonly isDark: boolean;
}

// ============================================================================
// Theme Context
// ============================================================================

const ThemeContext = createContext<Theme | null>(null);

/**
 * Theme provider component.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const systemColorScheme = useRNColorScheme() ?? 'light';
  
  // Use state to track theme values so the UI re-renders when they change
  const [themeStyle, setThemeStyle] = React.useState(() => ThemeService.shared.themeStyle);
  const [appearanceMode, setAppearanceMode] = React.useState(() => ThemeService.shared.appearanceMode);
  
  // Subscribe to preference changes
  React.useEffect(() => {
    const unsubscribe = Preferences.shared.addListener((key) => {
      if (key === 'theme') {
        setAppearanceMode(ThemeService.shared.appearanceMode);
      } else if (key === 'themeStyle') {
        setThemeStyle(ThemeService.shared.themeStyle);
      }
    });
    return () => { unsubscribe(); };
  }, []);
  
  // Calculate effective color scheme
  const colorScheme = getEffectiveColorScheme(
    themeStyle,
    appearanceMode,
    systemColorScheme as ColorScheme
  );
  
  const isDark = colorScheme === 'dark';
  
  const theme: Theme = useMemo(() => ({
    colorScheme,
    themeStyle,
    appearanceMode,
    themeColors: getThemeColors(themeStyle, colorScheme),
    appIdentity: isDark ? AppColors.dark.appIdentity : AppColors.light.appIdentity,
    pageMarkerTint: isDark ? AppColors.dark.pageMarkerTint : AppColors.light.pageMarkerTint,
    colors: isDark ? SystemColors.dark : SystemColors.light,
    isDark,
  }), [colorScheme, themeStyle, appearanceMode, isDark]);
  
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

// ============================================================================
// Theme Hook
// ============================================================================

/**
 * Hook to get the current theme.
 */
export function useTheme(): Theme {
  const contextTheme = useContext(ThemeContext);
  const systemColorScheme = useRNColorScheme() ?? 'light';
  
  // If we have context, use it
  if (contextTheme) {
    return contextTheme;
  }
  
  // Fallback to calculating theme directly
  const themeStyle = ThemeService.shared.themeStyle;
  const appearanceMode = ThemeService.shared.appearanceMode;
  
  const colorScheme = getEffectiveColorScheme(
    themeStyle,
    appearanceMode,
    systemColorScheme as ColorScheme
  );
  
  const isDark = colorScheme === 'dark';
  
  return useMemo(() => ({
    colorScheme,
    themeStyle,
    appearanceMode,
    themeColors: getThemeColors(themeStyle, colorScheme),
    appIdentity: isDark ? AppColors.dark.appIdentity : AppColors.light.appIdentity,
    pageMarkerTint: isDark ? AppColors.dark.pageMarkerTint : AppColors.light.pageMarkerTint,
    colors: isDark ? SystemColors.dark : SystemColors.light,
    isDark,
  }), [colorScheme, themeStyle, appearanceMode, isDark]);
}

/**
 * Hook to get Quran reading theme colors.
 */
export function useQuranTheme(): ThemeColorsSet & { colorScheme: ColorScheme } {
  const systemColorScheme = useRNColorScheme() ?? 'light';
  const themeStyle = ThemeService.shared.themeStyle;
  const appearanceMode = ThemeService.shared.appearanceMode;
  
  const colorScheme = getEffectiveColorScheme(
    themeStyle,
    appearanceMode,
    systemColorScheme as ColorScheme
  );
  
  return useMemo(() => ({
    ...getThemeColors(themeStyle, colorScheme),
    colorScheme,
  }), [themeStyle, colorScheme]);
}

/**
 * Hook to set theme preferences.
 */
export function useThemeActions() {
  const setAppearanceMode = React.useCallback((mode: AppearanceMode) => {
    ThemeService.shared.appearanceMode = mode;
  }, []);
  
  const setThemeStyle = React.useCallback((style: ThemeStyle) => {
    ThemeService.shared.themeStyle = style;
  }, []);
  
  return useMemo(() => ({
    setAppearanceMode,
    setThemeStyle,
  }), [setAppearanceMode, setThemeStyle]);
}
