/**
 * Core AppMigrator
 *
 * Translated from quran-ios/Core/AppMigrator
 * Provides app version tracking and migration system.
 */

// App version types and updater
export {
  type AppVersion,
  type LaunchVersionUpdate,
  AppVersionUpdater,
  sameVersion,
  firstLaunch,
  versionUpdate,
  getOldVersion,
  getCurrentVersion,
  compareVersions,
  isVersionOlder,
  isVersionNewer,
} from './app-version-updater';

// App migrator
export {
  type Migrator,
  type MigrationStatus,
  AppMigrator,
  noMigration,
  migrateStatus,
  createMigrator,
  createFirstLaunchMigrator,
  createUpdateMigrator,
} from './app-migrator';

