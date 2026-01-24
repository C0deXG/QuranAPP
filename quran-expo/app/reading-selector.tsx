/**
 * Reading Selector Screen Route
 *
 * Reading style selection screen - route wrapper.
 *
 * Quran.com. All rights reserved.
 */

import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/src/ui/theme';
import { l } from '@/src/core/localization';
import { ReadingSelectorScreen } from '@/src/features/reading-selector-feature/ReadingSelectorScreen';
import { ReadingSelectorViewModel } from '@/src/features/reading-selector-feature/reading-selector-view-model';

// Placeholder ReadingResourcesService that does nothing (for now)
// TODO: Connect to actual ReadingResourcesService when fully integrated
const placeholderResourcesService = {
  addStatusListener: (_listener: (status: { type: string; progress?: number; error?: Error }) => void) => {
    // No-op for now
  },
  removeStatusListener: (_listener: (status: { type: string; progress?: number; error?: Error }) => void) => {
    // No-op for now
  },
};

export default function ReadingSelectorRoute() {
  const theme = useTheme();

  // Create view model
  const viewModel = useMemo(() => {
    return new ReadingSelectorViewModel(placeholderResourcesService as any);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: l('reading.selector.title'),
          headerStyle: { backgroundColor: theme.colors.systemBackground },
          headerTintColor: theme.colors.label,
        }}
      />
      <ReadingSelectorScreen viewModel={viewModel} />
    </>
  );
}
