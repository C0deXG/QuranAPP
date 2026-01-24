/**
 * SettingsBuilder.swift → settings-builder.ts
 *
 * Builder for the Settings screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { ReviewService } from '../../domain/settings-service';
import { QuranProfileService } from '../../domain/quran-profile-service';
import { SettingsViewModel } from './settings-view-model';
import { DiagnosticsBuilder } from './diagnostics';

// ============================================================================
// SettingsBuilder
// ============================================================================

/**
 * Builder for the Settings screen.
 *
 * 1:1 translation of iOS SettingsBuilder.
 */
export class SettingsBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  readonly container: AppDependencies;
  readonly diagnosticsBuilder: DiagnosticsBuilder;

  // Note: These builders would be added as dependencies are converted:
  // readonly audioDownloadsBuilder: AudioDownloadsBuilder;
  // readonly translationsListBuilder: TranslationsListBuilder;
  // readonly readingSelectorBuilder: ReadingSelectorBuilder;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(container: AppDependencies) {
    this.container = container;
    this.diagnosticsBuilder = new DiagnosticsBuilder(container);
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the Settings view model.
   *
   * @returns The configured SettingsViewModel
   */
  build(): SettingsViewModel {
    const reviewService = new ReviewService(this.container.analytics);
    const quranProfileService = new QuranProfileService(this.container.authenticationClient);

    return new SettingsViewModel(
      this.container.analytics,
      reviewService,
      quranProfileService
    );
  }

  /**
   * Build the Diagnostics view model.
   */
  buildDiagnostics() {
    return this.diagnosticsBuilder.build();
  }
}

