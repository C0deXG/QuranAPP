/**
 * TimeAgo.swift → time-ago.ts
 *
 * Date formatting utilities for relative time display.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Constants
// ============================================================================

/** Milliseconds in one day */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days before switching to full date format */
const DAYS_THRESHOLD = 30;

// ============================================================================
// Time Ago
// ============================================================================

/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "yesterday").
 * If the date is more than 30 days ago, returns the full date string.
 *
 * @param date The date to format
 * @param locale Optional locale for formatting (defaults to device locale)
 * @returns A localized relative time string
 */
export function timeAgo(date: Date, locale?: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / MS_PER_DAY;

  // If over 30 days, use full date format
  if (diffDays > DAYS_THRESHOLD) {
    return formatFullDate(date, locale);
  }

  // Use relative time formatter
  return formatRelativeTime(date, now, locale);
}

/**
 * Formats a date as a full date string.
 */
export function formatFullDate(date: Date, locale?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return date.toDateString();
  }
}

/**
 * Formats a date as a relative time string.
 */
export function formatRelativeTime(date: Date, relativeTo: Date, locale?: string): string {
  const diffMs = relativeTo.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffDays >= 7) {
      return rtf.format(-diffWeeks, 'week');
    } else if (diffDays >= 1) {
      return rtf.format(-diffDays, 'day');
    } else if (diffHours >= 1) {
      return rtf.format(-diffHours, 'hour');
    } else if (diffMinutes >= 1) {
      return rtf.format(-diffMinutes, 'minute');
    } else {
      return rtf.format(-diffSeconds, 'second');
    }
  } catch {
    // Fallback for older JavaScript engines
    return formatRelativeTimeFallback(diffSeconds, diffMinutes, diffHours, diffDays);
  }
}

/**
 * Fallback relative time formatting without Intl.RelativeTimeFormat.
 */
function formatRelativeTimeFallback(
  diffSeconds: number,
  diffMinutes: number,
  diffHours: number,
  diffDays: number
): string {
  if (diffDays >= 7) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'last week' : `${weeks} weeks ago`;
  } else if (diffDays >= 1) {
    return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
  } else if (diffHours >= 1) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMinutes >= 1) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else {
    return 'just now';
  }
}

// ============================================================================
// Date Extension Functions
// ============================================================================

/**
 * Checks if two dates are on the same day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Checks if a date is today.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Checks if a date is yesterday.
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

