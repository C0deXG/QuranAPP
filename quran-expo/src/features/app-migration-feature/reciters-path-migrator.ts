/**
 * RecitersPathMigrator.swift → reciters-path-migrator.ts
 *
 * Migrates reciter audio folders from old naming scheme to Android-compatible paths.
 *
 * Quran.com. All rights reserved.
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Migrator, LaunchVersionUpdate } from '../../core/app-migrator';
import { audioFilesPath } from '../../model/quran-audio';
import { l } from '../../core/localization';

// ============================================================================
// RecitersPathMigrator
// ============================================================================

/**
 * Migrator that moves reciter folders from old paths to Android-compatible paths.
 * This ensures consistency across platforms.
 *
 * 1:1 translation of iOS RecitersPathMigrator.
 */
export class RecitersPathMigrator implements Migrator {
  // ============================================================================
  // Migrator Protocol
  // ============================================================================

  /** Whether this migration blocks the UI */
  readonly blocksUI: boolean = true;

  /** Title to show during migration */
  get uiTitle(): string | null {
    return l('update.filesystem.title');
  }

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() {}

  // ============================================================================
  // Execute
  // ============================================================================

  /**
   * Execute the migration.
   *
   * @param update - The version update information
   */
  async execute(update: LaunchVersionUpdate): Promise<void> {
    await this.arrangeFiles();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Arrange reciter folders by moving them to Android-compatible paths.
   */
  private async arrangeFiles(): Promise<void> {
    // Move reciters to Android paths
    // reciter_saad_al_ghamidi_gapless
    await this.move('18', 'sa3d_alghamidi');
    // reciter_afasy_cali_gapless
    await this.move('mishari_alafasy_cali', 'mishari_cali');
    // reciter_ajamy_gapless
    await this.move('ahmed_al3ajamy', 'ahmed_alajamy');
    // reciter_muaiqly_gapless
    await this.move('maher_al_muaiqly', 'muaiqly_kfgqpc');
  }

  /**
   * Move a reciter folder from old path to new path.
   *
   * @param sourcePath - Old folder name
   * @param destinationPath - New folder name
   */
  private async move(sourcePath: string, destinationPath: string): Promise<void> {
    const audioFilesBase = audioFilesPath();
    const source = audioFilesBase.appendingPathComponent(sourcePath, true);
    const destination = audioFilesBase.appendingPathComponent(destinationPath, true);

    try {
      // Create destination directory if needed
      const destinationDir = destination.url.substring(0, destination.url.lastIndexOf('/'));
      await LegacyFS.makeDirectoryAsync(destinationDir, { intermediates: true });
    } catch {
      // Ignore if directory already exists
    }

    try {
      // Move the directory
      await LegacyFS.moveAsync({ from: source.url, to: destination.url });
    } catch {
      // Ignore move errors (source may not exist)
    }
  }
}
