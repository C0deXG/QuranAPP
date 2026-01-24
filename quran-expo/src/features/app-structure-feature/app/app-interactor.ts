/**
 * AppInteractor.swift → app-interactor.ts
 *
 * Main app interactor that handles app-level logic.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../../core/logging';
import { crasher } from '../../../core/crashing';
import type { AnalyticsLibrary } from '../../../core/analytics';
import type { LastPagePersistence } from '../../../data/last-page-persistence';
import type { TabBuildable } from '../common';

// ============================================================================
// CloudKit Status
// ============================================================================

/**
 * Status of CloudKit operations.
 */
enum CloudKitStatus {
  ok = 'ok',
  fail = 'fail',
  error = 'error',
}

// ============================================================================
// Analytics Extensions
// ============================================================================

/**
 * Log CloudKit logged-in status.
 */
function logCloudkitLoggedIn(analytics: AnalyticsLibrary, status: CloudKitStatus): void {
  analytics.logEvent('cloudkitLoggedIn', status);
}

/**
 * Log CloudKit last pages match status.
 */
function logCloudkitLastPagesMatch(analytics: AnalyticsLibrary, status: CloudKitStatus): void {
  analytics.logEvent('cloudkitLastPagesMatch', status);
}

// ============================================================================
// AppPresenter Interface
// ============================================================================

/**
 * Interface for the app presenter (tab bar controller).
 * In React Native, this is the Tab Navigator.
 */
export interface AppPresenter {
  /**
   * Set the tab view controllers.
   * In React Native, this configures the tab navigator screens.
   *
   * @param tabs - Array of tab builders
   * @param animated - Whether to animate the change
   */
  setViewControllers(tabs: TabBuildable[], animated: boolean): void;
}

// ============================================================================
// AppInteractor
// ============================================================================

/**
 * Main app interactor that handles app-level logic.
 *
 * 1:1 translation of iOS AppInteractor.
 */
export class AppInteractor {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Reference to the presenter (tab bar) */
  presenter: AppPresenter | null = null;

  private readonly supportsCloudKit: boolean;
  private readonly analytics: AnalyticsLibrary;
  private readonly tabs: TabBuildable[];
  private readonly lastPagePersistence: LastPagePersistence;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    supportsCloudKit: boolean,
    analytics: AnalyticsLibrary,
    lastPagePersistence: LastPagePersistence,
    tabs: TabBuildable[]
  ) {
    this.supportsCloudKit = supportsCloudKit;
    this.analytics = analytics;
    this.lastPagePersistence = lastPagePersistence;
    this.tabs = tabs;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start the app interactor.
   * Sets up the view controllers and checks CloudKit status.
   */
  start(): void {
    // Set view controllers
    this.presenter?.setViewControllers(this.tabs, false);

    // Check CloudKit status (if supported)
    if (!this.supportsCloudKit) {
      return;
    }

    // Log CloudKit logged-in status after a delay
    setTimeout(() => {
      this.logIsLoggedIntoCloudKit();
    }, 10000);
  }

  /**
   * Get the tabs for the app.
   */
  getTabs(): TabBuildable[] {
    return this.tabs;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Check if the user is logged into CloudKit.
   *
   * Note: CloudKit is not available in React Native.
   * This is a placeholder that logs a message.
   * For Expo, you would need to use a different cloud sync solution.
   */
  private async logIsLoggedIntoCloudKit(): Promise<void> {
    // CloudKit is not available in React Native/Expo
    // For production, you would check your cloud sync status here
    // For now, we log that we're skipping this check

    logger.info('CloudKit check skipped - not available in React Native');

    // In a real implementation, you might check your own cloud service:
    // try {
    //   const isLoggedIn = await checkCloudSyncStatus();
    //   logCloudkitLoggedIn(this.analytics, isLoggedIn ? CloudKitStatus.ok : CloudKitStatus.fail);
    //   if (isLoggedIn) {
    //     await this.logLastPagesMatch();
    //   }
    // } catch (error) {
    //   logger.error(`Error while checking account status: ${error}`);
    //   logCloudkitLoggedIn(this.analytics, CloudKitStatus.error);
    // }
  }

  /**
   * Check if local last pages match cloud last pages.
   *
   * Note: CloudKit is not available in React Native.
   * This is a placeholder for future cloud sync implementation.
   */
  private async logLastPagesMatch(): Promise<void> {
    // CloudKit is not available in React Native/Expo
    // For production, you would compare local and cloud last pages here

    try {
      const cdLastPages = await this.lastPagePersistence.retrieveAll();
      logger.debug(`Local last pages count: ${cdLastPages.length}`);

      // In a real implementation:
      // const cloudLastPages = await fetchCloudLastPages();
      // const localPages = new Set(cdLastPages.map(p => p.page));
      // const cloudPages = new Set(cloudLastPages);
      // const inSync = [...localPages].every(p => cloudPages.has(p));
      // logCloudkitLastPagesMatch(this.analytics, inSync ? CloudKitStatus.ok : CloudKitStatus.fail);
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to retrieve last pages from persistence.');
    }
  }
}

