/**
 * AppMigrator.swift → app-migrator.ts
 *
 * App migration system translated from quran-ios Core/AppMigrator
 * Created by Mohamed Afifi on 9/10/18.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2018 Quran.com
 */

import { SystemBundle, systemBundle } from '../system-dependencies';
import { logger } from '../logging';
import {
  AppVersion,
  AppVersionUpdater,
  LaunchVersionUpdate,
  getOldVersion,
  isVersionOlder,
} from './app-version-updater';

/**
 * Interface for migration tasks.
 * Equivalent to Swift's Migrator protocol.
 */
export interface Migrator {
  /**
   * Whether this migration blocks the UI.
   */
  readonly blocksUI: boolean;

  /**
   * UI title to show during migration (optional).
   */
  readonly uiTitle?: string;

  /**
   * Executes the migration.
   */
  execute(update: LaunchVersionUpdate): Promise<void>;
}

/**
 * Migration status.
 * Equivalent to Swift's MigrationStatus enum.
 */
export type MigrationStatus =
  | { type: 'noMigration' }
  | { type: 'migrate'; blocksUI: boolean; titles: Set<string> };

/**
 * Creates a no-migration status.
 */
export function noMigration(): MigrationStatus {
  return { type: 'noMigration' };
}

/**
 * Creates a migration status with details.
 */
export function migrateStatus(blocksUI: boolean, titles: Set<string>): MigrationStatus {
  return { type: 'migrate', blocksUI, titles };
}

/**
 * Manages app version migrations.
 * Equivalent to Swift's AppMigrator class.
 *
 * @example
 * const migrator = new AppMigrator();
 *
 * // Register migrations
 * migrator.register({
 *   blocksUI: true,
 *   uiTitle: 'Upgrading database...',
 *   execute: async (update) => {
 *     await migrateDatabase();
 *   },
 * }, '2.0.0');
 *
 * // Check if migration is needed
 * const status = await migrator.migrationStatus();
 *
 * if (status.type === 'migrate') {
 *   if (status.blocksUI) {
 *     showMigrationUI(status.titles);
 *   }
 *   await migrator.migrate();
 * }
 */
export class AppMigrator {
  private readonly updater: AppVersionUpdater;
  private migrators: Array<{ version: AppVersion; migrator: Migrator }> = [];
  private cachedLaunchVersion: LaunchVersionUpdate | null = null;

  constructor(bundle: SystemBundle = systemBundle) {
    this.updater = new AppVersionUpdater(bundle);
  }

  /**
   * Gets the launch version update.
   */
  async launchVersion(): Promise<LaunchVersionUpdate> {
    if (!this.cachedLaunchVersion) {
      this.cachedLaunchVersion = await this.updater.launchVersion();
    }
    return this.cachedLaunchVersion;
  }

  /**
   * Registers a migrator for a specific version.
   * The migrator will run when upgrading TO or PAST this version.
   *
   * @param migrator - The migration task
   * @param version - The version this migration applies to
   */
  register(migrator: Migrator, version: AppVersion): void {
    this.migrators.push({ version, migrator });
  }

  /**
   * Gets the current migration status.
   */
  async migrationStatus(): Promise<MigrationStatus> {
    const updaters = await this.getVersionUpdaters();

    if (updaters.length === 0) {
      await this.updater.commitUpdates();
      return noMigration();
    }

    const blocksUI = updaters.some((m) => m.blocksUI);
    const titles = new Set(
      updaters.map((m) => m.uiTitle).filter((t): t is string => t !== undefined)
    );

    return migrateStatus(blocksUI, titles);
  }

  /**
   * Runs all pending migrations.
   */
  async migrate(): Promise<void> {
    const launchVersion = await this.launchVersion();
    logger.notice(`Version Update: ${JSON.stringify(launchVersion)}`);

    const updaters = await this.getVersionUpdaters();

    // Run all migrations in parallel
    await Promise.all(updaters.map((migrator) => migrator.execute(launchVersion)));

    // Commit the version update
    await this.updater.commitUpdates();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Gets migrators that need to run for the current launch version.
   */
  private async getVersionUpdaters(): Promise<Migrator[]> {
    const launchVersion = await this.launchVersion();
    const oldVersion = getOldVersion(launchVersion);
    return this.getUpdatersForVersion(oldVersion);
  }

  /**
   * Gets migrators where oldVersion < migrator.version.
   */
  private getUpdatersForVersion(version: AppVersion): Migrator[] {
    return this.migrators
      .filter(({ version: migratorVersion }) => isVersionOlder(version, migratorVersion))
      .map(({ migrator }) => migrator);
  }
}

/**
 * Creates a simple migrator.
 */
export function createMigrator(
  execute: (update: LaunchVersionUpdate) => Promise<void>,
  options?: { blocksUI?: boolean; uiTitle?: string }
): Migrator {
  return {
    blocksUI: options?.blocksUI ?? false,
    uiTitle: options?.uiTitle,
    execute,
  };
}

/**
 * Creates a migrator that only runs on first launch.
 */
export function createFirstLaunchMigrator(
  execute: () => Promise<void>,
  options?: { blocksUI?: boolean; uiTitle?: string }
): Migrator {
  return {
    blocksUI: options?.blocksUI ?? false,
    uiTitle: options?.uiTitle,
    execute: async (update) => {
      if (update.type === 'firstLaunch') {
        await execute();
      }
    },
  };
}

/**
 * Creates a migrator that only runs on version update (not first launch).
 */
export function createUpdateMigrator(
  execute: (fromVersion: AppVersion, toVersion: AppVersion) => Promise<void>,
  options?: { blocksUI?: boolean; uiTitle?: string }
): Migrator {
  return {
    blocksUI: options?.blocksUI ?? false,
    uiTitle: options?.uiTitle,
    execute: async (update) => {
      if (update.type === 'update') {
        await execute(update.from, update.to);
      }
    },
  };
}

