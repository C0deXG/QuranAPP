/**
 * NoteCircle.swift → NoteCircle.tsx
 *
 * Colored circle for note color selection.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';

// ============================================================================
// NoteCircle Component
// ============================================================================

export interface NoteCircleProps {
  /** The fill color */
  color: string;
  /** Whether this circle is selected */
  selected: boolean;
  /** Size of the circle */
  size?: number;
  /** Callback when pressed */
  onPress?: () => void;
}

/**
 * A colored circle used for note color selection.
 */
export function NoteCircle({ color, selected, size = 35, onPress }: NoteCircleProps) {
  const theme = useTheme();
  
  const content = (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Fill */}
      <View style={[styles.circle, styles.fill, { backgroundColor: color }]} />
      
      {/* Border */}
      <View
        style={[
          styles.circle,
          styles.border,
          { borderColor: theme.colors.tertiaryLabel },
        ]}
      />
      
      {/* Selection ring */}
      {selected && (
        <View
          style={[
            styles.circle,
            styles.selectionRing,
            { borderColor: theme.colors.label },
          ]}
        />
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8}>
        {content}
      </Pressable>
    );
  }
  
  return content;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  circle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
  },
  fill: {},
  border: {
    borderWidth: 1,
  },
  selectionRing: {
    borderWidth: 2,
  },
});

