/**
 * ContentImageBuilder.swift → content-image-builder.ts
 *
 * Builder for the Content Image feature.
 *
 * Quran.com. All rights reserved.
 */

import * as LegacyFS from 'expo-file-system/legacy';
import { logger } from '../../core/logging';
import type { Page, Reading } from '../../model/quran-kit';
import type { AppDependencies } from '../app-dependencies';
import { ReadingPreferences } from '../../domain/reading-service';
import { ImageDataService } from '../../domain/image-service';
import type { QuranHighlightsService } from '../../domain/annotations-service';
import { ContentImageViewModel } from './content-image-view-model';

// ============================================================================
// Reading Extensions
// ============================================================================

/**
 * Get the ayah info database path for a reading.
 */
function ayahInfoDatabase(reading: Reading, directory: string): string {
  switch (reading) {
    case 'hafs_1405':
      return `${directory}/images_1920/databases/ayahinfo_1920.db`;
    case 'hafs_1421':
      return `${directory}/images_1120/databases/ayahinfo_1120.db`;
    case 'hafs_1440':
      return `${directory}/images_1352/databases/ayahinfo_1352.db`;
    case 'tajweed':
      return `${directory}/images_1280/databases/ayahinfo_1280.db`;
    default:
      return `${directory}/images_1920/databases/ayahinfo_1920.db`;
  }
}

/**
 * Get the images directory path for a reading.
 */
function imagesDirectory(reading: Reading, directory: string): string {
  switch (reading) {
    case 'hafs_1405':
      return `${directory}/images_1920/width_1920`;
    case 'hafs_1421':
      return `${directory}/images_1120/width_1120`;
    case 'hafs_1440':
      return `${directory}/images_1352/width_1352`;
    case 'tajweed':
      return `${directory}/images_1280/width_1280`;
    default:
      return `${directory}/images_1920/width_1920`;
  }
}

/**
 * Get the crop insets for a reading.
 *
 * TODO: Add cropInsets back if needed.
 */
function cropInsets(reading: Reading): { top: number; left: number; bottom: number; right: number } {
  switch (reading) {
    case 'hafs_1405':
      return { top: 0, left: 0, bottom: 0, right: 0 };
    // return { top: 10, left: 34, bottom: 40, right: 24 };
    case 'hafs_1421':
      return { top: 0, left: 0, bottom: 0, right: 0 };
    case 'hafs_1440':
      return { top: 0, left: 0, bottom: 0, right: 0 };
    case 'tajweed':
      return { top: 0, left: 0, bottom: 0, right: 0 };
    default:
      return { top: 0, left: 0, bottom: 0, right: 0 };
  }
}

// ============================================================================
// ContentImageBuilder
// ============================================================================

/**
 * Builder for the Content Image feature.
 *
 * 1:1 translation of iOS ContentImageBuilder.
 */
export class ContentImageBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly container: AppDependencies;
  private readonly highlightsService: QuranHighlightsService;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(container: AppDependencies, highlightsService: QuranHighlightsService) {
    this.container = container;
    this.highlightsService = highlightsService;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the ContentImageViewModel for a page.
   */
  build(page: Page): ContentImageViewModel {
    const reading = ReadingPreferences.shared.reading;
    const imageService = ContentImageBuilder.buildImageDataService(reading, this.container);

    return new ContentImageViewModel(
      reading,
      page,
      imageService,
      this.highlightsService
    );
  }

  // ============================================================================
  // Static Methods
  // ============================================================================

  /**
   * Build an ImageDataService for a reading.
   */
  static buildImageDataService(reading: Reading, container: AppDependencies): ImageDataService {
    const readingDirectory = ContentImageBuilder.readingDirectory(reading, container);

    return new ImageDataService(
      container.ayahInfoDatabase,
      imagesDirectory(reading, readingDirectory)
    );
  }

  /**
   * Get the directory for a reading.
   */
  private static readingDirectory(reading: Reading, container: AppDependencies): string {
    const remoteResource = container.remoteResources?.resource(reading);
    const remotePath = remoteResource?.downloadDestination;

    // Try to get bundled path if remote is not available
    const bundlePath = ContentImageBuilder.getBundlePath(reading);

    if (remoteResource && remotePath) {
      logger.info(`Images: Use remote for reading ${reading}`);
      return remotePath;
    } else {
      logger.info(`Images: Use bundle for reading ${reading}`);
      return bundlePath;
    }
  }

  /**
   * Get the bundled path for a reading.
   */
  private static getBundlePath(reading: Reading): string {
    // In Expo, bundled assets are typically accessed differently
    // For now, return the document directory path where resources should be
    const documentDir = LegacyFS.documentDirectory ?? '';

    switch (reading) {
      case 'hafs_1405':
        return `${documentDir}readings/hafs_1405`;
      case 'hafs_1421':
        return `${documentDir}readings/hafs_1421`;
      case 'hafs_1440':
        return `${documentDir}readings/hafs_1440`;
      case 'tajweed':
        return `${documentDir}readings/tajweed`;
      default:
        return `${documentDir}readings/hafs_1405`;
    }
  }
}

