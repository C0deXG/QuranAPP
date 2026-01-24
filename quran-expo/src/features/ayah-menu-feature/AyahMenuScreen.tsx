/**
 * AyahMenuViewController.swift → AyahMenuScreen.tsx
 *
 * Ayah menu screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AyahMenuView, type AyahMenuUI } from '../../ui/features/ayah-menu';
import { AyahMenuViewModel } from './ayah-menu-view-model';
import type { NoteColor } from '../../model/quran-annotations';

// ============================================================================
// Types
// ============================================================================

export interface AyahMenuScreenProps {
  viewModel: AyahMenuViewModel;
  onDismiss?: () => void;
}

// ============================================================================
// AyahMenuScreen Component
// ============================================================================

/**
 * Screen component for the ayah menu.
 *
 * 1:1 translation of iOS AyahMenuViewController.
 */
export function AyahMenuScreen({ viewModel, onDismiss }: AyahMenuScreenProps) {
  // Create the actions object
  const actions: AyahMenuUI.Actions = useMemo(
    () => ({
      play: () => viewModel.play(),
      repeatVerses: () => viewModel.repeatVerses(),
      highlight: async (color: NoteColor) => {
        await viewModel.updateHighlight(color);
      },
      addNote: async () => {
        await viewModel.editNote();
      },
      deleteNote: async () => {
        await viewModel.deleteNotes();
      },
      showTranslation: () => viewModel.showTranslation(),
      copy: () => viewModel.copy(),
      share: () => viewModel.share(),
    }),
    [viewModel]
  );

  // Create the data object
  const dataObject: AyahMenuUI.DataObject = useMemo(
    () => ({
      highlightingColor: viewModel.highlightingColor,
      state: viewModel.noteState,
      playSubtitle: viewModel.playSubtitle,
      repeatSubtitle: viewModel.repeatSubtitle,
      actions,
      isTranslationView: viewModel.isTranslationView,
    }),
    [
      viewModel.highlightingColor,
      viewModel.noteState,
      viewModel.playSubtitle,
      viewModel.repeatSubtitle,
      viewModel.isTranslationView,
      actions,
    ]
  );

  return (
    <View style={styles.container}>
      <AyahMenuView dataObject={dataObject} />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

