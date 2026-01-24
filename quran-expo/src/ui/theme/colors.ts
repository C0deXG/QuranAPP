/**
 * Color+extension.swift → colors.ts
 *
 * Theme colors for the Quran app.
 * Colors are defined for both light and dark modes.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Converts RGB components (0-1) to hex color string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts hex color components (0x00-0xFF) to hex string.
 */
function hexComponentsToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ============================================================================
// App Identity Colors
// ============================================================================

/**
 * App tint color (brand color).
 * Light: #1B6B71, Dark: #2BA9B2
 */
export const AppColors = {
  light: {
    /** App identity/tint color */
    appIdentity: hexComponentsToHex(0x1B, 0x6B, 0x71), // #1B6B71
    /** Page marker tint */
    pageMarkerTint: '#004D40',
  },
  dark: {
    /** App identity/tint color */
    appIdentity: hexComponentsToHex(0x2B, 0xA9, 0xB2), // #2BA9B2
    /** Page marker tint */
    pageMarkerTint: '#039F85',
  },
} as const;

// ============================================================================
// Theme Colors
// ============================================================================

/**
 * Theme style colors for Quran reading.
 * Each theme has background and text colors for both light and dark modes.
 */
export const ThemeColors = {
  /** Paper theme - neutral warm tones */
  paper: {
    light: {
      background: rgbToHex(0.933, 0.929, 0.929), // #EDEDED
      text: rgbToHex(0.114, 0.102, 0.102), // #1D1A1A
    },
    dark: {
      background: rgbToHex(0.110, 0.110, 0.118), // #1C1C1E
      text: rgbToHex(0.949, 0.949, 0.941), // #F2F2F0
    },
  },
  
  /** Calm theme - warm sepia tones */
  calm: {
    light: {
      background: rgbToHex(0.933, 0.886, 0.800), // #EEE2CC
      text: rgbToHex(0.196, 0.157, 0.118), // #32281E
    },
    dark: {
      background: rgbToHex(0.255, 0.231, 0.192), // #413B31
      text: rgbToHex(0.969, 0.925, 0.867), // #F7ECDD
    },
  },
  
  /** Focus theme - soft blue/white tones */
  focus: {
    light: {
      background: rgbToHex(0.996, 0.988, 0.961), // #FEFCF5
      text: rgbToHex(0.078, 0.071, 0.008), // #141202
    },
    dark: {
      background: rgbToHex(0.094, 0.086, 0.051), // #18160D
      text: rgbToHex(0.996, 0.976, 0.925), // #FEF9EC
    },
  },
  
  /** Original theme - pure black/white */
  original: {
    light: {
      background: rgbToHex(1.0, 1.0, 1.0), // #FFFFFF
      text: rgbToHex(0.0, 0.0, 0.0), // #000000
    },
    dark: {
      background: rgbToHex(0.0, 0.0, 0.0), // #000000
      text: rgbToHex(1.0, 1.0, 1.0), // #FFFFFF
    },
  },
  
  /** Quiet theme - dark gray (always dark mode) */
  quiet: {
    light: {
      background: rgbToHex(0.290, 0.290, 0.302), // #4A4A4D
      text: rgbToHex(0.922, 0.922, 0.957), // #EBEBF4
    },
    dark: {
      background: rgbToHex(0.0, 0.0, 0.0), // #000000
      text: rgbToHex(0.553, 0.553, 0.573), // #8D8D92
    },
  },
} as const;

// ============================================================================
// Note Highlight Colors
// ============================================================================

/**
 * Colors for note highlights.
 * These match the NoteColor enum in the model.
 */
export const NoteHighlightColors = {
  yellow: '#FFEB3B',
  green: '#4CAF50',
  blue: '#2196F3',
  pink: '#E91E63',
} as const;

// ============================================================================
// System Colors (semantic)
// ============================================================================

/**
 * System colors for UI elements.
 */
export const SystemColors = {
  light: {
    /** App tint color */
    tint: AppColors.light.appIdentity,
    /** Primary label color */
    label: '#000000',
    /** Secondary label color */
    secondaryLabel: '#3C3C4399',
    /** Tertiary label color */
    tertiaryLabel: '#3C3C434D',
    /** Quaternary label color */
    quaternaryLabel: '#3C3C432E',
    /** Placeholder text color */
    placeholderText: '#3C3C4399',
    /** System background */
    systemBackground: '#FFFFFF',
    /** Secondary system background */
    secondarySystemBackground: '#F2F2F7',
    /** Tertiary system background */
    tertiarySystemBackground: '#FFFFFF',
    /** Grouped background */
    systemGroupedBackground: '#F2F2F7',
    /** Secondary grouped background */
    secondarySystemGroupedBackground: '#FFFFFF',
    /** Separator */
    separator: '#3C3C434A',
    /** Opaque separator */
    opaqueSeparator: '#C6C6C8',
    /** Link color */
    link: '#007AFF',
    /** System red */
    systemRed: '#FF3B30',
    /** System green */
    systemGreen: '#34C759',
    /** System blue */
    systemBlue: '#007AFF',
    /** System gray 3 */
    systemGray3: '#C7C7CC',
    /** System gray 5 */
    systemGray5: '#E5E5EA',
    /** Destructive action color (same as systemRed) */
    destructive: '#FF3B30',
    /** Page separator background */
    pageSeparatorBackground: '#F2F2F7',
    /** Page separator line */
    pageSeparatorLine: '#C6C6C8',
    /** System fill */
    systemFill: '#78788033',
  },
  dark: {
    /** App tint color */
    tint: AppColors.dark.appIdentity,
    /** Primary label color */
    label: '#FFFFFF',
    /** Secondary label color */
    secondaryLabel: '#EBEBF599',
    /** Tertiary label color */
    tertiaryLabel: '#EBEBF54D',
    /** Quaternary label color */
    quaternaryLabel: '#EBEBF52E',
    /** Placeholder text color */
    placeholderText: '#EBEBF54D',
    /** System background */
    systemBackground: '#000000',
    /** Secondary system background */
    secondarySystemBackground: '#1C1C1E',
    /** Tertiary system background */
    tertiarySystemBackground: '#2C2C2E',
    /** Grouped background */
    systemGroupedBackground: '#000000',
    /** Secondary grouped background */
    secondarySystemGroupedBackground: '#1C1C1E',
    /** Separator */
    separator: '#54545899',
    /** Opaque separator */
    opaqueSeparator: '#38383A',
    /** Link color */
    link: '#0A84FF',
    /** System red */
    systemRed: '#FF453A',
    /** System green */
    systemGreen: '#30D158',
    /** System blue */
    systemBlue: '#0A84FF',
    /** System gray 3 */
    systemGray3: '#48484A',
    /** System gray 5 */
    systemGray5: '#2C2C2E',
    /** Destructive action color (same as systemRed) */
    destructive: '#FF453A',
    /** Page separator background */
    pageSeparatorBackground: '#1C1C1E',
    /** Page separator line */
    pageSeparatorLine: '#38383A',
    /** System fill */
    systemFill: '#78788033',
  },
} as const;

// ============================================================================
// Color Type
// ============================================================================

export type ColorScheme = 'light' | 'dark';

/**
 * Gets the app identity color for the given color scheme.
 */
export function getAppIdentityColor(scheme: ColorScheme): string {
  return scheme === 'dark' ? AppColors.dark.appIdentity : AppColors.light.appIdentity;
}

/**
 * Gets the page marker tint color for the given color scheme.
 */
export function getPageMarkerTintColor(scheme: ColorScheme): string {
  return scheme === 'dark' ? AppColors.dark.pageMarkerTint : AppColors.light.pageMarkerTint;
}

