/**
 * Notes Tab Screen
 *
 * Notes list screen.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/ui/theme';
import { l } from '@/src/core/localization';

/**
 * Notes tab component.
 */
export default function NotesTab() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      <Text style={[styles.placeholder, { color: theme.colors.secondaryLabel }]}>
        {l('notes.empty')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 17,
  },
});
