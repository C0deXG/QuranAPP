/**
 * AppMigrationFeature - App migration logic
 *
 * Translated from quran-ios/Features/AppMigrationFeature
 *
 * This module provides:
 * - FileSystemMigrator - Migrates database and audio files
 * - RecitersPathMigrator - Migrates reciter folder paths
 * - MigrationScreen - UI shown during migration
 */

// Migrators
export { FileSystemMigrator } from './file-system-migrator';
export { RecitersPathMigrator } from './reciters-path-migrator';

// UI
export { MigrationScreen, type MigrationScreenProps } from './MigrationScreen';

