/**
 * DiagnosticsService.swift → diagnostics-service.ts
 *
 * Service for building diagnostics data.
 *
 * Quran.com. All rights reserved.
 */

import * as LegacyFS from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../../core/logging';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of building diagnostics.
 */
export interface DiagnosticsResult {
  /** Path to the diagnostics file/directory */
  path: string;
  /** Cleanup function to remove temp files */
  cleanUp: () => Promise<void>;
}

// ============================================================================
// DiagnosticsService
// ============================================================================

/**
 * Service for building diagnostics data.
 *
 * 1:1 translation of iOS DiagnosticsService.
 */
export class DiagnosticsService {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly logsDirectory: string;
  private readonly databasesDirectory: string;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(logsDirectory: string, databasesDirectory: string) {
    this.logsDirectory = logsDirectory;
    this.databasesDirectory = databasesDirectory;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build a diagnostics package containing logs, preferences, and databases.
   */
  async buildDiagnosticsPackage(): Promise<DiagnosticsResult> {
    const cacheDir = LegacyFS.cacheDirectory;
    if (!cacheDir) {
      throw new Error('Cache directory not available');
    }

    const diagnosticsDir = `${cacheDir}diagnostics_${Date.now()}/`;

    try {
      // Create diagnostics directory
      await LegacyFS.makeDirectoryAsync(diagnosticsDir, { intermediates: true });

      // Save AsyncStorage (preferences)
      await this.saveAsyncStorage(diagnosticsDir);

      // Copy logs if they exist
      await this.copyLogs(diagnosticsDir);

      // Copy databases if they exist
      await this.copyDatabases(diagnosticsDir);

      logger.info(`Diagnostics built at ${diagnosticsDir}`);

      return {
        path: diagnosticsDir,
        cleanUp: async () => {
          logger.info('Cleaning up diagnostics.');
          try {
            await LegacyFS.deleteAsync(diagnosticsDir, { idempotent: true });
          } catch (error) {
            logger.warning('Failed to clean up diagnostics:', error);
          }
        },
      };
    } catch (error) {
      // Clean up on error
      try {
        await LegacyFS.deleteAsync(diagnosticsDir, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Get the content of all diagnostics files as a string.
   * Useful for sharing via native Share.
   */
  async getDiagnosticsContent(): Promise<string> {
    const content: string[] = [];

    // Add AsyncStorage content
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      const preferences: Record<string, string | null> = {};
      for (const [key, value] of items) {
        preferences[key] = value;
      }
      content.push('=== PREFERENCES ===');
      content.push(JSON.stringify(preferences, null, 2));
      content.push('');
    } catch (error) {
      content.push('=== PREFERENCES ===');
      content.push(`Error reading preferences: ${error}`);
      content.push('');
    }

    // Add logs content
    try {
      const logsInfo = await LegacyFS.getInfoAsync(this.logsDirectory);
      if (logsInfo.exists && logsInfo.isDirectory) {
        const files = await LegacyFS.readDirectoryAsync(this.logsDirectory);
        for (const file of files.slice(0, 5)) {
          // Limit to 5 log files
          const filePath = `${this.logsDirectory}${file}`;
          try {
            const fileContent = await LegacyFS.readAsStringAsync(filePath);
            content.push(`=== LOG: ${file} ===`);
            content.push(fileContent.slice(-10000)); // Last 10KB
            content.push('');
          } catch {
            // Skip unreadable files
          }
        }
      }
    } catch {
      // Ignore log read errors
    }

    return content.join('\n');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Save AsyncStorage content to a file.
   */
  private async saveAsyncStorage(targetDir: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      const data: Record<string, unknown> = {};

      for (const [key, value] of items) {
        if (value !== null) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      }

      const jsonContent = JSON.stringify(data, null, 2);
      const filePath = `${targetDir}AsyncStorageData.json`;
      await LegacyFS.writeAsStringAsync(filePath, jsonContent);
    } catch (error) {
      logger.warning('Failed to save AsyncStorage:', error);
    }
  }

  /**
   * Copy logs to the diagnostics directory.
   */
  private async copyLogs(targetDir: string): Promise<void> {
    try {
      const logsInfo = await LegacyFS.getInfoAsync(this.logsDirectory);
      if (logsInfo.exists && logsInfo.isDirectory) {
        const logsTargetDir = `${targetDir}logs/`;
        await LegacyFS.makeDirectoryAsync(logsTargetDir, { intermediates: true });

        const files = await LegacyFS.readDirectoryAsync(this.logsDirectory);
        for (const file of files) {
          const sourcePath = `${this.logsDirectory}${file}`;
          const targetPath = `${logsTargetDir}${file}`;
          try {
            await LegacyFS.copyAsync({ from: sourcePath, to: targetPath });
          } catch {
            // Skip files that can't be copied
          }
        }
      }
    } catch (error) {
      logger.warning('Failed to copy logs:', error);
    }
  }

  /**
   * Copy databases to the diagnostics directory.
   */
  private async copyDatabases(targetDir: string): Promise<void> {
    try {
      const dbInfo = await LegacyFS.getInfoAsync(this.databasesDirectory);
      if (dbInfo.exists && dbInfo.isDirectory) {
        const dbTargetDir = `${targetDir}databases/`;
        await LegacyFS.makeDirectoryAsync(dbTargetDir, { intermediates: true });

        const files = await LegacyFS.readDirectoryAsync(this.databasesDirectory);
        for (const file of files) {
          const sourcePath = `${this.databasesDirectory}${file}`;
          const targetPath = `${dbTargetDir}${file}`;
          try {
            await LegacyFS.copyAsync({ from: sourcePath, to: targetPath });
          } catch {
            // Skip files that can't be copied
          }
        }
      }
    } catch (error) {
      logger.warning('Failed to copy databases:', error);
    }
  }
}

