/**
 * CloseButton.swift → CloseButton.tsx
 *
 * A circular close button for dismissing modals/sheets.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

// ============================================================================
// CloseButton
// ============================================================================

export interface CloseButtonProps {
  /** Callback when the button is pressed */
  onPress: () => void;
  /** Size of the icon (default: 28) */
  size?: number;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * A circular close button with x-mark icon.
 * Styled similar to iOS's standard close button.
 */
export function CloseButton({ onPress, size = 28, style }: CloseButtonProps) {
  const theme = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      accessibilityLabel="Close"
      accessibilityRole="button"
    >
      <Ionicons
        name="close-circle"
        size={size}
        color={theme.colors.tertiaryLabel}
      />
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});

