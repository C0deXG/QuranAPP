/**
 * DiagnosticsBuilder.swift → diagnostics-builder.ts
 *
 * Builder for the Diagnostics screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../../app-dependencies';
import { DiagnosticsService } from './diagnostics-service';
import { DiagnosticsViewModel } from './diagnostics-view-model';

// ============================================================================
// DiagnosticsBuilder
// ============================================================================

/**
 * Builder for the Diagnostics screen.
 *
 * 1:1 translation of iOS DiagnosticsBuilder.
 */
export class DiagnosticsBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  readonly container: AppDependencies;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(container: AppDependencies) {
    this.container = container;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the Diagnostics view model.
   *
   * @returns The configured DiagnosticsViewModel
   */
  build(): DiagnosticsViewModel {
    const service = new DiagnosticsService(
      this.container.logsDirectory,
      this.container.databasesURL
    );

    return new DiagnosticsViewModel(service);
  }
}

