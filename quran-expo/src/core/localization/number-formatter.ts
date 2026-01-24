/**
 * NumberFormatter+Extension.swift → number-formatter.ts
 *
 * Number formatting utilities translated from quran-ios Core/Localization
 * Created by Mohamed Afifi on 5/1/16.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as Localization from 'expo-localization';

/**
 * Number formatter configuration
 */
export interface NumberFormatterOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
}

/**
 * Creates a number formatter with the given options.
 */
function createFormatter(options: NumberFormatterOptions = {}): Intl.NumberFormat {
  const locale = options.locale || getFixedLocale();

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
    useGrouping: options.useGrouping ?? true,
    style: options.style || 'decimal',
    currency: options.currency,
  });
}

/**
 * Gets the device locale with Latin numbers (removes @numbers=latn suffix).
 * Equivalent to Swift's fixedLocaleNumbers().
 */
export function getFixedLocale(): string {
  try {
    const locale = Localization.locale;
    const latinSuffix = '@numbers=latn';

    if (!locale) {
      return 'en-US';
    }

    if (locale.endsWith(latinSuffix)) {
      return locale.replace(latinSuffix, '');
    }

    // Validate the locale is usable
    try {
      new Intl.NumberFormat(locale);
      return locale;
    } catch {
      // If the locale is not valid, extract language code and try that
      const langCode = locale.split(/[-_]/)[0];
      return langCode || 'en-US';
    }
  } catch {
    return 'en-US';
  }
}

/**
 * Shared number formatter using the device's locale.
 */
const sharedFormatter = createFormatter();

/**
 * Arabic number formatter.
 */
const arabicFormatter = createFormatter({ locale: 'ar-SA' });

/**
 * Number formatter singleton class.
 * Equivalent to Swift's NumberFormatter.shared.
 */
export class NumberFormatter {
  private formatter: Intl.NumberFormat;

  constructor(options: NumberFormatterOptions = {}) {
    this.formatter = createFormatter(options);
  }

  /**
   * Formats a number to a localized string.
   *
   * @param value - The number to format
   * @returns The formatted string
   */
  format(value: number): string {
    return this.formatter.format(value);
  }

  /**
   * Shared instance using device locale.
   */
  static readonly shared = new NumberFormatter();

  /**
   * Arabic number formatter instance.
   */
  static readonly arabic = new NumberFormatter({ locale: 'ar-SA' });

  /**
   * Alias for arabic for backward compatibility.
   */
  static readonly arabicNumberFormatter = NumberFormatter.arabic;
}

/**
 * Shared number formatter instance.
 */
export const sharedNumberFormatter = NumberFormatter.shared;

/**
 * Arabic number formatter instance.
 */
export const arabicNumberFormatter = NumberFormatter.arabic;

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Formats a number using the shared formatter.
 *
 * @param value - The number to format
 * @returns The formatted string
 *
 * @example
 * formatNumber(1234) // "1,234" in English, "١٬٢٣٤" in Arabic
 */
export function formatNumber(value: number): string {
  return NumberFormatter.shared.format(value);
}

/**
 * Formats a number using Arabic numerals.
 *
 * @param value - The number to format
 * @returns The formatted string with Arabic numerals
 *
 * @example
 * formatArabicNumber(123) // "١٢٣"
 */
export function formatArabicNumber(value: number): string {
  return NumberFormatter.arabic.format(value);
}

/**
 * Formats a number as a percentage.
 *
 * @param value - The number to format (0-1 for 0%-100%)
 * @param locale - Optional locale
 * @returns The formatted percentage string
 */
export function formatPercent(value: number, locale?: string): string {
  const formatter = createFormatter({
    locale,
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}

/**
 * Formats bytes to a human-readable string.
 *
 * @param bytes - Number of bytes
 * @returns Human-readable size string
 *
 * @example
 * formatBytes(1024) // "1 KB"
 * formatBytes(1048576) // "1 MB"
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formatter = createFormatter({
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  return `${formatter.format(size)} ${units[unitIndex]}`;
}

/**
 * Formats a duration in seconds to a time string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted time string (e.g., "1:23:45" or "23:45")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(hours.toString());
    parts.push(minutes.toString().padStart(2, '0'));
  } else {
    parts.push(minutes.toString());
  }

  parts.push(secs.toString().padStart(2, '0'));

  return parts.join(':');
}

/**
 * Parses a localized number string to a number.
 *
 * @param str - The localized number string
 * @param locale - Optional locale (defaults to device locale)
 * @returns The parsed number, or NaN if invalid
 */
export function parseNumber(str: string, locale?: string): number {
  // Get the decimal separator for the locale
  const formatter = createFormatter({ locale });
  const parts = formatter.formatToParts(1.1);
  const decimalSeparator = parts.find(p => p.type === 'decimal')?.value || '.';
  const groupSeparator = parts.find(p => p.type === 'group')?.value || ',';

  // Remove group separators and replace decimal separator with .
  const normalized = str
    .replace(new RegExp(`\\${groupSeparator}`, 'g'), '')
    .replace(new RegExp(`\\${decimalSeparator}`), '.');

  return parseFloat(normalized);
}

/**
 * Ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 *
 * @param n - The number
 * @param locale - Optional locale
 * @returns The number with ordinal suffix
 */
export function formatOrdinal(n: number, locale?: string): string {
  // Use Intl.PluralRules for proper ordinal handling
  const pr = new Intl.PluralRules(locale || Localization.locale, { type: 'ordinal' });
  const suffixes: Record<string, string> = {
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th',
  };

  const rule = pr.select(n);
  const suffix = suffixes[rule] || suffixes.other;

  return `${n}${suffix}`;
}

