/**
 * QuranPageHeader.swift → QuranPageHeader.tsx
 *
 * Header for Quran pages showing quarter name and sura names.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useReadableInsets, INTER_SPACING } from './ContentDimension';

// ============================================================================
// QuranPageHeader Component
// ============================================================================

export interface QuranPageHeaderProps {
  /** Quarter name (e.g., "الحزب الأول") */
  quarterName: string;
  /** Sura name(s) on this page */
  suraNames: string;
}

/**
 * Header for Quran pages.
 * Shows quarter name on left, sura names on right.
 */
export function QuranPageHeader({ quarterName, suraNames }: QuranPageHeaderProps) {
  const theme = useTheme();
  const insets = useReadableInsets();
  
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: INTER_SPACING,
        },
      ]}
    >
      <Text style={[styles.quarterName, { color: theme.themeColors.text }]}>
        {quarterName}
      </Text>
      <Text style={[styles.suraNames, { color: theme.themeColors.text }]}>
        {suraNames}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quarterName: {
    fontSize: 13,
  },
  suraNames: {
    fontSize: 13,
    textAlign: 'right',
  },
});

