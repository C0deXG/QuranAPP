/**
 * Search Tab Screen
 *
 * Search screen.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/src/ui/theme';
import { l } from '@/src/core/localization';

/**
 * Search tab component.
 */
export default function SearchTab() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: theme.colors.secondarySystemBackground,
            color: theme.colors.label,
          },
        ]}
        placeholder={l('search.placeholder')}
        placeholderTextColor={theme.colors.placeholderText}
      />
      <Text style={[styles.placeholder, { color: theme.colors.secondaryLabel }]}>
        {l('search.hint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 17,
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 15,
    textAlign: 'center',
  },
});
