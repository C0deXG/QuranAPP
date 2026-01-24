/**
 * AppWhatsNewController.swift → app-whats-new-controller.ts
 *
 * Controller for what's new display.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import type { AnalyticsLibrary } from '../../core/analytics';
import { whatsNewData } from './whats-new-data';
import type { WhatsNewVersion, AppWhatsNew } from './app-whats-new';
import { AppWhatsNewVersionStore } from './app-whats-new-version-store';

// ============================================================================
// AppWhatsNewController
// ============================================================================

/**
 * Controller for what's new display.
 *
 * 1:1 translation of iOS AppWhatsNewController.
 */
export class AppWhatsNewController {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly analytics: AnalyticsLibrary;
  private readonly store: AppWhatsNewVersionStore;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(analytics: AnalyticsLibrary) {
    this.analytics = analytics;
    this.store = new AppWhatsNewVersionStore();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Check if what's new should be presented.
   *
   * @returns Versions to show, or empty array if nothing to show
   */
  async getVersionsToPresent(): Promise<WhatsNewVersion[]> {
    await this.store.load();
    const lastSeenVersion = this.store.lastSeenVersion;

    const whatsNew = this.loadWhatsNew();
    const versions = this.getWhatsNewVersions(lastSeenVersion, whatsNew);

    if (versions.length > 0) {
      return versions;
    }

    logger.info('Ignoring whats new');
    return [];
  }

  /**
   * Mark the versions as seen.
   */
  async markAsSeen(versions: WhatsNewVersion[]): Promise<void> {
    if (versions.length === 0) return;

    // Get the latest version
    const latestVersion = versions.reduce((latest, current) => {
      return this.compareVersions(current.version, latest.version) > 0 ? current : latest;
    });

    await this.store.setVersion(latestVersion.version);

    // Log analytics
    this.logPresentWhatsNew(versions.map((v) => v.version));

    logger.info('WhatsNew continue button tapped');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Load what's new data.
   */
  private loadWhatsNew(): AppWhatsNew {
    return {
      versions: whatsNewData,
    };
  }

  /**
   * Get versions to show after a given last seen version.
   */
  private getWhatsNewVersions(
    lastSeen: string | null,
    whatsNew: AppWhatsNew
  ): WhatsNewVersion[] {
    if (!lastSeen) {
      return whatsNew.versions;
    }

    return whatsNew.versions.filter(
      (v) => this.compareVersions(v.version, lastSeen) > 0
    );
  }

  /**
   * Compare two version strings numerically.
   *
   * @returns >0 if a > b, <0 if a < b, 0 if equal
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;

      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }

    return 0;
  }

  /**
   * Log what's new presentation analytics.
   */
  private logPresentWhatsNew(versions: string[]): void {
    this.analytics.logEvent('PresentingWhatsNew', versions.join(','));
  }
}

