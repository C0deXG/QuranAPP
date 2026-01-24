/**
 * AppStructureFeature/Tabs - Tab definitions
 *
 * Translated from quran-ios/Features/AppStructureFeature/Tabs
 *
 * This module provides:
 * - Tab configurations and interactors for all 5 main tabs
 * - HomeTab, BookmarksTab, NotesTab, SearchTab, SettingsTab
 */

// Home Tab
export {
  HOME_TAB_CONFIG,
  getHomeTabLabel,
  HomeTabInteractor,
  HomeTabBuilder,
} from './home-tab';

// Bookmarks Tab
export {
  BOOKMARKS_TAB_CONFIG,
  getBookmarksTabLabel,
  BookmarksTabInteractor,
  BookmarksTabBuilder,
} from './bookmarks-tab';

// Notes Tab
export {
  NOTES_TAB_CONFIG,
  getNotesTabLabel,
  NotesTabInteractor,
  NotesTabBuilder,
} from './notes-tab';

// Search Tab
export {
  SEARCH_TAB_CONFIG,
  getSearchTabLabel,
  SearchTabInteractor,
  SearchTabBuilder,
} from './search-tab';

// Settings Tab
export {
  SETTINGS_TAB_CONFIG,
  getSettingsTabLabel,
  SettingsTabInteractor,
  SettingsTabBuilder,
} from './settings-tab';

// ============================================================================
// All Tab Configs
// ============================================================================

import { HOME_TAB_CONFIG } from './home-tab';
import { BOOKMARKS_TAB_CONFIG } from './bookmarks-tab';
import { NOTES_TAB_CONFIG } from './notes-tab';
import { SEARCH_TAB_CONFIG } from './search-tab';
import { SETTINGS_TAB_CONFIG } from './settings-tab';
import type { TabConfig } from '../common';

/**
 * All tab configurations in order.
 * Matches the iOS tab order.
 */
export const ALL_TAB_CONFIGS: TabConfig[] = [
  HOME_TAB_CONFIG,
  NOTES_TAB_CONFIG,
  BOOKMARKS_TAB_CONFIG,
  SEARCH_TAB_CONFIG,
  SETTINGS_TAB_CONFIG,
];

