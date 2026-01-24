/**
 * AppearanceModeSelector component.
 *
 * A segmented control for selecting the appearance mode (light/dark/auto).
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l } from '../../core/localization';
import { useTheme, type AppearanceMode } from '../../ui/theme';

// ============================================================================
// Types
// ============================================================================

export interface AppearanceModeSelectorProps {
  selectedMode: AppearanceMode;
  onSelectMode: (mode: AppearanceMode) => void;
}

// ============================================================================
// AppearanceModeSelector Component
// ============================================================================

export function AppearanceModeSelector({
  selectedMode,
  onSelectMode,
}: AppearanceModeSelectorProps) {
  const theme = useTheme();

  const modes: { mode: AppearanceMode; icon: string; label: string }[] = [
    { mode: 'light', icon: 'sunny-outline', label: l('appearance.light') },
    { mode: 'dark', icon: 'moon-outline', label: l('appearance.dark') },
    { mode: 'auto', icon: 'phone-portrait-outline', label: l('appearance.auto') },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.secondaryLabel }]}>
        {l('appearance.title')}
      </Text>
      <View style={styles.optionsContainer}>
        {modes.map((item) => {
          const isSelected = selectedMode === item.mode;
          return (
            <TouchableOpacity
              key={item.mode}
              style={[
                styles.option,
                isSelected && [styles.optionSelected, { borderColor: theme.colors.tint }],
              ]}
              onPress={() => onSelectMode(item.mode)}
            >
              <Ionicons
                name={item.icon as any}
                size={28}
                color={isSelected ? theme.colors.tint : theme.colors.secondaryLabel}
                style={styles.optionIcon}
              />
              <Text
                style={[
                  styles.optionLabel,
                  { color: isSelected ? theme.colors.tint : theme.colors.label },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  option: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  optionIcon: {
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});

