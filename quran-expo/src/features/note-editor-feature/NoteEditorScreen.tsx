/**
 * NoteEditorViewController.swift → NoteEditorScreen.tsx
 *
 * Note editor screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { l } from '../../core/localization';
import { logger } from '../../core/logging';
import { useTheme } from '../../ui/theme';
import { NoteEditorView } from '../../ui/features/note';
import type { NoteColor } from '../../model/quran-annotations';
import {
  NoteEditorInteractor,
  type NoteEditorState,
  type NoteEditorListener,
} from './note-editor-interactor';

// ============================================================================
// Types
// ============================================================================

export interface NoteEditorScreenProps {
  interactor: NoteEditorInteractor;
  onDismiss: () => void;
}

// ============================================================================
// NoteEditorScreen Component
// ============================================================================

export function NoteEditorScreen({ interactor, onDismiss }: NoteEditorScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<NoteEditorState>(interactor.state);

  // Subscribe to interactor updates
  useEffect(() => {
    setState(interactor.state);
    interactor.addListener(setState);

    // Set up the listener
    const listener: NoteEditorListener = {
      dismissNoteEditor: onDismiss,
    };
    interactor.listener = listener;

    // Fetch the note
    interactor.fetchNote().catch(() => {
      // Error is handled in state
    });

    return () => {
      interactor.removeListener(setState);
      interactor.listener = null;
    };
  }, [interactor, onDismiss]);

  // Show error alert
  useEffect(() => {
    if (state.error) {
      Alert.alert(
        l('error'),
        state.error.message,
        [{ text: l('ok'), onPress: () => interactor.clearError() }]
      );
    }
  }, [state.error, interactor]);

  // Handle done
  const handleDone = useCallback(async () => {
    await interactor.commitEditsAndExit();
  }, [interactor]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    logger.info('NoteEditor: delete note');

    if (interactor.isEditedNote) {
      logger.info('NoteEditor: confirm note deletion');
      Alert.alert(
        l('notes.delete.title'),
        l('notes.delete.confirm'),
        [
          { text: l('cancel'), style: 'cancel' },
          {
            text: l('delete'),
            style: 'destructive',
            onPress: async () => {
              await interactor.forceDelete();
            },
          },
        ]
      );
    } else {
      // Delete highlight directly
      await interactor.forceDelete();
    }
  }, [interactor]);

  // Handle note change
  const handleNoteChange = useCallback(
    (note: string) => {
      interactor.updateNote(note);
    },
    [interactor]
  );

  // Handle color change
  const handleColorChange = useCallback(
    (color: NoteColor) => {
      interactor.updateColor(color);
    },
    [interactor]
  );

  // Loading state
  if (state.isLoading || !state.editableNote) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.systemBackground }]}>
        <ActivityIndicator size="large" color={theme.colors.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        {/* Modified time */}
        <Text style={[styles.modifiedText, { color: theme.colors.secondaryLabel }]}>
          {state.editableNote.modifiedSince}
        </Text>

        {/* Done Button */}
        <TouchableOpacity
          onPress={handleDone}
          style={styles.doneButton}
          disabled={state.isSaving}
        >
          {state.isSaving ? (
            <ActivityIndicator size="small" color={theme.colors.tint} />
          ) : (
            <Text style={[styles.doneButtonText, { color: theme.colors.tint }]}>
              {l('done')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Note Editor */}
      <NoteEditorView
        note={state.editableNote}
        onNoteChange={handleNoteChange}
        onColorChange={handleColorChange}
        onDone={handleDone}
        onDelete={handleDelete}
      />
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modifiedText: {
    fontSize: 14,
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

