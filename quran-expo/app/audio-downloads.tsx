/**
 * Audio Downloads Screen
 *
 * Audio downloads management screen.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/src/ui/theme';
import { l } from '@/src/core/localization';

export default function AudioDownloadsScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: l('audio.downloads.title'),
          headerStyle: { backgroundColor: theme.colors.systemBackground },
          headerTintColor: theme.colors.label,
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
        <Text style={[styles.placeholder, { color: theme.colors.secondaryLabel }]}>
          Audio downloads will be displayed here.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 15,
    textAlign: 'center',
  },
});
