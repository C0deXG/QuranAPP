/**
 * MigrationViewController.swift → MigrationScreen.tsx
 *
 * Screen shown during app migration with activity indicator.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../ui/theme';

// ============================================================================
// MigrationScreen
// ============================================================================

export interface MigrationScreenProps {
  /** Set of migration titles to display */
  titles: Set<string>;
}

/**
 * Screen shown during app migration.
 * Displays an activity indicator and migration titles.
 *
 * 1:1 translation of iOS MigrationViewController.
 */
export function MigrationScreen({ titles }: MigrationScreenProps) {
  const theme = useTheme();

  // Join titles with newlines (matching iOS behavior)
  const titlesText = Array.from(titles).join('\n');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      <ActivityIndicator
        size="large"
        color={theme.appIdentity}
        style={styles.activityIndicator}
      />
      <Text
        style={[styles.textLabel, { color: theme.colors.label }]}
        numberOfLines={0}
      >
        {titlesText}
      </Text>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  activityIndicator: {
    marginBottom: 20,
  },
  textLabel: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
  },
});

