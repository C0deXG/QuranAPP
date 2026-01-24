/**
 * Features/Note - Note editing UI components
 *
 * Translated from quran-ios/UI/NoorUI/Features/Note
 *
 * This module provides:
 * - Note color definitions and utilities
 * - Color picker circle component
 * - Editable note state model
 * - Full note editor view
 */

// Note Colors
export {
  NoteColorValues,
  sortedNoteColors,
  getNoteColorValue,
  getNoteColorName,
} from './NoteColors';

// Note Circle (color picker)
export { NoteCircle, type NoteCircleProps } from './NoteCircle';

// Editable Note Model
export { createEditableNote, type EditableNote } from './EditableNote';

// Note Editor
export { NoteEditorView, type NoteEditorViewProps } from './NoteEditorView';

