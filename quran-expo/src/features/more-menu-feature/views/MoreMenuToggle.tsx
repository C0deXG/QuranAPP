/**
 * MoreMenuWordPointer, MoreMenuTwoPages, MoreMenuVerticalScrolling → MoreMenuToggle.tsx
 *
 * Toggle menu items.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../../../ui/theme';

// ============================================================================
// Types
// ============================================================================

interface MoreMenuToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

// ============================================================================
// MoreMenuToggle Component
// ============================================================================

export function MoreMenuToggle({
  label,
  value,
  onValueChange,
}: MoreMenuToggleProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.label }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.systemGray3, true: theme.colors.tint }}
        thumbColor={theme.colors.systemBackground}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  label: {
    fontSize: 17,
  },
});

