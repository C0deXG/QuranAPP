/**
 * QuranTranslationReferenceVerse.swift → QuranTranslationReferenceVerse.tsx
 *
 * Reference to another verse in translation.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { FontSize } from '../../../model/quran-text';
import { calculateFontSize } from '../../fonts';
import type { AyahNumber } from '../../../model/quran-kit';
import { useReadableInsets } from './ContentDimension';
import { lFormat } from '../../../core/localization';

// ============================================================================
// QuranTranslationReferenceVerse Component
// ============================================================================

export interface QuranTranslationReferenceVerseProps {
  /** The verse being referenced */
  reference: AyahNumber;
  /** Font size preference */
  fontSize: FontSize;
  /** Text direction */
  isRTL?: boolean;
}

/**
 * Shows a "See verse X" reference link.
 */
export function QuranTranslationReferenceVerse({
  reference,
  fontSize,
  isRTL = false,
}: QuranTranslationReferenceVerseProps) {
  const theme = useTheme();
  const insets = useReadableInsets();
  const textSize = calculateFontSize(fontSize, 17);
  
  return (
    <Text
      style={[
        styles.text,
        {
          color: theme.themeColors.text,
          fontSize: textSize,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          textAlign: isRTL ? 'right' : 'left',
        },
      ]}
    >
      {lFormat('translation.text.see-referenced-verse', reference.ayah)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    paddingTop: 10,
  },
});

