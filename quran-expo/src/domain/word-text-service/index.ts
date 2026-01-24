/**
 * WordTextService - Word-by-word text service
 *
 * Translated from quran-ios/Domain/WordTextService
 *
 * This module provides:
 * - Word text preferences (translation vs transliteration)
 * - Word text service for retrieving word-by-word text
 */

export {
  WordTextPreferences,
  wordTextTypeKey,
  useWordTextType,
} from './word-text-preferences';

export {
  WordTextService,
  createWordTextService,
} from './word-text-service';

