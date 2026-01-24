/**
 * QuranVerseSeparator.swift → QuranVerseSeparator.tsx
 *
 * Visual separator between verses.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { INTER_SPACING } from './ContentDimension';

// ============================================================================
// QuranVerseSeparator Component
// ============================================================================

/**
 * A thin horizontal line to separate verses.
 */
export function QuranVerseSeparator() {
  const theme = useTheme();
  
  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: theme.themeColors.text + '20' },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    marginTop: INTER_SPACING,
  },
});

