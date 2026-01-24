/**
 * MoreMenuModeSelector.swift → MoreMenuModeSelector.tsx
 *
 * Mode selector (Arabic/Translation) for the more menu.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { l } from '../../../core/localization';
import { useTheme } from '../../../ui/theme';
import type { QuranMode } from '../../../model/quran-text';

// ============================================================================
// Types
// ============================================================================

interface MoreMenuModeSelectorProps {
  mode: QuranMode;
  onModeChange: (mode: QuranMode) => void;
}

// ============================================================================
// MoreMenuModeSelector Component
// ============================================================================

export function MoreMenuModeSelector({
  mode,
  onModeChange,
}: MoreMenuModeSelectorProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemGray5 }]}>
      <TouchableOpacity
        style={[
          styles.segment,
          mode === 'arabic' && { backgroundColor: theme.colors.systemBackground },
        ]}
        onPress={() => onModeChange('arabic')}
      >
        <Text
          style={[
            styles.segmentText,
            { color: mode === 'arabic' ? theme.colors.label : theme.colors.secondaryLabel },
          ]}
        >
          {l('menu.arabic')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.segment,
          mode === 'translation' && { backgroundColor: theme.colors.systemBackground },
        ]}
        onPress={() => onModeChange('translation')}
      >
        <Text
          style={[
            styles.segmentText,
            { color: mode === 'translation' ? theme.colors.label : theme.colors.secondaryLabel },
          ]}
        >
          {l('menu.translation')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    marginBottom: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

