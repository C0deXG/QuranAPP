/**
 * AppWhatsNewVersionStore.swift → app-whats-new-version-store.ts
 *
 * Storage for what's new version tracking.
 *
 * Quran.com. All rights reserved.
 */

import { usePreference, PreferenceKey, Preferences } from '../../core/preferences';

// ============================================================================
// Preference Key
// ============================================================================

const whatsNewVersionKey = new PreferenceKey<string | null>(
  'whats-new.seen-version',
  null
);

// ============================================================================
// AppWhatsNewVersionStore
// ============================================================================

/**
 * Storage for tracking which what's new version has been seen.
 *
 * 1:1 translation of iOS AppWhatsNewVersionStore.
 */
export class AppWhatsNewVersionStore {
  // ============================================================================
  // Properties
  // ============================================================================

  private _lastSeenVersion: string | null = null;
  private initialized = false;

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Check if a version has been seen.
   * Note: In iOS this always returns false (in-memory store behavior).
   */
  has(version: string): boolean {
    return false;
  }

  /**
   * Get the last seen version.
   */
  get lastSeenVersion(): string | null {
    return this._lastSeenVersion;
  }

  /**
   * Set the last seen version.
   */
  async setVersion(version: string): Promise<void> {
    this._lastSeenVersion = version;
    await Preferences.shared.set(whatsNewVersionKey, version);
  }

  /**
   * Load the stored version from preferences.
   */
  async load(): Promise<void> {
    if (this.initialized) return;

    this._lastSeenVersion = await Preferences.shared.get(whatsNewVersionKey);
    this.initialized = true;
  }
}

// ============================================================================
// Hook for React Components
// ============================================================================

/**
 * Hook to get and set the last seen what's new version.
 */
export function useWhatsNewVersion(): {
  lastSeenVersion: string | null;
  setVersion: (version: string) => Promise<void>;
} {
  const [lastSeenVersion, setLastSeenVersion] = usePreference(whatsNewVersionKey);

  const setVersion = async (version: string): Promise<void> => {
    await setLastSeenVersion(version);
  };

  return { lastSeenVersion, setVersion };
}

