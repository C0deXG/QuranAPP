/**
 * LoadingView.swift → LoadingView.tsx
 *
 * A centered loading spinner component.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

// ============================================================================
// LoadingView Component
// ============================================================================

export interface LoadingViewProps {
  /** Size of the loading indicator */
  size?: 'small' | 'large';
  /** Optional color override */
  color?: string;
}

/**
 * A centered loading spinner.
 */
export function LoadingView({ size = 'large', color }: LoadingViewProps) {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={color ?? theme.appIdentity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

