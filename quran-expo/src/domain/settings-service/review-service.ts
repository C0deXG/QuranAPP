/**
 * ReviewService.swift → review-service.ts
 *
 * Service for prompting app store reviews.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as StoreReview from 'expo-store-review';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { AnalyticsLibrary } from '../../core/analytics';
import { ReviewPersistence } from './review-persistence';

// ============================================================================
// Constants
// ============================================================================

/**
 * App Store ID for the app.
 * Note: Update this with your actual App Store ID.
 */
const APP_STORE_ID = '1118663303';

/**
 * Days after install before requesting review.
 */
const DAYS_BEFORE_REVIEW = 7;

/**
 * App opens before requesting review.
 */
const OPENS_BEFORE_REVIEW = 10;

// ============================================================================
// ReviewService
// ============================================================================

/**
 * Service for prompting app store reviews.
 */
export class ReviewService {
  private readonly analytics: AnalyticsLibrary;
  private readonly persistence = ReviewPersistence.shared;

  constructor(analytics: AnalyticsLibrary) {
    this.analytics = analytics;
  }

  /**
   * Checks if conditions are met to request a review.
   */
  async checkForReview(): Promise<void> {
    let appOpenedCounter = this.persistence.appOpenedCounter;

    if (appOpenedCounter === 0) {
      // First app open, set install date
      this.persistence.appInstalledDate = new Date();
    } else {
      const requestReviewDate = this.persistence.requestReviewDate;

      if (requestReviewDate === null) {
        // Haven't requested review yet
        const oldDate = this.persistence.appInstalledDate;
        const today = new Date();
        const daysDiff = Math.floor(
          (today.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff >= DAYS_BEFORE_REVIEW && appOpenedCounter >= OPENS_BEFORE_REVIEW) {
          await this.requestReview();
          this.persistence.requestReviewDate = new Date();
        }
      }
    }

    // Increment counter
    appOpenedCounter += 1;
    this.persistence.appOpenedCounter = appOpenedCounter;
  }

  /**
   * Opens the app review page in the store.
   */
  async openAppReview(): Promise<void> {
    const url = this.getReviewUrl();
    
    try {
      await Linking.openURL(url);
      this.logReviewEvent(false);
    } catch {
      // Failed to open URL
    }
  }

  /**
   * Requests an in-app review.
   */
  private async requestReview(): Promise<void> {
    if (await StoreReview.isAvailableAsync()) {
      try {
        await StoreReview.requestReview();
        this.logReviewEvent(true);
      } catch {
        // Review request failed
      }
    }
  }

  /**
   * Gets the review URL for the current platform.
   */
  private getReviewUrl(): string {
    if (Platform.OS === 'ios') {
      return `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`;
    } else {
      // Android
      return `market://details?id=${this.getAndroidPackageId()}`;
    }
  }

  /**
   * Gets the Android package ID.
   * Note: Update this with your actual package ID.
   */
  private getAndroidPackageId(): string {
    // This would typically come from app config
    return 'com.quran.quranapp';
  }

  /**
   * Logs a review analytics event.
   */
  private logReviewEvent(automatic: boolean): void {
    this.analytics.logEvent('RequestReviewAutomatic', automatic.toString());
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a ReviewService.
 */
export function createReviewService(analytics: AnalyticsLibrary): ReviewService {
  return new ReviewService(analytics);
}

