/**
 * AnnotationsService - User annotations management
 *
 * Translated from quran-ios/Domain/AnnotationsService
 *
 * This module provides:
 * - Last page tracking and updates
 * - Page bookmark management
 * - Notes and highlights management
 * - Quran highlights state management
 * - Analytics events for annotations
 */

// Analytics Events
export {
  logHighlightEvent,
  logUnhighlightEvent,
  logUpdateNoteEvent,
} from './analytics-events';

// Last Page Service
export {
  LastPageService,
  createLastPageService,
} from './last-page-service';

// Last Page Updater
export {
  LastPageUpdater,
  createLastPageUpdater,
} from './last-page-updater';

// Page Bookmark Service
export {
  PageBookmarkService,
  createPageBookmarkService,
} from './page-bookmark-service';

// Note Service
export {
  NoteService,
  createNoteService,
} from './note-service';

// Quran Highlights Service
export {
  QuranHighlightsService,
  getQuranHighlightsService,
  createQuranHighlightsService,
} from './quran-highlights-service';

