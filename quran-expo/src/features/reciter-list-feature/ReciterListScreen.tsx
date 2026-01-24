/**
 * ReciterListView.swift + ReciterListViewController.swift → ReciterListScreen.tsx
 *
 * Reciter list screen component.
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l } from '../../core/localization';
import { useTheme } from '../../ui/theme';
// NoorSystemImage import removed - using direct Ionicons names
import type { Reciter } from '../../model/quran-audio';
import {
  ReciterListViewModel,
  type ReciterListViewState,
} from './reciter-list-view-model';

// ============================================================================
// Types
// ============================================================================

export interface ReciterListScreenProps {
  viewModel: ReciterListViewModel;
  onDismiss?: () => void;
}

interface SectionData {
  title: string;
  data: Reciter[];
  showRecentIcon: boolean;
}

// ============================================================================
// ReciterListScreen Component
// ============================================================================

export function ReciterListScreen({ viewModel, onDismiss }: ReciterListScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<ReciterListViewState>(viewModel.state);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    viewModel.start();

    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Handle reciter selection
  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      viewModel.selectReciter(reciter);
      onDismiss?.();
    },
    [viewModel, onDismiss]
  );

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Get localized language name
  const getLocalizedLanguage = useCallback((languageCode: string): string => {
    try {
      const displayNames = new Intl.DisplayNames([languageCode], { type: 'language' });
      const name = displayNames.of(languageCode);
      if (name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    } catch {
      // Fallback
    }
    return languageCode;
  }, []);

  // Build sections
  const sections = useMemo((): SectionData[] => {
    const result: SectionData[] = [];

    // Recent reciters
    if (state.recentReciters.length > 0) {
      result.push({
        title: l('reciters.recent'),
        data: state.recentReciters,
        showRecentIcon: true,
      });
    }

    // Downloaded reciters
    if (state.downloadedReciters.length > 0) {
      result.push({
        title: l('reciters.downloaded'),
        data: state.downloadedReciters,
        showRecentIcon: false,
      });
    }

    // English reciters
    if (state.englishReciters.length > 0) {
      const languageName = getLocalizedLanguage('en');
      result.push({
        title: `${l('reciters.all')} (${languageName})`,
        data: state.englishReciters,
        showRecentIcon: false,
      });
    }

    // Arabic reciters
    if (state.arabicReciters.length > 0) {
      const languageName = getLocalizedLanguage('ar');
      result.push({
        title: `${l('reciters.all')} (${languageName})`,
        data: state.arabicReciters,
        showRecentIcon: false,
      });
    }

    return result;
  }, [state, getLocalizedLanguage]);

  // Render list item
  const renderItem = useCallback(
    ({ item, section }: { item: Reciter; section: SectionData }) => {
      const isSelected = state.selectedReciter?.id === item.id;

      return (
        <ReciterListItem
          reciter={item}
          isSelected={isSelected}
          showRecentIcon={section.showRecentIcon}
          onPress={() => handleSelectReciter(item)}
        />
      );
    },
    [state.selectedReciter, handleSelectReciter]
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemGroupedBackground }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.label }]}>
          {l('reciters.title')}
        </Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.doneButton}>
          <Text style={[styles.doneButtonText, { color: theme.colors.tint }]}>
            {l('button.done')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {state.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.tint} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// ============================================================================
// ReciterListItem Component
// ============================================================================

interface ReciterListItemProps {
  reciter: Reciter;
  isSelected: boolean;
  showRecentIcon: boolean;
  isDownloaded?: boolean;
  isDownloading?: boolean;
  downloadProgress?: number;
  onPress: () => void;
  onDownload?: () => void;
}

function ReciterListItem({
  reciter,
  isSelected,
  showRecentIcon,
  isDownloaded = false,
  isDownloading = false,
  downloadProgress = 0,
  onPress,
  onDownload,
}: ReciterListItemProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}
      onPress={onPress}
    >
      {/* Recent Icon */}
      {showRecentIcon && (
        <Ionicons
          name="time-outline"
          size={20}
          color={theme.colors.secondaryLabel}
          style={styles.recentIcon}
        />
      )}

      {/* Reciter Name */}
      <Text style={[styles.reciterName, { color: theme.colors.label }]}>
        {reciter.localizedName}
      </Text>

      {/* Download Progress */}
      {isDownloading && (
        <View style={styles.downloadProgress}>
          <View 
            style={[
              styles.downloadProgressBar, 
              { 
                backgroundColor: theme.colors.tint,
                width: `${Math.round(downloadProgress * 100)}%` 
              }
            ]} 
          />
        </View>
      )}

      {/* Download Button */}
      {!isDownloaded && !isDownloading && !isSelected && onDownload && (
        <TouchableOpacity onPress={onDownload} style={styles.downloadButton}>
          <Ionicons
            name="cloud-download-outline"
            size={20}
            color={theme.colors.tint}
          />
        </TouchableOpacity>
      )}

      {/* Downloaded Checkmark */}
      {isDownloaded && !isSelected && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={theme.colors.secondaryLabel}
          style={styles.checkmark}
        />
      )}

      {/* Selected Checkmark */}
      {isSelected && (
        <Ionicons
          name="checkmark"
          size={20}
          color={theme.colors.tint}
          style={styles.checkmark}
        />
      )}
    </TouchableOpacity>
  );
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
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  recentIcon: {
    marginRight: 12,
  },
  reciterName: {
    flex: 1,
    fontSize: 17,
  },
  checkmark: {
    marginLeft: 12,
  },
  downloadButton: {
    padding: 8,
    marginLeft: 8,
  },
  downloadProgress: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginLeft: 12,
    overflow: 'hidden',
  },
  downloadProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

