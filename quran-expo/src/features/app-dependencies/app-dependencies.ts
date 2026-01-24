/**
 * AppDependencies.swift → app-dependencies.ts
 *
 * Dependency injection container protocol for the app.
 *
 * Quran.com. All rights reserved.
 */

import type { AnalyticsLibrary } from '../../core/analytics';
import type { DownloadManager } from '../../data/batch-downloader';
import type { LastPagePersistence } from '../../data/last-page-persistence';
import type { NotePersistence } from '../../data/note-persistence';
import type { PageBookmarkPersistence } from '../../data/page-bookmark-persistence';
import type { AuthenticationClient } from '../../data/authentication-client';
import type { ReadingResourcesService, ReadingRemoteResources } from '../../domain/reading-service';
import { QuranResources } from '../../domain/quran-resources';
import { QuranTextDataService } from '../../domain/quran-text-kit';
import { NoteService } from '../../domain/annotations-service';

// ============================================================================
// AppDependencies Interface
// ============================================================================

/**
 * Dependency injection container protocol for the app.
 * Provides access to all shared dependencies needed by features.
 *
 * This is a 1:1 translation of the iOS AppDependencies protocol.
 */
export interface AppDependencies {
  // ============================================================================
  // URL Properties
  // ============================================================================

  /** URL to the databases directory */
  readonly databasesURL: string;

  /** URL to the Quran Uthmani V2 database */
  readonly quranUthmaniV2Database: string;

  /** URL to the words database */
  readonly wordsDatabase: string;

  /** URL to the ayah info database */
  readonly ayahInfoDatabase: string;

  /** Base URL for the app API host */
  readonly appHost: string;

  /** Base URL for files API host */
  readonly filesAppHost: string;

  /** Directory for storing logs */
  readonly logsDirectory: string;

  /** Directory for storing databases */
  readonly databasesDirectory: string;

  // ============================================================================
  // Feature Flags
  // ============================================================================

  /** Whether CloudKit sync is supported */
  readonly supportsCloudKit: boolean;

  // ============================================================================
  // Services
  // ============================================================================

  /** Download manager for handling file downloads */
  readonly downloadManager: DownloadManager;

  /** Analytics library for tracking events */
  readonly analytics: AnalyticsLibrary;

  /** Service for managing reading resources */
  readonly readingResources: ReadingResourcesService;

  /** Remote resources configuration, or null if not available */
  readonly remoteResources: ReadingRemoteResources | null;

  // ============================================================================
  // Persistence
  // ============================================================================

  /** Persistence for last page tracking */
  readonly lastPagePersistence: LastPagePersistence;

  /** Persistence for user notes */
  readonly notePersistence: NotePersistence;

  /** Persistence for page bookmarks */
  readonly pageBookmarkPersistence: PageBookmarkPersistence;

  // ============================================================================
  // Services (Domain Layer)
  // ============================================================================

  /** Service for managing user notes */
  readonly noteService: NoteService;

  // ============================================================================
  // Authentication
  // ============================================================================

  /** Authentication client, or null if not available */
  readonly authenticationClient: AuthenticationClient | null;
}

// ============================================================================
// Default Extension Methods
// ============================================================================

/**
 * Gets the default Quran Uthmani V2 database URL.
 * This is the default implementation matching the iOS extension.
 */
export function getQuranUthmaniV2Database(): string {
  return QuranResources.quranUthmaniV2DatabasePath;
}

/**
 * Creates a QuranTextDataService using the container's dependencies.
 *
 * @param container - The app dependencies container
 * @returns A new QuranTextDataService instance
 */
export function createTextDataService(container: AppDependencies): QuranTextDataService {
  return new QuranTextDataService(
    container.databasesURL,
    container.quranUthmaniV2Database
  );
}

/**
 * Creates a NoteService using the container's dependencies.
 *
 * @param container - The app dependencies container
 * @returns A new NoteService instance
 */
export function createNoteService(container: AppDependencies): NoteService {
  return new NoteService(
    container.notePersistence,
    createTextDataService(container),
    container.analytics
  );
}

// ============================================================================
// AppDependencies with Extension Methods
// ============================================================================

/**
 * Extended AppDependencies interface with factory methods.
 */
export interface AppDependenciesWithFactories extends Omit<AppDependencies, 'noteService'> {
  /**
   * Creates a QuranTextDataService instance.
   */
  textDataService(): QuranTextDataService;

  /**
   * Creates a NoteService instance (factory method).
   */
  createNoteService(): NoteService;

  /**
   * The note service instance.
   */
  noteService: NoteService;
}

/**
 * Creates an AppDependencies wrapper with extension methods.
 *
 * @param deps - The base app dependencies
 * @returns AppDependencies with factory methods
 */
export function withFactories(deps: AppDependencies): AppDependenciesWithFactories {
  return {
    ...deps,
    textDataService(): QuranTextDataService {
      return createTextDataService(deps);
    },
    createNoteService(): NoteService {
      return createNoteService(deps);
    },
  };
}

