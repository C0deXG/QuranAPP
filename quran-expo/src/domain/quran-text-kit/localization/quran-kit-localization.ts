/**
 * QuranKit+Localization.swift → quran-kit-localization.ts
 *
 * Localization extensions for QuranKit types.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber, ISura, IPage, IJuz, IHizb, IQuarter } from '../../../model/quran-kit/types';
import { l, lFormat, type Language, type TranslationTable } from '../../../core/localization';
import { sharedNumberFormatter, arabicNumberFormatter } from '../../../core/localization/number-formatter';

/**
 * Table namespace for translation tables (iOS pattern compatibility).
 */
const Table = {
  common: 'common' as TranslationTable,
  android: 'android' as TranslationTable,
  suras: 'suras' as TranslationTable,
  readers: 'readers' as TranslationTable,
};

// ============================================================================
// AyahNumber Localization
// ============================================================================

/**
 * Gets localized ayah number string.
 */
export function getLocalizedAyahNumber(ayah: IAyahNumber): string {
  return lFormat('quran_ayah', Table.android, undefined, ayah.ayah);
}

/**
 * Gets localized name for an ayah (e.g., "Al-Fatihah, Ayah 1").
 */
export function getLocalizedAyahName(ayah: IAyahNumber): string {
  const suraName = getLocalizedSuraName(ayah.sura);
  return `${suraName}, ${getLocalizedAyahNumber(ayah)}`;
}

/**
 * Gets localized name with sura number (e.g., "1. Al-Fatihah - Ayah 1").
 */
export function getLocalizedAyahNameWithSuraNumber(ayah: IAyahNumber): string {
  const localizedSura = getLocalizedSuraName(ayah.sura, { withNumber: true });
  return `${localizedSura} - ${getLocalizedAyahNumber(ayah)}`;
}

// ============================================================================
// Juz Localization
// ============================================================================

/**
 * Gets localized name for a juz.
 */
export function getLocalizedJuzName(juz: IJuz): string {
  return lFormat('juz2_description', Table.android, undefined, sharedNumberFormatter.format(juz.juzNumber));
}

// ============================================================================
// Page Localization
// ============================================================================

/**
 * Gets localized name for a page.
 */
export function getLocalizedPageName(page: IPage): string {
  const pageLabel = l('quran_page', Table.android);
  return `${pageLabel} ${sharedNumberFormatter.format(page.pageNumber)}`;
}

/**
 * Gets localized page number.
 */
export function getLocalizedPageNumber(page: IPage): string {
  return sharedNumberFormatter.format(page.pageNumber);
}

/**
 * Gets localized quarter name for a page.
 */
export function getLocalizedPageQuarterName(page: IPage): string {
  const juzDescription = getLocalizedJuzName(page.startJuz);
  if (page.quarter) {
    return [juzDescription, getLocalizedQuarterName(page.quarter)].join(', ');
  }
  return juzDescription;
}

// ============================================================================
// Hizb Localization
// ============================================================================

/**
 * Gets localized name for a hizb.
 */
export function getLocalizedHizbName(hizb: IHizb): string {
  const hizbLabel = l('quran_hizb', Table.android);
  return `${hizbLabel} ${sharedNumberFormatter.format(hizb.hizbNumber)}`;
}

// ============================================================================
// Quarter Localization
// ============================================================================

/**
 * Gets localized name for a quarter.
 */
export function getLocalizedQuarterName(quarter: IQuarter): string {
  const rub = quarter.quarterNumber - 1;
  const reminder = rub % 4;

  let fraction: string | undefined;
  switch (reminder) {
    case 1:
      fraction = l('quran_rob3', Table.android);
      break;
    case 2:
      fraction = l('quran_nos', Table.android);
      break;
    case 3:
      fraction = l('quran_talt_arb3', Table.android);
      break;
    default:
      fraction = undefined;
  }

  const hizbString = getLocalizedHizbName(quarter.hizb);
  const components = [fraction, hizbString].filter((x): x is string => x !== undefined);
  return components.join(' ');
}

// ============================================================================
// Sura Localization
// ============================================================================

export interface SuraNameOptions {
  withPrefix?: boolean;
  withNumber?: boolean;
  language?: Language;
}

/**
 * Gets localized sura number.
 */
export function getLocalizedSuraNumber(sura: ISura): string {
  return sharedNumberFormatter.format(sura.suraNumber);
}

/**
 * Gets localized name for a sura.
 */
export function getLocalizedSuraName(sura: ISura, options: SuraNameOptions = {}): string {
  const { withPrefix = false, withNumber = false, language } = options;

  let suraName = l(`sura_names[${sura.suraNumber - 1}]`, Table.suras, language);

  if (withPrefix) {
    suraName = lFormat('quran_sura_title', Table.android, language, suraName);
  }

  if (withNumber) {
    suraName = `${getLocalizedSuraNumber(sura)}. ${suraName}`;
  }

  return suraName;
}

/**
 * Gets the Arabic decorated sura name using special font codepoints.
 */
export function getArabicSuraName(sura: ISura): string {
  const codePoint = DECORATED_SURAS_CODE_POINTS[sura.suraNumber - 1];
  return String.fromCodePoint(codePoint);
}

/**
 * Decorated sura name codepoints for special Quran fonts.
 */
const DECORATED_SURAS_CODE_POINTS = [
  0xe904, 0xe905, 0xe906, 0xe907, 0xe908, 0xe90b,
  0xe90c, 0xe90d, 0xe90e, 0xe90f, 0xe910, 0xe911,
  0xe912, 0xe913, 0xe914, 0xe915, 0xe916, 0xe917,
  0xe918, 0xe919, 0xe91a, 0xe91b, 0xe91c, 0xe91d,
  0xe91e, 0xe91f, 0xe920, 0xe921, 0xe922, 0xe923,
  0xe924, 0xe925, 0xe926, 0xe92e, 0xe92f, 0xe930,
  0xe931, 0xe909, 0xe90a, 0xe927, 0xe928, 0xe929,
  0xe92a, 0xe92b, 0xe92c, 0xe92d, 0xe932, 0xe902,
  0xe933, 0xe934, 0xe935, 0xe936, 0xe937, 0xe938,
  0xe939, 0xe93a, 0xe93b, 0xe93c, 0xe900, 0xe901,
  0xe941, 0xe942, 0xe943, 0xe944, 0xe945, 0xe946,
  0xe947, 0xe948, 0xe949, 0xe94a, 0xe94b, 0xe94c,
  0xe94d, 0xe94e, 0xe94f, 0xe950, 0xe951, 0xe952,
  0xe93d, 0xe93e, 0xe93f, 0xe940, 0xe953, 0xe954,
  0xe955, 0xe956, 0xe957, 0xe958, 0xe959, 0xe95a,
  0xe95b, 0xe95c, 0xe95d, 0xe95e, 0xe95f, 0xe960,
  0xe961, 0xe962, 0xe963, 0xe964, 0xe965, 0xe966,
  0xe967, 0xe968, 0xe969, 0xe96a, 0xe96b, 0xe96c,
  0xe96d, 0xe96e, 0xe96f, 0xe970, 0xe971, 0xe972,
];

