/**
 * QuranSuraName.swift → QuranSuraName.tsx
 *
 * Sura header with decorated name and Bismillah.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { FontFamily, getQuranFontSize } from '../../fonts';
import { FontSize } from '../../../model/quran-text';
import { NoorImage, getNoorImageSource } from '../../images';
import { useReadableInsets } from './ContentDimension';

// ============================================================================
// QuranSuraName Component
// ============================================================================

export interface QuranSuraNameProps {
  /** The sura name */
  suraName: string;
  /** The Bismillah text */
  besmAllah: string;
  /** Font size for Bismillah */
  besmAllahFontSize: FontSize;
}

/**
 * Sura header with decorated name frame and Bismillah text.
 */
export function QuranSuraName({ suraName, besmAllah, besmAllahFontSize }: QuranSuraNameProps) {
  const theme = useTheme();
  const insets = useReadableInsets();
  const bismillahFontSize = getQuranFontSize(besmAllahFontSize);
  
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
      {/* Sura Header Frame */}
      <View style={styles.headerFrame}>
        <Image
          source={getNoorImageSource(NoorImage.SuraHeader)}
          style={styles.headerImage}
          resizeMode="contain"
        />
        <View style={styles.suraNameOverlay}>
          <Text
            style={[styles.suraName, { color: theme.themeColors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {suraName}
          </Text>
        </View>
      </View>
      
      {/* Bismillah */}
      <Text
        style={[
          styles.bismillah,
          {
            color: theme.themeColors.text,
            fontFamily: FontFamily.quran,
            fontSize: bismillahFontSize,
          },
        ]}
      >
        {besmAllah}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 5,
    alignItems: 'center',
  },
  headerFrame: {
    width: '100%',
    height: 50,
    position: 'relative',
    marginBottom: 8,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  suraNameOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suraName: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  bismillah: {
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 42,
  },
});

