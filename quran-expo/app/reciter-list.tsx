/**
 * Reciter List Screen Route
 *
 * Reciter selection screen - route wrapper.
 *
 * Quran.com. All rights reserved.
 */

import React, { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/src/ui/theme';
import { l } from '@/src/core/localization';
import { ReciterListScreen } from '@/src/features/reciter-list-feature/ReciterListScreen';
import { ReciterListViewModel } from '@/src/features/reciter-list-feature/reciter-list-view-model';
import { ReciterPreferences } from '@/src/domain/reciter-service';

export default function ReciterListRoute() {
  const theme = useTheme();
  const router = useRouter();

  // Create view model
  const viewModel = useMemo(() => {
    const vm = new ReciterListViewModel(false);
    // Set up listener to save selected reciter
    vm.listener = {
      onSelectedReciterChanged: (reciter) => {
        // Save the selected reciter
        ReciterPreferences.shared.lastSelectedReciterId = reciter.id;
        console.log('Selected reciter:', reciter.localizedName);
      },
    };
    return vm;
  }, []);

  // Handle dismiss
  const handleDismiss = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false, // ReciterListScreen has its own header
        }}
      />
      <ReciterListScreen viewModel={viewModel} onDismiss={handleDismiss} />
    </>
  );
}
