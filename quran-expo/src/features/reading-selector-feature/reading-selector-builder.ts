/**
 * ReadingSelectorBuilder.swift → reading-selector-builder.ts
 *
 * Builder for the Reading Selector screen.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { ReadingSelectorViewModel } from './reading-selector-view-model';

// ============================================================================
// ReadingSelectorBuilder
// ============================================================================

/**
 * Builder for the Reading Selector screen.
 *
 * 1:1 translation of iOS ReadingSelectorBuilder.
 */
export class ReadingSelectorBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly container: AppDependencies;

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
   * Build the Reading Selector view model.
   *
   * @returns The configured ReadingSelectorViewModel
   */
  build(): ReadingSelectorViewModel {
    return new ReadingSelectorViewModel(this.container.readingResources);
  }
}

