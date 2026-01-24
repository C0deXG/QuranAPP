/**
 * NotesView.swift + NotesViewController.swift → NotesScreen.tsx
 *
 * Notes screen component showing user notes.
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
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l, lFormat } from '../../core/localization';
import { NumberFormatter } from '../../core/localization';
import { useTheme } from '../../ui/theme';
import { NoorListItem, DataUnavailableView } from '../../ui/components';
import { timeAgo } from '../../ui/formatters';
import { noteColorToHex, QuranHighlights } from '../../model/quran-annotations';
import type { NoteItem } from './note-item';
import { getNoteItemId } from './note-item';
import {
  NotesViewModel,
  type NotesViewState,
} from './notes-view-model';

// ============================================================================
// Types
// ============================================================================

export interface NotesScreenProps {
  viewModel: NotesViewModel;
}

// ============================================================================
// NotesScreen Component
// ============================================================================

export function NotesScreen({ viewModel }: NotesScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<NotesViewState>(viewModel.state);

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

  // Handle note selection
  const handleSelectNote = useCallback(
    (item: NoteItem) => {
      viewModel.navigateTo(item);
    },
    [viewModel]
  );

  // Handle note deletion
  const handleDeleteNote = useCallback(
    (item: NoteItem) => {
      Alert.alert(
        l('delete'),
        l('notes.delete.confirm'),
        [
          { text: l('cancel'), style: 'cancel' },
          {
            text: l('delete'),
            style: 'destructive',
            onPress: () => viewModel.deleteItem(item),
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

  // Handle share all notes
  const handleShareNotes = useCallback(async () => {
    try {
      const notesText = await viewModel.prepareNotesForSharing();
      await Share.share({ message: notesText });
    } catch (error) {
      Alert.alert(l('error'), (error as Error).message);
    }
  }, [viewModel]);

  // Render note item
  const renderItem = useCallback(
    ({ item }: { item: NoteItem }) => {
      const note = item.note;
      const ayah = note.firstVerse;
      const page = ayah.page;
      const localizedVerse = note.firstVerse.localizedName;
      const arabicSuraName = note.firstVerse.sura.arabicSuraName;
      const ayahCount = note.verses.size;
      const numberOfAyahs = ayahCount > 1 ? lFormat('notes.verses-count', ayahCount - 1) : '';
      const colorHex = noteColorToHex(note.color);
      const numberFormatter = NumberFormatter.shared;

      return (
        <View style={styles.itemContainer}>
          <NoorListItem
            subheading={`${localizedVerse} ${arabicSuraName} ${numberOfAyahs}`}
            rightPretitle={item.verseText}
            rightPretitleColor={colorHex}
            title={note.note?.trim() ?? ''}
            subtitle={{ text: timeAgo(note.modifiedDate), location: 'bottom' }}
            accessory={{ type: 'text', text: numberFormatter.format(page.pageNumber) }}
            onPress={() => handleSelectNote(item)}
          />
          {state.isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteNote(item)}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.systemRed} />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [theme, state.isEditing, handleSelectNote, handleDeleteNote]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: NoteItem) => getNoteItemId(item),
    []
  );

  // Render empty state
  if (!state.isLoading && state.notes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.label }]}>
            {l('tab.notes')}
          </Text>
        </View>

        <DataUnavailableView
          title={l('notes.no-data.title')}
          text={l('notes.no-data.text')}
          image="document-text"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.label }]}>
          {l('tab.notes')}
        </Text>
        <View style={styles.headerButtons}>
          {state.notes.length > 0 && (
            <>
              {/* Share Button */}
              <TouchableOpacity
                onPress={handleShareNotes}
                style={styles.headerButton}
                disabled={state.isSharing}
              >
                {state.isSharing ? (
                  <ActivityIndicator size="small" color={theme.colors.tint} />
                ) : (
                  <Ionicons name="share-outline" size={22} color={theme.colors.tint} />
                )}
              </TouchableOpacity>

              {/* Edit Button */}
              <TouchableOpacity onPress={handleToggleEdit} style={styles.editButton}>
                <Text style={[styles.editButtonText, { color: theme.colors.tint }]}>
                  {state.isEditing ? l('done') : l('edit')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={state.notes}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
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

