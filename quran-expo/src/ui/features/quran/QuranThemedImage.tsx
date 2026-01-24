/**
 * QuranThemedImage.swift → QuranThemedImage.tsx
 *
 * Themed Quran page image that adjusts to current theme colors.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

// ============================================================================
// QuranThemedImage Component
// ============================================================================

export interface QuranThemedImageProps {
  /** Image source (URI or require) */
  source: ImageSourcePropType;
  /** Optional width */
  width?: number | string;
  /** Optional height */
  height?: number | string;
}

/**
 * Displays a Quran page image with theme-appropriate styling.
 *
 * Note: In iOS, this component applies a false color filter to tint
 * the image based on theme colors. In React Native, we rely on
 * tintColor for simple tinting, or would need native modules for
 * more complex image processing.
 */
export function QuranThemedImage({ source, width, height }: QuranThemedImageProps) {
  const theme = useTheme();
  const isDark = theme.isDark;
  const imageKey = `quran-themed-image-${isDark ? 'dark' : 'light'}`;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.themeColors.background }]}>
      <Image
        key={imageKey} // force remount on theme changes to clear any cached tint
        source={source}
        style={[
          styles.image,
          width !== undefined && { width },
          height !== undefined && { height },
          // Only tint in dark mode; in light mode show raw PNG colors
          isDark ? { tintColor: theme.themeColors.text } : { tintColor: undefined },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
