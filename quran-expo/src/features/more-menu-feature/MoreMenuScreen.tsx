/**
 * MoreMenuView.swift + MoreMenuController.swift → MoreMenuScreen.tsx
 *
 * More menu screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { l } from '../../core/localization';
import { useTheme } from '../../ui/theme';
import { DisclosureIndicator } from '../../ui/components';
import type { WordTextType } from '../../model/quran-text';
import {
  MoreMenuViewModel,
  type MoreMenuViewState,
} from './more-menu-view-model';
import type { ConfigState } from './more-menu-model';
import {
  MoreMenuModeSelector,
  MoreMenuToggle,
  MoreMenuListItem,
  MoreMenuFontSizeStepper,
} from './views';

// ============================================================================
// Types
// ============================================================================

export interface MoreMenuScreenProps {
  viewModel: MoreMenuViewModel;
  onNavigateToWordPointerType?: () => void;
  onNavigateToThemeSettings?: () => void;
  onDismiss?: () => void;
}

// ============================================================================
// MoreMenuScreen Component
// ============================================================================

export function MoreMenuScreen({
  viewModel,
  onNavigateToWordPointerType,
  onNavigateToThemeSettings,
  onDismiss,
}: MoreMenuScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<MoreMenuViewState>(viewModel.state);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  const { controlsState } = state;

  // Helper to check visibility
  const isVisible = useCallback(
    (configState: ConfigState, customCondition: boolean = true): boolean => {
      return viewModel.isVisible(configState, customCondition);
    },
    [viewModel]
  );

  // Separator component
  const Separator = () => (
    <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
  );

  // Empty space component (for visual separation)
  const EmptySpace = () => <View style={styles.emptySpace} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Mode Selector */}
      {isVisible(controlsState.mode) && (
        <View style={styles.section}>
          <MoreMenuModeSelector
            mode={state.mode}
            onModeChange={(mode) => viewModel.setMode(mode)}
          />
        </View>
      )}

      {/* Translation Selector */}
      {isVisible(controlsState.translationsSelection, state.mode === 'translation') && (
        <>
          <View style={styles.section}>
            <MoreMenuListItem
              title={l('menu.select_translation')}
              onPress={() => viewModel.selectTranslations()}
            />
          </View>
          <EmptySpace />
        </>
      )}

      {/* Word Pointer */}
      {isVisible(controlsState.wordPointer, state.mode === 'arabic') && (
        <>
          <View style={styles.section}>
            <MoreMenuToggle
              label={l('menu.pointer')}
              value={state.wordPointerEnabled}
              onValueChange={(enabled) => viewModel.setWordPointerEnabled(enabled)}
            />

            {state.wordPointerEnabled && (
              <>
                <Separator />
                <MoreMenuListItem
                  title={l('menu.pointer.select_translation')}
                  subtitle={getWordTextTypeLocalizedName(state.wordPointerType)}
                  onPress={() => onNavigateToWordPointerType?.()}
                />
              </>
            )}
          </View>
          <EmptySpace />
        </>
      )}

      {/* Two Pages */}
      {isVisible(controlsState.twoPages) && (
        <>
          <View style={styles.section}>
            <MoreMenuToggle
              label={l('menu.twoPages')}
              value={state.twoPagesEnabled}
              onValueChange={(enabled) => viewModel.setTwoPagesEnabled(enabled)}
            />
          </View>
          <EmptySpace />
        </>
      )}

      {/* Vertical Scrolling */}
      {isVisible(controlsState.verticalScrolling) && (
        <View style={styles.section}>
          <MoreMenuToggle
            label={l('menu.verticalScrolling')}
            value={state.verticalScrollingEnabled}
            onValueChange={(enabled) => viewModel.setVerticalScrollingEnabled(enabled)}
          />
        </View>
      )}

      {/* Theme Settings */}
      {isVisible(controlsState.theme) && (
        <View style={styles.section}>
          <MoreMenuListItem
            title={l('menu.theme_settings')}
            onPress={() => onNavigateToThemeSettings?.()}
          />
        </View>
      )}
    </ScrollView>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getWordTextTypeLocalizedName(type: WordTextType): string {
  switch (type) {
    case 'translation':
      return l('translation.text-type.translation');
    case 'transliteration':
      return l('translation.text-type.transliteration');
    default:
      return '';
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  section: {
    marginBottom: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  emptySpace: {
    height: 16,
  },
});

