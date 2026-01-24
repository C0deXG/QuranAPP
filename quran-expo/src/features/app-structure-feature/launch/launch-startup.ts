/**
 * LaunchStartup.swift → launch-startup.ts
 *
 * App launch orchestration, handling migrations and showing the main app.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../../core/logging';
import { AppMigrator, MigrationStatus } from '../../../core/app-migrator';
import type { AudioUpdater } from '../../../domain/audio-updater';
import type { ReviewService } from '../../../domain/settings-service';
import type { Migrator } from '../../../core/app-migrator';
import { AppBuilder } from '../app';

// ============================================================================
// LaunchState
// ============================================================================

/**
 * Represents the current state of the app launch process.
 */
export enum LaunchState {
  /** Initial state, not started */
  initial = 'initial',
  /** Checking for migrations */
  checkingMigration = 'checkingMigration',
  /** Running migrations (blocking UI) */
  migrating = 'migrating',
  /** App is ready to show */
  ready = 'ready',
}

/**
 * Launch state with additional data.
 */
export type LaunchStateData =
  | { state: LaunchState.initial }
  | { state: LaunchState.checkingMigration }
  | { state: LaunchState.migrating; titles: string[] }
  | { state: LaunchState.ready };

// ============================================================================
// LaunchStartupListener
// ============================================================================

/**
 * Listener for launch startup events.
 */
export interface LaunchStartupListener {
  /**
   * Called when the launch state changes.
   */
  onStateChange(state: LaunchStateData): void;
}

// ============================================================================
// LaunchStartup
// ============================================================================

/**
 * Orchestrates app launch, handling migrations and showing the main app.
 *
 * 1:1 translation of iOS LaunchStartup.
 */
export class LaunchStartup {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly appBuilder: AppBuilder;
  private readonly audioUpdater: AudioUpdater;
  private readonly fileSystemMigrator: Migrator;
  private readonly recitersPathMigrator: Migrator;
  private readonly reviewService: ReviewService;

  private readonly appMigrator = new AppMigrator();
  private appLaunched = false;

  /** Current launch state */
  private _state: LaunchStateData = { state: LaunchState.initial };

  /** Listeners for state changes */
  private listeners: LaunchStartupListener[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    appBuilder: AppBuilder,
    audioUpdater: AudioUpdater,
    fileSystemMigrator: Migrator,
    recitersPathMigrator: Migrator,
    reviewService: ReviewService
  ) {
    this.appBuilder = appBuilder;
    this.audioUpdater = audioUpdater;
    this.fileSystemMigrator = fileSystemMigrator;
    this.recitersPathMigrator = recitersPathMigrator;
    this.reviewService = reviewService;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Get the current launch state.
   */
  get state(): LaunchStateData {
    return this._state;
  }

  /**
   * Add a listener for state changes.
   */
  addListener(listener: LaunchStartupListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener.
   */
  removeListener(listener: LaunchStartupListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Launch the app.
   * This is the main entry point for app startup.
   *
   * In iOS, this takes a UIWindow parameter.
   * In React Native, the component handles rendering based on state.
   */
  async launch(): Promise<void> {
    await this.upgradeIfNeeded();
  }

  /**
   * Get the app builder.
   */
  getAppBuilder(): AppBuilder {
    return this.appBuilder;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Set the current state and notify listeners.
   */
  private setState(state: LaunchStateData): void {
    this._state = state;
    for (const listener of this.listeners) {
      listener.onStateChange(state);
    }
  }

  /**
   * Check for and run migrations if needed.
   */
  private async upgradeIfNeeded(): Promise<void> {
    this.setState({ state: LaunchState.checkingMigration });
    this.registerMigrators();

    const status = await this.appMigrator.migrationStatus();

    switch (status.type) {
      case 'noMigration':
        this.showApp();
        break;

      case 'migrate':
        if (status.blocksUI) {
          logger.notice(`Performing long upgrade task: ${status.titles.join(', ')}`);
          this.setState({ state: LaunchState.migrating, titles: status.titles });
        }

        await this.appMigrator.migrate();
        this.showApp();
        break;
    }
  }

  /**
   * Show the main app.
   */
  private showApp(): void {
    if (this.appLaunched) {
      return;
    }

    this.updateAudioIfNeeded();
    this.appLaunched = true;

    // Mark as ready
    this.setState({ state: LaunchState.ready });

    // Check for app review
    this.reviewService.checkForReview();
  }

  /**
   * Register all migrators with their version requirements.
   */
  private registerMigrators(): void {
    this.appMigrator.register(this.fileSystemMigrator, '1.16.0');
    this.appMigrator.register(this.recitersPathMigrator, '1.19.1');
  }

  /**
   * Update audio files if needed.
   * Only runs if the app version hasn't changed (not after upgrade).
   */
  private async updateAudioIfNeeded(): Promise<void> {
    // Don't run audio updater after upgrading the app
    const launchVersion = await this.appMigrator.launchVersion();
    if (launchVersion.type === 'sameVersion') {
      // Run async without awaiting
      this.audioUpdater.updateAudioIfNeeded().catch((error) => {
        logger.error(`Failed to update audio: ${error}`);
      });
    }
  }
}

