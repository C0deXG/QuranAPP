/**
 * NoteEditorView.swift → NoteEditorView.tsx
 *
 * Note editor with color picker and text input.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { FontFamily, getQuranFontSize } from '../../fonts';
import { FontSize } from '../../../model/quran-text';
import { NoteColor } from '../../../model/quran-annotations';
import { NoteCircle } from './NoteCircle';
import { sortedNoteColors, getNoteColorValue } from './NoteColors';
import type { EditableNote } from './EditableNote';

// ============================================================================
// NoteEditorView Component
// ============================================================================

export interface NoteEditorViewProps {
  /** The note being edited */
  note: EditableNote;
  /** Called when note text changes */
  onNoteChange: (text: string) => void;
  /** Called when color changes */
  onColorChange: (color: NoteColor) => void;
  /** Called when done editing */
  onDone: () => void;
  /** Called when delete is pressed */
  onDelete: () => Promise<void>;
}

/**
 * Note editor with color picker and text input.
 */
export function NoteEditorView({
  note,
  onNoteChange,
  onColorChange,
  onDone,
  onDelete,
}: NoteEditorViewProps) {
  const theme = useTheme();
  const textInputRef = useRef<TextInput>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Auto-focus if note is empty
  useEffect(() => {
    if (note.note.trim().length === 0) {
      setIsEditing(true);
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }, []);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleBackgroundPress = () => {
    Keyboard.dismiss();
    setIsEditing(false);
  };
  
  const selectedColorValue = getNoteColorValue(note.selectedColor);
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleBackgroundPress}
        style={[styles.content, { backgroundColor: theme.colors.systemBackground }]}
      >
        {/* Header: Delete button and color picker */}
        <View style={styles.header}>
          {/* Delete button */}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            style={[styles.deleteButton, { backgroundColor: theme.colors.systemBackground }]}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={isDeleting ? theme.colors.tertiaryLabel : '#FF3B30'}
            />
          </TouchableOpacity>
          
          {/* Color picker */}
          <View style={styles.colorPicker}>
            {sortedNoteColors.map((color) => (
              <NoteCircle
                key={color}
                color={getNoteColorValue(color)}
                selected={color === note.selectedColor}
                onPress={() => onColorChange(color)}
              />
            ))}
          </View>
        </View>
        
        {/* Verse text preview */}
        <View style={styles.verseContainer}>
          <View style={[styles.verseHighlight, { backgroundColor: selectedColorValue }]} />
          <Text
            style={[
              styles.verseText,
              {
                color: theme.colors.label,
                fontFamily: FontFamily.quran,
                fontSize: getQuranFontSize(FontSize.Small),
              },
            ]}
            numberOfLines={3}
          >
            {note.ayahText}
          </Text>
        </View>
        
        {/* Note text input */}
        <ScrollView style={styles.noteContainer} keyboardShouldPersistTaps="handled">
          <TextInput
            ref={textInputRef}
            style={[
              styles.noteInput,
              {
                color: theme.colors.label,
              },
            ]}
            value={note.note}
            onChangeText={onNoteChange}
            onFocus={() => setIsEditing(true)}
            placeholder="Add your note..."
            placeholderTextColor={theme.colors.tertiaryLabel}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteButton: {
    padding: 12,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  colorPicker: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  verseHighlight: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  verseText: {
    flex: 1,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 32,
  },
  noteContainer: {
    flex: 1,
  },
  noteInput: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    minHeight: 100,
  },
});

