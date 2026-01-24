/**
 * DisclosureIndicator.swift → DisclosureIndicator.tsx
 *
 * A chevron indicator for list items.
 * Automatically flips for RTL layouts.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

// ============================================================================
// DisclosureIndicator Component
// ============================================================================

export interface DisclosureIndicatorProps {
  /** Size of the icon */
  size?: number;
  /** Optional color override */
  color?: string;
}

/**
 * A chevron indicator for list items.
 * Flips direction in RTL layouts.
 */
export function DisclosureIndicator({ size = 18, color }: DisclosureIndicatorProps) {
  const theme = useTheme();
  
  // Flip the icon for RTL
  const iconName = I18nManager.isRTL ? 'chevron-back' : 'chevron-forward';
  
  return (
    <View style={styles.container}>
      <Ionicons
        name={iconName}
        size={size}
        color={color ?? theme.colors.secondaryLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

