/**
 * TranslationItem.swift → translation-item.ts
 *
 * Translation item model with download progress.
 *
 * Quran.com. All rights reserved.
 */

import type { Translation } from '../../model/quran-text';

// ============================================================================
// DownloadingProgress
// ============================================================================

/**
 * Progress state for a translation download.
 */
export type DownloadingProgress =
  | { type: 'notDownloading' }
  | { type: 'downloading'; progress: number }
  | { type: 'needsUpgrade' };

/**
 * Factory functions for DownloadingProgress.
 */
export const DownloadingProgress = {
  notDownloading(): DownloadingProgress {
    return { type: 'notDownloading' };
  },
  downloading(progress: number): DownloadingProgress {
    return { type: 'downloading', progress };
  },
  needsUpgrade(): DownloadingProgress {
    return { type: 'needsUpgrade' };
  },
};

// ============================================================================
// TranslationItem
// ============================================================================

/**
 * Translation item with download progress.
 *
 * 1:1 translation of iOS TranslationItem.
 */
export interface TranslationItem {
  /** The translation info */
  info: Translation;
  /** The download progress */
  progress: DownloadingProgress;
}

/**
 * Create a TranslationItem.
 */
export function createTranslationItem(
  info: Translation,
  progress: DownloadingProgress = DownloadingProgress.notDownloading()
): TranslationItem {
  return { info, progress };
}

/**
 * Get the unique ID for a TranslationItem.
 */
export function getTranslationItemId(item: TranslationItem): number {
  return item.info.id;
}

/**
 * Check if two TranslationItems are equal.
 */
export function translationItemsEqual(a: TranslationItem, b: TranslationItem): boolean {
  return a.info.id === b.info.id;
}

// ============================================================================
// Translation Extensions
// ============================================================================

/**
 * Get the localized language name for a translation.
 */
export function getLocalizedLanguage(translation: Translation): string | null {
  return localizedLanguageForCode(translation.languageCode);
}

/**
 * Get the localized language name for a language code.
 */
export function localizedLanguageForCode(code: string): string | null {
  try {
    const displayNames = new Intl.DisplayNames([code], { type: 'language' });
    return displayNames.of(code) ?? null;
  } catch {
    return null;
  }
}

// ============================================================================
// TranslationItem Helpers
// ============================================================================

/**
 * Get the display name from a TranslationItem.
 */
export function getDisplayName(item: TranslationItem): string {
  return item.info.displayName;
}

/**
 * Get the language code from a TranslationItem.
 */
export function getLanguageCode(item: TranslationItem): string {
  return item.info.languageCode;
}

/**
 * Get the localized language from a TranslationItem.
 */
export function getItemLocalizedLanguage(item: TranslationItem): string | null {
  return getLocalizedLanguage(item.info);
}

