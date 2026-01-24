/**
 * What's New Screen
 *
 * What's new modal.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/src/ui/theme';
import { l } from '@/src/core/localization';

export default function WhatsNewScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
        <Text style={[styles.title, { color: theme.colors.label }]}>
          {l('new.title')}
        </Text>
        <Text style={[styles.placeholder, { color: theme.colors.secondaryLabel }]}>
          New features and updates will be displayed here.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.tint }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>{l('new.action')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});
