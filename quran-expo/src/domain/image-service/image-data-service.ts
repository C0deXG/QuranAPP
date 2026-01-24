/**
 * ImageDataService.swift → image-data-service.ts
 *
 * Service for loading page images and word frame data.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as LegacyFS from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import { getPageImage } from '@/assets/images/quran_pages';
import type { IPage } from '../../model/quran-kit/types';
import type {
  ImagePage,
  WordFrameCollection,
  SuraHeaderLocation,
  AyahNumberLocation,
} from '../../model/quran-geometry';
import { createImagePage, wordAtLocation } from '../../model/quran-geometry';
import type { WordFramePersistence } from '../../data/word-frame-persistence';
import { SQLiteWordFramePersistence, createWordFramePersistence } from '../../data/word-frame-persistence';
import { WordFrameProcessor } from '../word-frame-service';
import { createLogger } from '../../core/logging';
import { fixedDigitString } from '../../core/utilities/number';
import { lastPathComponent } from '../../core/utilities/string';

const logger = createLogger('ImageDataService');

// ============================================================================
// ImageDataService
// ============================================================================

/**
 * Service for loading page images and associated word frame data.
 */
export class ImageDataService {
  private readonly imagesPath: string;
  private readonly ayahInfoDatabasePath: string;
  private persistencePromise?: Promise<WordFramePersistence>;
  private readonly processor: WordFrameProcessor;
  private ayahInfoReadyPromise?: Promise<void>;

  /**
   * Creates a new ImageDataService.
   * @param ayahInfoDatabasePath Path to the ayah info SQLite database
   * @param imagesPath Path to the directory containing page images
   */
  constructor(ayahInfoDatabasePath: string, imagesPath: string) {
    this.imagesPath = imagesPath;
    this.ayahInfoDatabasePath = ayahInfoDatabasePath;
    this.processor = new WordFrameProcessor();
  }

  /**
   * Gets sura header locations for a page.
   */
  async suraHeaders(page: IPage): Promise<SuraHeaderLocation[]> {
    const persistence = await this.getPersistence();
    return persistence.suraHeaders(page, (suraNumber) => {
      return page.quran?.suras.find((s) => s.suraNumber === suraNumber) ?? null;
    });
  }

  /**
   * Gets ayah number locations for a page.
   */
  async ayahNumbers(page: IPage): Promise<AyahNumberLocation[]> {
    const persistence = await this.getPersistence();
    return persistence.ayahNumbers(page, (sura, ayah) => {
      return page.quran?.verses.find(
        (v) => v.sura.suraNumber === sura && v.ayah === ayah
      ) ?? null;
    });
  }

  /**
   * Loads the image and word frames for a page.
   */
  async imageForPage(page: IPage): Promise<ImagePage> {
    const persistence = await this.getPersistence();
    const imageUri = this.imageUriForPage(page);

    // Resolve the bundled asset dimensions (matches iOS UIImage(contentsOfFile:)).
    const resolvedAsset = Image.resolveAssetSource(getPageImage(page.pageNumber));
    const resolvedUri = resolvedAsset?.uri ?? imageUri;
    const resolvedWidth = resolvedAsset?.width ?? 1920;
    const resolvedHeight = resolvedAsset?.height ?? 3106;

    // Verify image exists (optional); if missing, assume bundled asset and avoid noisy warnings
    const imageInfo = await LegacyFS.getInfoAsync(imageUri);
    if (!imageInfo.exists) {
      logger.info(`No local image file found for page '${page.pageNumber}' at ${imageUri}. Using bundled asset.`);
    }

    // Get word frames
    const wordFrames = await this.wordFrames(page, persistence);
    // Add helper method for callers expecting wordAtLocation on the collection.
    if (wordFrames && !(wordFrames as any).wordAtLocation) {
      (wordFrames as any).wordAtLocation = (point: any, scale: any) =>
        wordAtLocation(wordFrames as any, point, scale);
    }

    // Diagnostic logging
    if (wordFrames) {
      const lines = (wordFrames as any).lines;
      if (Array.isArray(lines)) {
        logger.info(`[DEBUG] Loaded ${lines.length} lines for page ${page.pageNumber}`);
      }
    }

    // Coordinates in the database are based on the 1920-width mushaf dataset (max coords ~1887x3068, PNG size 1920x3106).
    // Use the actual source dimensions so scaling matches the iOS reference.
    return createImagePage({
      imageUri: resolvedUri,
      image: {
        uri: resolvedUri,
        width: resolvedWidth,
        height: resolvedHeight
      },
      wordFrames: wordFrames ?? { lines: [] } as any,
      startAyah: page.firstVerse,
    });
  }

  /**
   * Gets processed word frames for a page.
   */
  async wordFrames(page: IPage, persistence?: WordFramePersistence): Promise<WordFrameCollection> {
    const effectivePersistence = persistence ?? (await this.getPersistence());
    try {
      const plainWordFrames = await effectivePersistence.wordFrameCollectionForPage(
        page,
        (verse, wordNumber) => {
          // Create a word from the verse and word number
          return { verse, wordNumber } as any;
        }
      );
      return this.processor.processWordFrames(plainWordFrames);
    } catch (error) {
      logger.warning(`Failed to load word frames for page ${page.pageNumber}: ${error}`);
      // Return empty collection on error
      return { lines: [] } as any;
    }
  }

  /**
   * Gets the image URI for a page.
   */
  private imageUriForPage(page: IPage): string {
    const pageStr = fixedDigitString(page.pageNumber, 3);
    return `${this.imagesPath}page${pageStr}.png`;
  }

  /**
   * Logs the files in a directory for debugging.
   */
  private async logFiles(directory: string): Promise<void> {
    try {
      const info = await LegacyFS.getInfoAsync(directory);
      if (!info.exists) {
        logger.error(`Images: Directory ${directory} does not exist`);
        return;
      }

      const files = await LegacyFS.readDirectoryAsync(directory);
      logger.error(`Images: Directory ${directory} contains files ${files.join(', ')}`);
    } catch (error) {
      logger.error(`Images: Error reading directory ${directory}`, { error });
    }
  }

  /**
   * Gets the parent path of a directory.
   */
  private getParentPath(path: string): string {
    // Remove trailing slash if present
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const lastSlash = cleanPath.lastIndexOf('/');
    return lastSlash !== -1 ? cleanPath.substring(0, lastSlash + 1) : path;
  }

  /**
   * Lazily prepares and returns the word frame persistence, ensuring the ayah info DB is present and valid.
   */
  private async getPersistence(): Promise<WordFramePersistence> {
    if (!this.persistencePromise) {
      this.persistencePromise = (async () => {
        await this.ensureAyahInfoDatabase();
        return createWordFramePersistence(this.ayahInfoDatabasePath);
      })();
    }
    return this.persistencePromise;
  }

  /**
   * Ensures ayahinfo.db exists and has the glyphs table. If missing/corrupt, re-copy from bundled assets.
   */
  private async ensureAyahInfoDatabase(): Promise<void> {
    if (this.ayahInfoReadyPromise) {
      return this.ayahInfoReadyPromise;
    }

    this.ayahInfoReadyPromise = (async () => {
      const expectedSize = 1_000_000; // sanity threshold
      const dbPath = this.ayahInfoDatabasePath;
      const sqlitePath = dbPath.startsWith('file://') ? dbPath.replace('file://', '') : dbPath;
      const dbName = lastPathComponent(sqlitePath);

      const hasGlyphsTable = async (): Promise<boolean> => {
        try {
          // Use filename so expo-sqlite looks in its default SQLite directory on iOS
          const db = await SQLite.openDatabaseAsync(dbName);
          const result = await db.getAllAsync(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='glyphs'"
          );
          await db.closeAsync();
          return result.length > 0;
        } catch {
          return false;
        }
      };

      const copyFromBundle = async () => {
        const asset = Asset.fromModule(require('../../../assets/databases/ayahinfo.db'));
        await asset.downloadAsync();
        const parent = this.getParentPath(dbPath);
        try {
          await LegacyFS.makeDirectoryAsync(parent, { intermediates: true });
        } catch {
          // ignore
        }
        if (asset.localUri) {
          await LegacyFS.copyAsync({ from: asset.localUri, to: dbPath });
        } else {
          throw new Error('ayahinfo.db asset localUri missing');
        }
      };

      try {
        const info = await LegacyFS.getInfoAsync(dbPath);
        const sizeOk = info.exists && (info.size ?? 0) >= expectedSize;
        if (!sizeOk || !(await hasGlyphsTable())) {
          await LegacyFS.deleteAsync(dbPath, { idempotent: true });
          await copyFromBundle();
        }
      } catch {
        await copyFromBundle();
      }

      // Final verification; log if still bad to avoid crashing UI.
      if (!(await hasGlyphsTable())) {
        logger.error('ayahinfo.db is missing glyphs table after restore');
      }
    })();

    return this.ayahInfoReadyPromise;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an image data service.
 */
export function createImageDataService(
  ayahInfoDatabasePath: string,
  imagesPath: string
): ImageDataService {
  return new ImageDataService(ayahInfoDatabasePath, imagesPath);
}
