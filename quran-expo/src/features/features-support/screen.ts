/**
 * Analytics.Screen.swift → screen.ts
 *
 * Screen enum for analytics tracking.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Screen Enum
// ============================================================================

/**
 * Enum representing all screens in the app for analytics tracking.
 * Maps 1:1 with iOS Screen enum.
 */
export enum Screen {
  // Home tabs
  Suras = 'suras',
  Juzs = 'juzs',
  Bookmarks = 'bookmarks',
  Notes = 'notes',
  Settings = 'settings',

  // Search
  Search = 'search',
  SearchResults = 'searchResults',

  // Content management
  Translations = 'translations',
  AudioDownloads = 'audioDownloads',

  // Quran reading
  QuranArabic = 'quranArabic',
  QuranTranslation = 'quranTranslation',

  // Selection screens
  TranslationsSelection = 'translationsSelection',
  ReciterSelection = 'reciterSelection',

  // Menus and modals
  MoreMenu = 'moreMenu',
  AdvancedAudio = 'advancedAudio',
  ShareSheet = 'shareSheet',
  WordTranslationSelection = 'wordTranslationSelection',
  NoteEditor = 'noteEditor',
  Update = 'update',
}

