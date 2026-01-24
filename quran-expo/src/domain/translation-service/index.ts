/**
 * TranslationService - Translation management
 *
 * Translated from quran-ios/Domain/TranslationService
 *
 * This module provides:
 * - Translation preferences (selected translations)
 * - Fetching translations from API
 * - Syncing local and remote translations
 * - Downloading translation files
 * - Unzipping translation databases
 * - Deleting translations
 * - Version management
 */

// Preferences
export {
  SelectedTranslationsPreferences,
  selectedTranslationsKey,
  useSelectedTranslationIds,
} from './selected-translations-preferences';

// Parsers
export type { TranslationsParser } from './translations-parser';
export {
  JSONTranslationsParser,
  createTranslationsParser,
} from './translations-parser';

// Network
export {
  TranslationNetworkManager,
  createTranslationNetworkManager,
} from './translation-network-manager';

// Unzipper
export type { TranslationUnzipper } from './translation-unzipper';
export {
  DefaultTranslationUnzipper,
  createTranslationUnzipper,
} from './translation-unzipper';

// Version Updater
export type { VersionPersistenceFactory } from './translations-version-updater';
export {
  TranslationsVersionUpdater,
  createTranslationsVersionUpdater,
} from './translations-version-updater';

// Local Retriever
export {
  LocalTranslationsRetriever,
  createLocalTranslationsRetriever,
} from './local-translations-retriever';

// Repository
export {
  TranslationsRepository,
  createTranslationsRepository,
} from './translations-repository';

// Downloader
export {
  TranslationsDownloader,
  createTranslationsDownloader,
  findMatchingDownload,
  findMatchingTranslation,
} from './translations-downloader';

// Deleter
export {
  TranslationDeleter,
  createTranslationDeleter,
} from './translation-deleter';

