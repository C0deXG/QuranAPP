/**
 * BookmarksView.swift + BookmarksViewController.swift → BookmarksScreen.tsx
 *
 * Bookmarks screen component showing page bookmarks.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l } from '../../core/localization';
import { NumberFormatter } from '../../core/localization';
import { useTheme } from '../../ui/theme';
import { NoorListItem, DataUnavailableView } from '../../ui/components';
import { NoorSystemImage } from '../../ui/images';
import { timeAgo } from '../../ui/formatters';
import type { PageBookmark } from '../../model/quran-annotations';
import {
  BookmarksViewModel,
  type BookmarksViewState,
} from './bookmarks-view-model';

// ============================================================================
// Types
// ============================================================================

export interface BookmarksScreenProps {
  viewModel: BookmarksViewModel;
}

// ============================================================================
// BookmarksScreen Component
// ============================================================================

export function BookmarksScreen({ viewModel }: BookmarksScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<BookmarksViewState>(viewModel.state);

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

  // Handle bookmark selection
  const handleSelectBookmark = useCallback(
    (bookmark: PageBookmark) => {
      viewModel.navigateTo(bookmark);
    },
    [viewModel]
  );

  // Handle bookmark deletion
  const handleDeleteBookmark = useCallback(
    async (bookmark: PageBookmark) => {
      Alert.alert(
        l('delete'),
        l('bookmarks.delete.confirm'),
        [
          { text: l('cancel'), style: 'cancel' },
          {
            text: l('delete'),
            style: 'destructive',
            onPress: () => viewModel.deleteItem(bookmark),
          },
        ]
      );
    },
    [viewModel]
  );

  // Handle edit mode toggle
  const handleToggleEdit = useCallback(() => {
    viewModel.toggleEditMode();
  }, [viewModel]);

  // Render bookmark item
  const renderItem = useCallback(
    ({ item }: { item: PageBookmark }) => {
      const ayah = item.page.firstVerse;
      const numberFormatter = NumberFormatter.shared;

      return (
        <View style={styles.itemContainer}>
          <NoorListItem
            image={{ name: NoorSystemImage.Bookmark, color: theme.colors.systemRed }}
            title={`${ayah.sura.localizedName()} ${ayah.sura.arabicSuraName}`}
            subtitle={{ text: timeAgo(item.creationDate), location: 'bottom' }}
            accessory={{ type: 'text', text: numberFormatter.format(item.page.pageNumber) }}
            onPress={() => handleSelectBookmark(item)}
          />
          {state.isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteBookmark(item)}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.systemRed} />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [theme, state.isEditing, handleSelectBookmark, handleDeleteBookmark]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: PageBookmark) => `bookmark-${item.page.pageNumber}`,
    []
  );

  // Render empty state
  if (!state.isLoading && state.bookmarks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.label }]}>
            {l('menu_bookmarks')}
          </Text>
        </View>

        <DataUnavailableView
          title={l('bookmarks.no-data.title')}
          text={l('bookmarks.no-data.text')}
          image="bookmark"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.label }]}>
          {l('menu_bookmarks')}
        </Text>
        {state.bookmarks.length > 0 && (
          <TouchableOpacity onPress={handleToggleEdit} style={styles.editButton}>
            <Text style={[styles.editButtonText, { color: theme.colors.tint }]}>
              {state.isEditing ? l('done') : l('edit')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={state.bookmarks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 12,
    marginRight: 8,
  },
});

