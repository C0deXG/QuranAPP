/**
 * QuranArabicText.swift → QuranArabicText.tsx
 *
 * Arabic Quran verse text display.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTheme } from '../../theme';
import { FontFamily, getQuranFontSize } from '../../fonts';
import { FontSize } from '../../../model/quran-text';
import type { AyahNumber } from '../../../model/quran-kit';
import { useReadableInsets } from './ContentDimension';
import { lFormat } from '../../../core/localization';

// ============================================================================
// QuranArabicText Component
// ============================================================================

export interface QuranArabicTextProps {
  /** The verse reference */
  verse: AyahNumber;
  /** The Arabic text */
  text: string;
  /** Font size preference */
  fontSize: FontSize;
}

/**
 * Arabic Quran verse text display with verse number badge.
 */
export function QuranArabicText({ verse, text, fontSize }: QuranArabicTextProps) {
  const theme = useTheme();
  const insets = useReadableInsets();
  const quranFontSize = getQuranFontSize(fontSize);
  
  const verseLabel = lFormat('translation.text.ayah-number', verse.sura.suraNumber, verse.ayah);
  
  return (
    <View
      style={[
        styles.container,
        {
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {/* Verse Number Badge */}
      <View style={[styles.badge, { backgroundColor: theme.themeColors.text + '15' }]}>
        <Text style={[styles.badgeText, { color: theme.themeColors.text + 'AA' }]}>
          {verseLabel}
        </Text>
      </View>
      
      {/* Arabic Text */}
      <Text
        style={[
          styles.arabicText,
          {
            color: theme.themeColors.text,
            fontFamily: FontFamily.quran,
            fontSize: quranFontSize,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
  },
  arabicText: {
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 42,
  },
});

