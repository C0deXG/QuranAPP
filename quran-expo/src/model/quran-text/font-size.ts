/**
 * FontSize.swift → font-size.ts
 *
 * Font size options for text display.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Font size options from accessibility sizes to extra small.
 * Raw values indicate the "step" from the base size.
 */
export enum FontSize {
  Accessibility5 = -6,
  Accessibility4 = -5,
  Accessibility3 = -4,
  Accessibility2 = -3,
  Accessibility1 = -2,
  XXXLarge = -1,
  XXLarge = 0,
  XLarge = 1,
  Large = 2,
  Medium = 3,
  Small = 4,
  XSmall = 5,
}

/**
 * All font sizes in order from largest to smallest.
 */
export const ALL_FONT_SIZES: readonly FontSize[] = [
  FontSize.Accessibility5,
  FontSize.Accessibility4,
  FontSize.Accessibility3,
  FontSize.Accessibility2,
  FontSize.Accessibility1,
  FontSize.XXXLarge,
  FontSize.XXLarge,
  FontSize.XLarge,
  FontSize.Large,
  FontSize.Medium,
  FontSize.Small,
  FontSize.XSmall,
];

/**
 * Gets a description for a font size.
 */
export function fontSizeDescription(size: FontSize): string {
  switch (size) {
    case FontSize.Accessibility5:
      return 'accessibility5';
    case FontSize.Accessibility4:
      return 'accessibility4';
    case FontSize.Accessibility3:
      return 'accessibility3';
    case FontSize.Accessibility2:
      return 'accessibility2';
    case FontSize.Accessibility1:
      return 'accessibility1';
    case FontSize.XXXLarge:
      return 'xxxLarge';
    case FontSize.XXLarge:
      return 'xxLarge';
    case FontSize.XLarge:
      return 'xLarge';
    case FontSize.Large:
      return 'large';
    case FontSize.Medium:
      return 'medium';
    case FontSize.Small:
      return 'small';
    case FontSize.XSmall:
      return 'xSmall';
  }
}

/**
 * Gets the scale factor for a font size.
 * Base size (XXLarge) = 1.0
 */
export function fontSizeScale(size: FontSize): number {
  // Each step is roughly 0.1 change in scale
  const baseScale = 1.0;
  const stepSize = 0.1;
  return baseScale - size * stepSize;
}

/**
 * Gets the next larger font size, or undefined if already at max.
 */
export function fontSizeLarger(size: FontSize): FontSize | undefined {
  const index = ALL_FONT_SIZES.indexOf(size);
  if (index > 0) {
    return ALL_FONT_SIZES[index - 1];
  }
  return undefined;
}

/**
 * Gets the next smaller font size, or undefined if already at min.
 */
export function fontSizeSmaller(size: FontSize): FontSize | undefined {
  const index = ALL_FONT_SIZES.indexOf(size);
  if (index < ALL_FONT_SIZES.length - 1) {
    return ALL_FONT_SIZES[index + 1];
  }
  return undefined;
}

/**
 * Calculates the distance between two font sizes.
 */
export function fontSizeDistance(from: FontSize, to: FontSize): number {
  return to - from;
}

/**
 * Advances a font size by n steps (positive = smaller, negative = larger).
 */
export function fontSizeAdvanced(size: FontSize, by: number): FontSize | undefined {
  const newValue = size + by;
  const found = ALL_FONT_SIZES.find((s) => s === newValue);
  return found;
}

/**
 * Checks if a font size is an accessibility size.
 */
export function isAccessibilitySize(size: FontSize): boolean {
  return size < FontSize.XXXLarge;
}

/**
 * Gets the default font size.
 */
export const DEFAULT_FONT_SIZE = FontSize.XXLarge;

// Lowercase aliases for compatibility
export namespace FontSize {
  export const large = FontSize.Large;
  export const medium = FontSize.Medium;
  export const small = FontSize.Small;
  export const xSmall = FontSize.XSmall;
  export const xLarge = FontSize.XLarge;
  export const xxLarge = FontSize.XXLarge;
  export const xxxLarge = FontSize.XXXLarge;
}

