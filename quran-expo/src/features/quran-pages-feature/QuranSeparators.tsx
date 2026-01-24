/**
 * QuranPageSeparators.swift → QuranSeparators.tsx
 *
 * Page separator components.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, StyleSheet, I18nManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../ui/theme';
import { CONTENT_DIMENSION } from '../../ui/features/quran';

// ============================================================================
// Constants
// ============================================================================

/** Width of the middle separator */
export const QURAN_SEPARATORS_MIDDLE_WIDTH = CONTENT_DIMENSION.interPageSpacing;

/** Width of the side separator */
export const QURAN_SEPARATORS_SIDE_WIDTH = 10;

// ============================================================================
// PageSideSeparator Component
// ============================================================================

export interface PageSideSeparatorProps {
  leading: boolean;
}

/**
 * Side separator for Quran pages.
 *
 * 1:1 translation of iOS QuranSeparators.PageSideSeparator.
 */
export function PageSideSeparator({ leading }: PageSideSeparatorProps) {
  const theme = useTheme();
  const width = QURAN_SEPARATORS_SIDE_WIDTH;
  const lines = 5;
  const lineWidth = 0.5;

  // Get theme colors
  const gradientStart = theme.colors.pageSeparatorBackground;
  const gradientEnd = theme.colors.systemBackground;
  const lineColor = theme.colors.pageSeparatorLine;

  // Gradient direction based on leading/trailing
  // In RTL, leading is right side, trailing is left side
  const isRTL = I18nManager.isRTL;
  const actualLeading = isRTL ? !leading : leading;

  const gradientColors = actualLeading
    ? [gradientStart, gradientEnd]
    : [gradientEnd, gradientStart];

  // Create line positions
  const linePositions: number[] = [];
  for (let i = 0; i < lines; i++) {
    const step = width / (lines - 1);
    const distance = i * step;
    linePositions.push(distance);
  }

  return (
    <View style={[styles.sideSeparator, { width }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      {linePositions.map((offset, index) => (
        <View
          key={index}
          style={[
            styles.separatorLine,
            {
              left: offset - lineWidth / 2,
              width: lineWidth,
              backgroundColor: lineColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ============================================================================
// PageMiddleSeparator Component
// ============================================================================

/**
 * Middle separator between two Quran pages.
 *
 * 1:1 translation of iOS QuranSeparators.PageMiddleSeparator.
 */
export function PageMiddleSeparator() {
  const theme = useTheme();
  const width = QURAN_SEPARATORS_MIDDLE_WIDTH / 2;
  const lineWidth = 0.7;
  const lineColor = theme.colors.pageSeparatorLine;

  return (
    <View style={[styles.middleSeparator, { width: QURAN_SEPARATORS_MIDDLE_WIDTH }]}>
      {/* Center line */}
      <View
        style={[
          styles.middleLine,
          {
            width: lineWidth,
            backgroundColor: lineColor,
          },
        ]}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sideSeparator: {
    height: '100%',
    position: 'relative',
  },
  separatorLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  middleSeparator: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleLine: {
    height: '100%',
  },
});

