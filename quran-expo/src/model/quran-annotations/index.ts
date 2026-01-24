/**
 * QuranAnnotations - User annotation models
 *
 * Translated from quran-ios/Model/QuranAnnotations
 *
 * This module provides:
 * - Last page tracking
 * - Page bookmarks
 * - Notes and highlights
 * - Highlight state management
 */

// Last page
export type { LastPage } from './last-page';
export {
  createLastPage,
  createLastPageNow,
  updateLastPageModified,
  lastPageId,
  lastPagesEqual,
  compareLastPagesByModified,
} from './last-page';

// Page bookmark
export type { PageBookmark } from './page-bookmark';
export {
  createPageBookmark,
  createPageBookmarkNow,
  pageBookmarkId,
  pageBookmarksEqual,
  comparePageBookmarksByDate,
  comparePageBookmarksByPage,
} from './page-bookmark';

// Note
export type { Note } from './note';
export {
  NoteColor,
  ALL_NOTE_COLORS,
  noteColorHex,
  noteColorName,
  createNote,
  createNoteNow,
  noteFirstVerse,
  updateNoteText,
  updateNoteColor,
  noteContainsVerse,
  notesEqual,
  compareNotesByModified,
  compareNotesByVerse,
} from './note';

// Quran highlights
export type { QuranHighlights } from './quran-highlights';
export {
  createQuranHighlights,
  createQuranHighlightsWithValues,
  ayahKey,
  setReadingVerses,
  setShareVerses,
  setSearchVerses,
  setNoteForVerse,
  removeNoteForVerse,
  setPointedWord,
  clearHighlights,
  needsScrolling,
  firstScrollingVerse,
  verseToScrollTo,
  quranHighlightsEqual,
} from './quran-highlights';

