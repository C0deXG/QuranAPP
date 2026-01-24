/**
 * AppVersionUpdater.swift → app-version-updater.ts
 *
 * App version tracking translated from quran-ios Core/AppMigrator
 * Created by Mohamed Afifi on 5/2/17.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PreferenceKey, Preferences } from '../preferences';
import { SystemBundle, systemBundle } from '../system-dependencies';

/**
 * App version string type.
 */
export type AppVersion = string;

/**
 * Represents the version state at app launch.
 * Equivalent to Swift's LaunchVersionUpdate enum.
 */
export type LaunchVersionUpdate =
  | { type: 'sameVersion'; version: AppVersion }
  | { type: 'firstLaunch'; version: AppVersion }
  | { type: 'update'; from: AppVersion; to: AppVersion };

/**
 * Creates a same version update.
 */
export function sameVersion(version: AppVersion): LaunchVersionUpdate {
  return { type: 'sameVersion', version };
}

/**
 * Creates a first launch update.
 */
export function firstLaunch(version: AppVersion): LaunchVersionUpdate {
  return { type: 'firstLaunch', version };
}

/**
 * Creates an update from one version to another.
 */
export function versionUpdate(from: AppVersion, to: AppVersion): LaunchVersionUpdate {
  return { type: 'update', from, to };
}

/**
 * Gets the old version from a launch version update.
 */
export function getOldVersion(update: LaunchVersionUpdate): AppVersion {
  switch (update.type) {
    case 'sameVersion':
    case 'firstLaunch':
      return update.version;
    case 'update':
      return update.from;
  }
}

/**
 * Gets the current version from a launch version update.
 */
export function getCurrentVersion(update: LaunchVersionUpdate): AppVersion {
  switch (update.type) {
    case 'sameVersion':
    case 'firstLaunch':
      return update.version;
    case 'update':
      return update.to;
  }
}

// ============================================================================
// App Version Preferences
// ============================================================================

/**
 * Preference key for storing the app version.
 */
const appVersionKey = new PreferenceKey<string | null>('appVersion', null);

/**
 * App version preferences.
 */
class AppVersionPreferences {
  private static _instance: AppVersionPreferences;

  static get shared(): AppVersionPreferences {
    if (!this._instance) {
      this._instance = new AppVersionPreferences();
    }
    return this._instance;
  }

  private constructor() {}

  /**
   * Gets the stored app version.
   */
  async getAppVersion(): Promise<string | null> {
    return Preferences.shared.getValue(appVersionKey);
  }

  /**
   * Sets the stored app version.
   */
  async setAppVersion(version: string): Promise<void> {
    await Preferences.shared.setValue(version, appVersionKey);
  }

  /**
   * Resets the stored app version (for testing).
   */
  static async reset(): Promise<void> {
    await Preferences.shared.removeValue(appVersionKey);
  }
}

// ============================================================================
// App Version Updater
// ============================================================================

/**
 * Tracks app version and determines launch type.
 * Equivalent to Swift's AppVersionUpdater struct.
 */
export class AppVersionUpdater {
  private readonly bundle: SystemBundle;
  private readonly preferences = AppVersionPreferences.shared;

  constructor(bundle: SystemBundle = systemBundle) {
    this.bundle = bundle;
  }

  /**
   * Gets the current app version from the bundle.
   */
  get currentVersion(): AppVersion {
    const version = this.bundle.infoValue<string>('CFBundleShortVersionString');
    if (!version) {
      throw new Error('CFBundleShortVersionString should be set in your app config.');
    }
    return version;
  }

  /**
   * Determines the launch version update state.
   */
  async launchVersion(): Promise<LaunchVersionUpdate> {
    const current = this.currentVersion;
    const previous = await this.preferences.getAppVersion();

    if (previous !== null) {
      if (previous === current) {
        return sameVersion(current);
      } else {
        return versionUpdate(previous, current);
      }
    } else {
      return firstLaunch(current);
    }
  }

  /**
   * Commits the current version to preferences.
   * Should be called after migrations are complete.
   */
  async commitUpdates(): Promise<void> {
    await this.preferences.setAppVersion(this.currentVersion);
  }
}

/**
 * Compares two version strings.
 * Returns:
 * - negative if a < b
 * - 0 if a === b
 * - positive if a > b
 */
export function compareVersions(a: AppVersion, b: AppVersion): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const partA = partsA[i] ?? 0;
    const partB = partsB[i] ?? 0;

    if (partA < partB) return -1;
    if (partA > partB) return 1;
  }

  return 0;
}

/**
 * Checks if version a is older than version b.
 */
export function isVersionOlder(a: AppVersion, b: AppVersion): boolean {
  return compareVersions(a, b) < 0;
}

/**
 * Checks if version a is newer than version b.
 */
export function isVersionNewer(a: AppVersion, b: AppVersion): boolean {
  return compareVersions(a, b) > 0;
}

