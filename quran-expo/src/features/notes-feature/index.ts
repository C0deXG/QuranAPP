/**
 * NotesFeature - Notes list
 *
 * Translated from quran-ios/Features/NotesFeature
 *
 * This module provides:
 * - NotesBuilder for creating the notes screen
 * - NotesViewModel for managing notes state
 * - NotesScreen component for rendering
 * - NoteItem data model
 */

// Note Item
export {
  type NoteItem,
  createNoteItem,
  getNoteItemId,
  noteItemsEqual,
} from './note-item';

// View Model
export {
  NotesViewModel,
  type NotesViewState,
  initialNotesViewState,
} from './notes-view-model';

// Screen
export { NotesScreen, type NotesScreenProps } from './NotesScreen';

// Builder
export { NotesBuilder } from './notes-builder';

