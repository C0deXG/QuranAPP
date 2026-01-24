/**
 * Localizations.swift → localization.ts
 *
 * Localization service translated from quran-ios Core/Localization
 * Created by Mohamed Afifi on 4/13/18.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2018 Quran.com
 */

import * as Localization from 'expo-localization';
import i18next, { TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locale files
import en from './locales/en.json';
import ar from './locales/ar.json';

/**
 * Supported languages
 */
export type Language = 'ar' | 'en' | 'de' | 'es' | 'fa' | 'fr' | 'kk' | 'ms' | 'nl' | 'pt' | 'ru' | 'tr' | 'ug' | 'uz' | 'vi' | 'zh';

/**
 * Translation tables/namespaces
 */
export type TranslationTable = 'common' | 'android' | 'suras' | 'readers';

/**
 * All available resources
 */
const resources = {
  en: {
    common: en.common,
    android: en.android,
    suras: en.suras,
    readers: en.readers,
  },
  ar: {
    common: ar.common,
    android: ar.android,
    suras: ar.suras,
    readers: ar.readers,
  },
};

/**
 * Default fallback language
 */
const DEFAULT_LANGUAGE = 'en';

/**
 * Detect device language and get the best match
 */
function getDeviceLanguage(): Language {
  try {
    const locale = Localization.locale;
    
    // Handle undefined or null locale
    if (!locale) {
      return DEFAULT_LANGUAGE as Language;
    }
    
    const languageCode = locale.split('-')[0] as Language;

    // Check if we support this language
    if (languageCode in resources) {
      return languageCode;
    }
  } catch {
    // Fallback on any error
  }

  return DEFAULT_LANGUAGE as Language;
}

/**
 * Initialize i18next
 */
export async function initLocalization(): Promise<TFunction> {
  return i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: getDeviceLanguage(),
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: 'common',
      ns: ['common', 'android', 'suras', 'readers'],

      // Use v3 compatibility for React Native (no Intl.PluralRules needed)
      compatibilityJSON: 'v3',

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      // React Native doesn't need HTML escaping
      react: {
        useSuspense: false,
      },
    });
}

/**
 * Gets the current language
 */
export function getCurrentLanguage(): Language {
  return (i18next.language || DEFAULT_LANGUAGE) as Language;
}

/**
 * Sets the current language
 */
export async function setLanguage(language: Language): Promise<void> {
  await i18next.changeLanguage(language);
}

/**
 * Checks if the current language is RTL
 */
export function isRTL(): boolean {
  const rtlLanguages: Language[] = ['ar', 'fa', 'ug'];
  return rtlLanguages.includes(getCurrentLanguage());
}

/**
 * Gets a localized string.
 * Equivalent to Swift's l() function.
 *
 * @param key - The translation key
 * @param table - The translation table (namespace)
 * @param language - Optional specific language
 * @returns The localized string
 *
 * @example
 * l('button.done') // "Done" in English, "تم" in Arabic
 * l('sura_names[0]', 'suras') // "Al-Fātihah"
 */
export function l(
  key: string,
  table: TranslationTable = 'common',
  language?: Language
): string {
  const options: { lng?: string; ns: string } = { ns: table };

  if (language) {
    options.lng = language;
  }

  const result = i18next.t(key, options);

  // If not found and not already English, try English fallback
  if (result === key && !language && getCurrentLanguage() !== 'en') {
    return i18next.t(key, { ...options, lng: 'en' });
  }

  return result;
}

/**
 * Gets a formatted localized string with arguments.
 * Equivalent to Swift's lFormat() function.
 *
 * @param key - The translation key
 * @param table - The translation table
 * @param language - Optional specific language
 * @param args - Format arguments
 * @returns The formatted localized string
 *
 * @example
 * lFormat('translation.text.ayah-number', 'common', undefined, 2, 255)
 * // Returns "2:255"
 */
export function lFormat(
  key: string,
  tableOrArg?: TranslationTable | string | number,
  languageOrArg?: Language | string | number,
  ...args: (string | number)[]
): string {
  // Detect if second argument is a format arg (number) rather than table
  if (typeof tableOrArg === 'number' || (typeof tableOrArg === 'string' && !isTranslationTable(tableOrArg))) {
    // Called as lFormat(key, ...args)
    const allArgs: (string | number)[] = [];
    if (tableOrArg !== undefined) allArgs.push(tableOrArg);
    if (languageOrArg !== undefined) allArgs.push(languageOrArg as string | number);
    allArgs.push(...args);
    const template = l(key, 'common');
    return formatString(template, allArgs);
  }
  
  // Called as lFormat(key, table, language?, ...args)
  const table: TranslationTable = tableOrArg ?? 'common';
  const language = typeof languageOrArg === 'string' && languageOrArg.length === 2 ? languageOrArg as Language : undefined;
  const template = l(key, table, language);
  
  // If languageOrArg wasn't actually a language, treat it as an arg
  const formatArgs = (language === undefined && languageOrArg !== undefined) 
    ? [languageOrArg as string | number, ...args] 
    : args;
  return formatString(template, formatArgs);
}

// Helper to check if a string is a valid TranslationTable
function isTranslationTable(value: string): value is TranslationTable {
  return ['common', 'android', 'suras', 'readers'].includes(value);
}

/**
 * Gets a localized string from the Android table.
 * Equivalent to Swift's lAndroid() function.
 *
 * @param key - The translation key
 * @param language - Optional specific language
 * @returns The localized string
 */
export function lAndroid(key: string, language?: Language): string {
  return l(key, 'android', language);
}

/**
 * Gets a localized string from a specific table.
 * Equivalent to the %%table:key%% pattern in What's New.
 *
 * @param key - The translation key
 * @param table - The translation table
 * @param language - Optional specific language
 * @returns The localized string
 */
export function lTable(key: string, table: TranslationTable, language?: Language): string {
  return l(key, table, language);
}

/**
 * Gets a sura name by index.
 *
 * @param index - Sura index (0-113)
 * @param language - Optional specific language
 * @returns The sura name
 */
export function getSuraName(index: number, language?: Language): string {
  return l(`sura_names[${index}]`, 'suras', language);
}

/**
 * Gets a sura translation name by index.
 *
 * @param index - Sura index (0-113)
 * @param language - Optional specific language
 * @returns The sura translation name
 */
export function getSuraTranslation(index: number, language?: Language): string {
  return l(`sura_names_translation[${index}]`, 'suras', language);
}

/**
 * Gets an Arabic sura name by sura number (1-114).
 *
 * @param suraNumber - Sura number (1-114)
 * @returns The Arabic sura name
 */
export function getArabicSuraName(suraNumber: number): string {
  return l(`sura_names[${suraNumber - 1}]`, 'suras', 'ar');
}

/**
 * Gets a reciter name by key.
 *
 * @param key - Reciter key (e.g., "qari_afasy_gapless")
 * @param language - Optional specific language
 * @returns The reciter name
 */
export function getReciterName(key: string, language?: Language): string {
  return l(key, 'readers', language);
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Formats a string with printf-style placeholders.
 * Supports %@, %d, %s, %1$@, %2$d, etc.
 */
function formatString(template: string, args: (string | number)[]): string {
  let argIndex = 0;

  return template.replace(/%(\d+\$)?([ds@])/g, (match, position, type) => {
    // Handle positional arguments like %1$@, %2$d
    let index: number;
    if (position) {
      index = parseInt(position) - 1;
    } else {
      index = argIndex++;
    }

    if (index >= args.length) {
      return match;
    }

    const value = args[index];

    switch (type) {
      case 'd':
        return typeof value === 'number' ? value.toString() : String(value);
      case 's':
      case '@':
        return String(value);
      default:
        return match;
    }
  });
}

/**
 * Gets all supported languages
 */
export function getSupportedLanguages(): Language[] {
  return Object.keys(resources) as Language[];
}

/**
 * Checks if a language is supported
 */
export function isLanguageSupported(language: string): language is Language {
  return language in resources;
}

