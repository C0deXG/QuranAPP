/**
 * DataUnavailableView.swift → DataUnavailableView.tsx
 *
 * Empty state view for when no data is available.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { NoorSystemImage, getIoniconName } from '../images';

// ============================================================================
// DataUnavailableView Component
// ============================================================================

export interface DataUnavailableViewProps {
  /** The title text */
  title: string;
  /** The description text */
  text: string;
  /** The icon to display */
  image: NoorSystemImage;
}

/**
 * Empty state view displayed when no data is available.
 */
export function DataUnavailableView({ title, text, image }: DataUnavailableViewProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  
  const iconName = getIoniconName(image) as keyof typeof Ionicons.glyphMap;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemGroupedBackground }]}>
      <View style={[styles.content, { marginTop: height / 4 }]}>
        <Ionicons
          name={iconName}
          size={48}
          color={theme.colors.secondaryLabel}
          style={styles.icon}
        />
        <Text style={[styles.title, { color: theme.colors.secondaryLabel }]}>
          {title}
        </Text>
        <Text style={[styles.text, { color: theme.colors.secondaryLabel }]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

