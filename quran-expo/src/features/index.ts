/**
 * Features Layer - Application features and business logic
 *
 * Translated from quran-ios/Features
 *
 * This layer contains:
 * - Feature modules (Home, Quran, Search, Settings, etc.)
 * - Navigation coordinators
 * - ViewModels and Interactors
 * - Feature-specific builders
 */

// Features Support (base utilities)
export * from './features-support';

// App Dependencies (DI container)
export * from './app-dependencies';

// App Migration Feature
export * from './app-migration-feature';

// App Structure Feature
export * from './app-structure-feature';

// Home Feature
export * from './home-feature';

// Bookmarks Feature
export * from './bookmarks-feature';

// Notes Feature
export * from './notes-feature';

// Note Editor Feature
export * from './note-editor-feature';

// Search Feature
export * from './search-feature';

// Settings Feature
export * from './settings-feature';

// Translations Feature
export * from './translations-feature';

// Reading Selector Feature
export * from './reading-selector-feature';

// Reciter List Feature
export * from './reciter-list-feature';

// Audio Banner Feature
export * from './audio-banner-feature';

// Advanced Audio Options Feature
// Note: Some exports conflict with audio-banner-feature, import directly if needed
export {
  AdvancedAudioOptionsScreen,
  AdvancedAudioOptionsBuilder,
} from './advanced-audio-options-feature';

// Audio Downloads Feature
// Note: Some exports conflict, import directly if needed
export {
  AudioDownloadsScreen,
  AudioDownloadsBuilder,
  AudioDownloadsViewModel,
} from './audio-downloads-feature';

// Ayah Menu Feature
export * from './ayah-menu-feature';

// More Menu Feature
export * from './more-menu-feature';

// Quran Content Feature
// Note: Some exports conflict, import directly if needed
export {
  ContentViewModel,
  ContentBuilder,
} from './quran-content-feature';

// Quran Image Feature
export * from './quran-image-feature';

// Quran Pages Feature
// Note: Some exports conflict, import directly if needed
export {
  QuranPagesBuilder,
} from './quran-pages-feature';

// Quran Translation Feature
// Note: Some exports conflict, import directly if needed
export {
  ContentTranslationView,
  ContentTranslationViewModel,
} from './quran-translation-feature';

// Quran View Feature (CENTRAL - Main Quran reading screen)
export * from './quran-view-feature';

// Translation Verse Feature
export * from './translation-verse-feature';

// What's New Feature
export * from './whats-new-feature';

// Word Pointer Feature (CRITICAL - Word-by-word translation)
export * from './word-pointer-feature';

