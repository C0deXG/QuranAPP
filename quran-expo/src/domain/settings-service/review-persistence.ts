/**
 * ReviewPersistence.swift → review-persistence.ts
 *
 * Persistence for app review tracking.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey, Preferences } from '../../core/preferences';
import type { PreferenceTransformer } from '../../core/preferences';

// ============================================================================
// Preference Keys
// ============================================================================

const appOpenedCounterKey = new PreferenceKey<number>(
  'appOpenedCounter',
  0
);

const appInstalledDateKey = new PreferenceKey<number>(
  'appInstalledDate',
  0
);

const requestReviewDateKey = new PreferenceKey<number | null>(
  'requestReviewDate',
  null
);

// ============================================================================
// Transformers
// ============================================================================

/**
 * Transforms between timestamp and Date.
 */
const dateTransformer: PreferenceTransformer<number, Date> = {
  rawToValue: (raw: number): Date => new Date(raw * 1000),
  valueToRaw: (value: Date): number => value.getTime() / 1000,
};

/**
 * Transforms between optional timestamp and optional Date.
 */
const optionalDateTransformer: PreferenceTransformer<number | null, Date | null> = {
  rawToValue: (raw: number | null): Date | null => 
    raw !== null ? new Date(raw * 1000) : null,
  valueToRaw: (value: Date | null): number | null => 
    value !== null ? value.getTime() / 1000 : null,
};

// ============================================================================
// ReviewPersistence
// ============================================================================

/**
 * Persistence for app review tracking.
 */
class ReviewPersistenceImpl {
  private static _instance: ReviewPersistenceImpl | null = null;

  static get shared(): ReviewPersistenceImpl {
    if (!ReviewPersistenceImpl._instance) {
      ReviewPersistenceImpl._instance = new ReviewPersistenceImpl();
    }
    return ReviewPersistenceImpl._instance;
  }

  private constructor() {}

  /**
   * Gets the app opened counter.
   */
  get appOpenedCounter(): number {
    return Preferences.shared.get(appOpenedCounterKey);
  }

  /**
   * Sets the app opened counter.
   */
  set appOpenedCounter(value: number) {
    Preferences.shared.set(appOpenedCounterKey, value);
  }

  /**
   * Gets the app installed date.
   */
  get appInstalledDate(): Date {
    const raw = Preferences.shared.get(appInstalledDateKey);
    return dateTransformer.rawToValue(raw);
  }

  /**
   * Sets the app installed date.
   */
  set appInstalledDate(value: Date) {
    const raw = dateTransformer.valueToRaw(value);
    Preferences.shared.set(appInstalledDateKey, raw);
  }

  /**
   * Gets the last request review date.
   */
  get requestReviewDate(): Date | null {
    const raw = Preferences.shared.get(requestReviewDateKey);
    return optionalDateTransformer.rawToValue(raw);
  }

  /**
   * Sets the last request review date.
   */
  set requestReviewDate(value: Date | null) {
    const raw = optionalDateTransformer.valueToRaw(value);
    Preferences.shared.set(requestReviewDateKey, raw);
  }
}

export const ReviewPersistence = ReviewPersistenceImpl;

