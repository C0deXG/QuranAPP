/**
 * QuranPageFooter.swift → QuranPageFooter.tsx
 *
 * Footer for Quran pages showing page number.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useReadableInsets, INTER_SPACING } from './ContentDimension';

// ============================================================================
// QuranPageFooter Component
// ============================================================================

export interface QuranPageFooterProps {
  /** Page number text */
  page: string;
}

/**
 * Footer for Quran pages showing centered page number.
 */
export function QuranPageFooter({ page }: QuranPageFooterProps) {
  const theme = useTheme();
  const insets = useReadableInsets();
  
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: INTER_SPACING,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <Text style={[styles.pageNumber, { color: theme.themeColors.text }]}>
        {page}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 13,
  },
});

