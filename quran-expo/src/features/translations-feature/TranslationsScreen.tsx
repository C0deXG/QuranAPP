/**
 * TranslationsListView.swift + TranslationsViewController.swift → TranslationsScreen.tsx
 *
 * Translations list screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l, lAndroid } from '../../core/localization';
import { MultiPredicateComparer } from '../../core/utilities';
import { useTheme } from '../../ui/theme';
import { LoadingView } from '../../ui/components';
import type { TranslationItem } from './translation-item';
import {
  getDisplayName,
  getLanguageCode,
  getItemLocalizedLanguage,
  localizedLanguageForCode,
} from './translation-item';
import {
  TranslationsViewModel,
  type TranslationsViewState,
} from './translations-view-model';

// ============================================================================
// Types
// ============================================================================

export interface TranslationsScreenProps {
  viewModel: TranslationsViewModel;
}

interface SectionData {
  title: string;
  data: TranslationItem[];
  type: 'selected' | 'downloaded' | 'available';
}

// ============================================================================
// TranslationsScreen Component
// ============================================================================

export function TranslationsScreen({ viewModel }: TranslationsScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<TranslationsViewState>(viewModel.state);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    viewModel.start();

    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Show error alert
  useEffect(() => {
    if (state.error) {
      Alert.alert(
        l('error'),
        state.error.message,
        [{ text: l('ok'), onPress: () => viewModel.clearError() }]
      );
    }
  }, [state.error, viewModel]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await viewModel.refresh();
  }, [viewModel]);

  // Handle edit mode toggle
  const handleToggleEdit = useCallback(() => {
    viewModel.toggleEditMode();
  }, [viewModel]);

  // Build sections
  const sections = useMemo((): SectionData[] => {
    const result: SectionData[] = [];

    // Selected translations
    if (state.selectedTranslations.length > 0) {
      result.push({
        title: l('translation.selectedTranslations'),
        data: state.selectedTranslations,
        type: 'selected',
      });
    }

    // Downloaded translations
    if (state.downloadedTranslations.length > 0) {
      result.push({
        title: lAndroid('downloaded_translations'),
        data: state.downloadedTranslations,
        type: 'downloaded',
      });
    }

    // Available translations (grouped by language)
    const availableByLanguage = groupByLanguage(state.availableTranslations);
    for (const { languageCode, translations } of availableByLanguage) {
      const languageName = localizedLanguageForCode(languageCode) ?? languageCode;
      result.push({
        title: languageName,
        data: translations,
        type: 'available',
      });
    }

    return result;
  }, [state.selectedTranslations, state.downloadedTranslations, state.availableTranslations]);

  // Render list item
  const renderItem = useCallback(
    ({ item, section }: { item: TranslationItem; section: SectionData }) => {
      const isDownloaded = section.type === 'selected' || section.type === 'downloaded';
      const isSelected = section.type === 'selected';

      return (
        <TranslationListItem
          item={item}
          isDownloaded={isDownloaded}
          isSelected={isSelected}
          isEditing={state.isEditing}
          onSelect={() => viewModel.selectTranslation(item)}
          onDeselect={() => viewModel.deselectTranslation(item)}
          onDownload={() => viewModel.startDownloading(item)}
          onCancel={() => viewModel.cancelDownloading(item)}
          onDelete={() => viewModel.deleteTranslation(item)}
        />
      );
    },
    [state.isEditing, viewModel]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <View style={[styles.sectionHeader, { backgroundColor: theme.colors.systemGroupedBackground }]}>
        <Text style={[styles.sectionHeaderText, { color: theme.colors.secondaryLabel }]}>
          {section.title}
        </Text>
      </View>
    ),
    [theme]
  );

  // Check if edit should be shown
  const showEditButton =
    state.selectedTranslations.length > 0 || state.downloadedTranslations.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemGroupedBackground }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.label }]}>
          {lAndroid('prefs_translations')}
        </Text>
        {showEditButton && (
          <TouchableOpacity onPress={handleToggleEdit} style={styles.editButton}>
            <Text style={[styles.editButtonText, { color: theme.colors.tint }]}>
              {state.isEditing ? l('done') : l('edit')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {state.isLoading ? (
        <LoadingView />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.info.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl refreshing={state.isRefreshing} onRefresh={handleRefresh} />
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// ============================================================================
// TranslationListItem Component
// ============================================================================

interface TranslationListItemProps {
  item: TranslationItem;
  isDownloaded: boolean;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onDownload: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function TranslationListItem({
  item,
  isDownloaded,
  isSelected,
  isEditing,
  onSelect,
  onDeselect,
  onDownload,
  onCancel,
  onDelete,
}: TranslationListItemProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (isEditing) return;
    if (isDownloaded) {
      if (isSelected) {
        onDeselect();
      } else {
        onSelect();
      }
    }
  };

  const renderAccessory = () => {
    if (isEditing) {
      return (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.systemRed} />
        </TouchableOpacity>
      );
    }

    switch (item.progress.type) {
      case 'notDownloading':
        if (isDownloaded) {
          return null;
        }
        return (
          <TouchableOpacity onPress={onDownload} style={styles.downloadButton}>
            <Ionicons name="download-outline" size={22} color={theme.colors.tint} />
          </TouchableOpacity>
        );

      case 'downloading':
        const progress = item.progress.progress;
        return (
          <TouchableOpacity onPress={onCancel} style={styles.downloadButton}>
            {progress < 0.001 ? (
              <ActivityIndicator size="small" color={theme.colors.tint} />
            ) : (
              <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: theme.colors.tint }]}>
                  {Math.round(progress * 100)}%
                </Text>
                <Ionicons name="close-circle" size={18} color={theme.colors.secondaryLabel} />
              </View>
            )}
          </TouchableOpacity>
        );

      case 'needsUpgrade':
        return (
          <TouchableOpacity onPress={onDownload} style={styles.downloadButton}>
            <Ionicons name="refresh-outline" size={22} color={theme.colors.tint} />
          </TouchableOpacity>
        );
    }
  };

  const translatorName = item.info.translatorDisplayName;

  return (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}
      onPress={handlePress}
      disabled={isEditing || !isDownloaded}
    >
      {/* Checkbox for downloaded items */}
      {isDownloaded && !isEditing && (
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isSelected ? theme.colors.tint : theme.colors.tertiaryLabel}
          style={styles.checkbox}
        />
      )}

      {/* Content */}
      <View style={styles.itemContent}>
        {isDownloaded && (
          <Text style={[styles.itemLanguage, { color: theme.colors.secondaryLabel }]}>
            {getItemLocalizedLanguage(item) ?? getLanguageCode(item)}
          </Text>
        )}
        <Text style={[styles.itemTitle, { color: theme.colors.label }]}>
          {getDisplayName(item)}
        </Text>
        {translatorName && translatorName.length > 0 && (
          <Text style={[styles.itemSubtitle, { color: theme.colors.secondaryLabel }]}>
            {l('translation.translator')}: {translatorName}
          </Text>
        )}
      </View>

      {/* Accessory */}
      {renderAccessory()}
    </TouchableOpacity>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function groupByLanguage(
  translations: TranslationItem[]
): { languageCode: string; translations: TranslationItem[] }[] {
  // Get current locale for sorting
  const currentLanguageCode = 'en'; // Could use I18n.locale
  const englishCode = 'en';
  const arabicCode = 'ar';

  const comparer = new MultiPredicateComparer<string>([
    (lhs, _) => lhs === currentLanguageCode,
    (lhs, _) => lhs === arabicCode,
    (lhs, _) => lhs === englishCode,
    (lhs, rhs) => lhs < rhs,
  ]);

  // Get unique language codes
  const languageCodes = [...new Set(translations.map((t) => getLanguageCode(t)))].sort((a, b) =>
    comparer.areInIncreasingOrder(a, b) ? -1 : 1
  );

  return languageCodes.map((languageCode) => {
    const filtered = translations
      .filter((t) => t.info.languageCode === languageCode)
      .sort((a, b) => a.info.displayName.localeCompare(b.info.displayName));
    return { languageCode, translations: filtered };
  });
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 17,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 16,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 10,
  },
  checkbox: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLanguage: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 17,
  },
  itemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  downloadButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    marginRight: 4,
  },
});

