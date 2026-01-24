/**
 * ActiveRoundedButton.swift → ActiveRoundedButton.tsx
 *
 * A pill-shaped button with the app's identity color.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme';

// ============================================================================
// ActiveRoundedButton Component
// ============================================================================

export interface ActiveRoundedButtonProps {
  /** Button label text */
  label: string;
  /** Async action to perform on press */
  onPress: () => Promise<void>;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * A pill-shaped button with the app's identity color.
 * Supports async actions with loading state.
 */
export function ActiveRoundedButton({ label, onPress, disabled }: ActiveRoundedButtonProps) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePress = async () => {
    if (isLoading || disabled) return;
    
    setIsLoading(true);
    try {
      await onPress();
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      style={[
        styles.button,
        { backgroundColor: theme.appIdentity + 'CC' }, // 80% opacity
        (disabled || isLoading) && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
});

