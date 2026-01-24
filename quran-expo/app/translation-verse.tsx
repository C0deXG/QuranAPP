/**
 * Translation Verse Screen
 *
 * Single verse translation view.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/ui/theme';

export default function TranslationVerseScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ sura: string; ayah: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `${params.sura}:${params.ayah}`,
          headerStyle: { backgroundColor: theme.colors.systemBackground },
          headerTintColor: theme.colors.label,
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
        <Text style={[styles.placeholder, { color: theme.colors.secondaryLabel }]}>
          Verse translation will be displayed here.
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
