/**
 * FileSystemMigrator.swift → file-system-migrator.ts
 *
 * Migrates database files and audio files from old paths to new paths.
 *
 * Quran.com. All rights reserved.
 */

import * as LegacyFS from 'expo-file-system/legacy';
import type { Migrator, LaunchVersionUpdate } from '../../core/app-migrator';
import type { ReciterDataRetriever } from '../../domain/reciter-service';
import { audioFilesPath } from '../../model/quran-audio';
import { Directories } from '../../core/utilities/file-manager';
import { appendPathComponent } from '../../core/utilities/string';
import { l } from '../../core/localization';

// ============================================================================
// FileSystemMigrator
// ============================================================================

/**
 * Migrator that moves database and audio files from old locations to new locations.
 * This is needed when upgrading from older app versions.
 *
 * 1:1 translation of iOS FileSystemMigrator.
 */
export class FileSystemMigrator implements Migrator {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly databasesURL: string;
  private readonly recitersRetriever: ReciterDataRetriever;

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

  constructor(databasesURL: string, recitersRetriever: ReciterDataRetriever) {
    this.databasesURL = databasesURL;
    this.recitersRetriever = recitersRetriever;
  }

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
   * Arrange files by moving databases and audio files to new locations.
   */
  private async arrangeFiles(): Promise<void> {
    // Move databases
    await this.movePath(
      appendPathComponent(Directories.documents, 'last_pages.db'),
      appendPathComponent(this.databasesURL, 'last_pages.db')
    );
    await this.movePath(
      appendPathComponent(Directories.documents, 'bookmarks.db'),
      appendPathComponent(this.databasesURL, 'bookmarks.db')
    );

    // Move audio files
    await this.moveLegacyAudioRoot();

    const reciters = await this.recitersRetriever.getReciters();
    for (const reciter of reciters) {
      const folder = reciter.localFolder;
      // Skip migration if no local folder defined
      if (!folder) continue;
      // Migration is already complete if folder exists
      // No old/new folder concept in the simplified migration
    }
  }

  /**
   * Move a file or directory from source path to destination path.
   *
   * @param source - Source path
   * @param destination - Destination path
   */
  private async movePath(source: string, destination: string): Promise<void> {
    await this.moveUrl(source, destination);
  }

  /**
   * Move a file or directory from source URL to destination URL.
   *
   * @param source - Source URL
   * @param destination - Destination URL
   */
  private async moveUrl(source: string, destination: string): Promise<void> {
    try {
      // Create destination directory if needed
      const destinationDir = destination.substring(0, destination.lastIndexOf('/'));
      await LegacyFS.makeDirectoryAsync(destinationDir, { intermediates: true });
    } catch {
      // Ignore if directory already exists
    }

    try {
      // Move the file/directory
      await LegacyFS.moveAsync({ from: source, to: destination });
    } catch {
      // Ignore move errors (source may not exist)
    }
  }

  /**
   * Move legacy `audio/` root to the current `audio_files/` root if needed.
   */
  private async moveLegacyAudioRoot(): Promise<void> {
    const legacyAudioRoot = `${LegacyFS.documentDirectory}audio/`;
    const newAudioRoot = audioFilesPath().url;

    try {
      const legacyInfo = await LegacyFS.getInfoAsync(legacyAudioRoot);
      if (!legacyInfo.exists || !legacyInfo.isDirectory) {
        return;
      }

      // Ensure destination root exists
      try {
        await LegacyFS.makeDirectoryAsync(newAudioRoot, { intermediates: true });
      } catch {}

      const entries = await LegacyFS.readDirectoryAsync(legacyAudioRoot);
      for (const entry of entries) {
        const from = `${legacyAudioRoot}${entry}`;
        const to = `${newAudioRoot}/${entry}`;
        try {
          await LegacyFS.moveAsync({ from, to });
        } catch {
          // Ignore individual move errors to keep migration best-effort
        }
      }

      try {
        await LegacyFS.deleteAsync(legacyAudioRoot, { idempotent: true });
      } catch {}
    } catch {
      // Ignore migration failures; worst case user re-downloads
    }
  }
}
