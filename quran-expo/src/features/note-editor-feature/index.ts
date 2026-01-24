/**
 * NoteEditorFeature - Note editing
 *
 * Translated from quran-ios/Features/NoteEditorFeature
 *
 * This module provides:
 * - NoteEditorBuilder for creating the note editor screen
 * - NoteEditorInteractor for managing note editing logic
 * - NoteEditorScreen component for rendering
 */

// Interactor
export {
  NoteEditorInteractor,
  type NoteEditorListener,
  type NoteEditorState,
  initialNoteEditorState,
} from './note-editor-interactor';

// Screen
export { NoteEditorScreen, type NoteEditorScreenProps } from './NoteEditorScreen';

// Builder
export { NoteEditorBuilder } from './note-editor-builder';

