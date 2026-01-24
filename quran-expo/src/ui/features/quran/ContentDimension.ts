/**
 * ContentDimension.swift → ContentDimension.ts
 *
 * Spacing and insets for Quran content layout.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// Constants
// ============================================================================

/**
 * Base spacing value.
 */
const SPACING = 8;

/**
 * Spacing between content elements.
 */
export const INTER_SPACING = SPACING;

/**
 * Spacing between pages.
 */
export const INTER_PAGE_SPACING = 12;

// ============================================================================
// Insets Calculation
// ============================================================================

/**
 * Content insets for Quran pages.
 */
export interface ContentInsets {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/**
 * Calculates readable insets based on safe area.
 */
export function getReadableInsets(safeAreaInsets: EdgeInsets): ContentInsets {
  return {
    top: Math.max(24, safeAreaInsets.top) + SPACING,
    left: safeAreaInsets.left + SPACING,
    bottom: safeAreaInsets.bottom + SPACING,
    right: safeAreaInsets.right + SPACING,
  };
}

/**
 * Hook to get readable insets.
 */
export function useReadableInsets(): ContentInsets {
  const safeAreaInsets = useSafeAreaInsets();
  return getReadableInsets(safeAreaInsets);
}

/**
 * Content dimension configuration object.
 */
export const CONTENT_DIMENSION = {
  spacing: SPACING,
  interSpacing: INTER_SPACING,
  interPageSpacing: INTER_PAGE_SPACING,
};

