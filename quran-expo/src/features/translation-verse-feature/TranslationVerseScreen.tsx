/**
 * TranslationVerseView.swift + TranslationVerseViewController.swift → TranslationVerseScreen.tsx
 *
 * Screen for displaying a single verse translation.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  I18nManager,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../ui/theme';
import { logger } from '../../core/logging';
import { SelectedTranslationsPreferences } from '../../domain/quran-text-kit';
import { ContentTranslationView } from '../quran-translation-feature';
import type { MoreMenuControlsState, MoreMenuModel } from '../more-menu-feature';
import {
  TranslationVerseViewModel,
  type TranslationVerseViewModelState,
} from './translation-verse-view-model';

// ============================================================================
// TwoLineNavigationTitle Component
// ============================================================================

interface TwoLineNavigationTitleProps {
  firstLine: string;
  secondLine: string;
}

function TwoLineNavigationTitle({ firstLine, secondLine }: TwoLineNavigationTitleProps) {
  const theme = useTheme();

  return (
    <View style={styles.titleContainer}>
      <Text style={[styles.titleFirstLine, { color: theme.colors.secondaryLabel }]} numberOfLines={1}>
        {firstLine}
      </Text>
      <Text style={[styles.titleSecondLine, { color: theme.colors.label }]} numberOfLines={1}>
        {secondLine}
      </Text>
    </View>
  );
}

// ============================================================================
// TranslationVerseScreen Props
// ============================================================================

export interface TranslationVerseScreenProps {
  viewModel: TranslationVerseViewModel;
  onDismiss?: () => void;
}

// ============================================================================
// TranslationVerseScreen Component
// ============================================================================

/**
 * Screen for displaying a single verse translation.
 *
 * 1:1 translation of iOS TranslationVerseViewController.
 */
export function TranslationVerseScreen({ viewModel, onDismiss }: TranslationVerseScreenProps) {
  const navigation = useNavigation();
  const theme = useTheme();

  // State
  const [state, setState] = useState<TranslationVerseViewModelState>(viewModel.state);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTranslationsSelection, setShowTranslationsSelection] = useState(false);
  const firstTimeRef = useRef(true);

  // Subscribe to view model state
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Check if translations are selected on first appearance
  useEffect(() => {
    if (firstTimeRef.current) {
      const noTranslationsSelected =
        SelectedTranslationsPreferences.shared.selectedTranslationIds.length === 0;
      if (noTranslationsSelected) {
        setShowTranslationsSelection(true);
      }
      firstTimeRef.current = false;
    }
  }, []);

  // Handlers
  const handleNext = useCallback(() => {
    viewModel.next();
  }, [viewModel]);

  const handlePrevious = useCallback(() => {
    viewModel.previous();
  }, [viewModel]);

  const handleSettings = useCallback(() => {
    logger.info('Verse Translation: Settings button tapped');
    setShowMoreMenu(true);
  }, []);

  const handleDone = useCallback(() => {
    onDismiss?.();
    navigation.goBack();
  }, [navigation, onDismiss]);

  const handleTranslationsSelectionDone = useCallback(() => {
    logger.info('Quran: translations selection dismissed');
    setShowTranslationsSelection(false);
  }, []);

  // Current verse info for title
  const firstLine = state.currentVerse.sura.localizedName(true);
  const secondLine = state.currentVerse.localizedAyahNumber;

  // RTL-aware navigation button order
  const isRTL = I18nManager.isRTL;

  // Left navigation buttons (next/previous)
  const navigationButtons = (
    <View style={styles.navigationButtons}>
      {isRTL ? (
        <>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={!state.hasPrevious}
            style={styles.navButton}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={state.hasPrevious ? theme.colors.tint : theme.colors.tertiaryLabel}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!state.hasNext}
            style={styles.navButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={state.hasNext ? theme.colors.tint : theme.colors.tertiaryLabel}
            />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!state.hasNext}
            style={styles.navButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={state.hasNext ? theme.colors.tint : theme.colors.tertiaryLabel}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={!state.hasPrevious}
            style={styles.navButton}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={state.hasPrevious ? theme.colors.tint : theme.colors.tertiaryLabel}
            />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      {/* Navigation Bar */}
      <SafeAreaView style={styles.navigationBarSafeArea}>
        <View style={[styles.navigationBar, { borderBottomColor: theme.colors.separator }]}>
          {/* Left: Navigation buttons */}
          {navigationButtons}

          {/* Center: Title */}
          <TwoLineNavigationTitle firstLine={firstLine} secondLine={secondLine} />

          {/* Right: Settings and Done */}
          <View style={styles.rightButtons}>
            <TouchableOpacity onPress={handleSettings} style={styles.navButton}>
              <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={theme.colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone} style={styles.navButton}>
              <Text style={[styles.doneButton, { color: theme.colors.tint }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ContentTranslationView viewModel={viewModel.translationViewModel} />

      {/* More Menu Modal */}
      {showMoreMenu && (
        <MoreMenuModal
          onDismiss={() => setShowMoreMenu(false)}
          onTranslationsSelection={() => {
            setShowMoreMenu(false);
            setShowTranslationsSelection(true);
          }}
        />
      )}

      {/* Translations Selection Modal */}
      {showTranslationsSelection && (
        <TranslationsSelectionModal onDismiss={handleTranslationsSelectionDone} />
      )}
    </View>
  );
}

// ============================================================================
// MoreMenuModal Component
// ============================================================================

interface MoreMenuModalProps {
  onDismiss: () => void;
  onTranslationsSelection: () => void;
}

function MoreMenuModal({ onDismiss, onTranslationsSelection }: MoreMenuModalProps) {
  const theme = useTheme();

  // The more menu in translation verse mode has limited options:
  // - mode: alwaysOff
  // - translationsSelection: alwaysOn
  // - wordPointer: alwaysOff
  // - orientation: alwaysOff
  // - fontSize: alwaysOn
  // - twoPages: alwaysOff
  // - verticalScrolling: alwaysOff

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onDismiss}>
        <View style={[styles.menuContainer, { backgroundColor: theme.colors.secondarySystemBackground }]}>
          <TouchableOpacity style={styles.menuItem} onPress={onTranslationsSelection}>
            <Ionicons name="language-outline" size={20} color={theme.colors.label} />
            <Text style={[styles.menuItemText, { color: theme.colors.label }]}>Translations</Text>
          </TouchableOpacity>

          <View style={[styles.menuSeparator, { backgroundColor: theme.colors.separator }]} />

          <TouchableOpacity style={styles.menuItem} onPress={onDismiss}>
            <Ionicons name="text-outline" size={20} color={theme.colors.label} />
            <Text style={[styles.menuItemText, { color: theme.colors.label }]}>Font Size</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ============================================================================
// TranslationsSelectionModal Component
// ============================================================================

interface TranslationsSelectionModalProps {
  onDismiss: () => void;
}

function TranslationsSelectionModal({ onDismiss }: TranslationsSelectionModalProps) {
  const theme = useTheme();

  return (
    <Modal visible animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.systemBackground }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.separator }]}>
          <TouchableOpacity onPress={onDismiss} style={styles.navButton}>
            <Ionicons name="close-circle-outline" size={24} color={theme.colors.tint} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.colors.label }]}>Translations</Text>
          <View style={styles.navButton} />
        </View>
        <View style={styles.modalContent}>
          <Text style={{ color: theme.colors.secondaryLabel, textAlign: 'center' }}>
            Translations list will be rendered here
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigationBarSafeArea: {
    backgroundColor: 'transparent',
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  titleFirstLine: {
    fontSize: 15,
    fontWeight: '300',
  },
  titleSecondLine: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menuContainer: {
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

