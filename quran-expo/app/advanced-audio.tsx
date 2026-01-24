/**
 * Advanced Audio Options Screen
 *
 * Advanced audio settings screen.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/src/ui/theme';

export default function AdvancedAudioScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Advanced Audio',
          headerStyle: { backgroundColor: theme.colors.systemBackground },
          headerTintColor: theme.colors.label,
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
        <Text style={[styles.placeholder, { color: theme.colors.secondaryLabel }]}>
          Advanced audio options will be displayed here.
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
