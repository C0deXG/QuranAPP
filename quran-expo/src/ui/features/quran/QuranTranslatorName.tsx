/**
 * QuranTranslatorName.swift → QuranTranslatorName.tsx
 *
 * Translator attribution text.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { Text, StyleSheet, I18nManager } from 'react-native';
import { useTheme } from '../../theme';
import { FontSize } from '../../../model/quran-text';
import { calculateFontSize } from '../../fonts';
import { useReadableInsets } from './ContentDimension';

// ============================================================================
// QuranTranslatorName Component
// ============================================================================

export interface QuranTranslatorNameProps {
  /** Translator name */
  name: string;
  /** Font size preference */
  fontSize: FontSize;
  /** Text direction */
  isRTL?: boolean;
}

/**
 * Displays translator attribution.
 */
export function QuranTranslatorName({ name, fontSize, isRTL = false }: QuranTranslatorNameProps) {
  const theme = useTheme();
  const insets = useReadableInsets();
  const textSize = calculateFontSize(fontSize, 13);
  
  return (
    <Text
      style={[
        styles.text,
        {
          color: theme.themeColors.text + 'AA',
          fontSize: textSize,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          textAlign: isRTL ? 'right' : 'left',
        },
      ]}
    >
      - {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    paddingBottom: 10,
  },
});

