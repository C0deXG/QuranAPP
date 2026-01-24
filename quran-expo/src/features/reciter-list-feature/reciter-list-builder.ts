/**
 * ReciterListBuilder.swift → reciter-list-builder.ts
 *
 * Builder for the Reciter List screen.
 *
 * Quran.com. All rights reserved.
 */

import { ReciterListViewModel, type ReciterListListener } from './reciter-list-view-model';

// ============================================================================
// ReciterListBuilder
// ============================================================================

/**
 * Builder for the Reciter List screen.
 *
 * 1:1 translation of iOS ReciterListBuilder.
 */
export class ReciterListBuilder {
  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() {}

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the Reciter List view model.
   *
   * @param listener The listener for reciter selection changes
   * @param standalone Whether the screen is displayed standalone (with navigation)
   * @returns The configured ReciterListViewModel
   */
  build(listener: ReciterListListener, standalone: boolean): ReciterListViewModel {
    const viewModel = new ReciterListViewModel(standalone);
    viewModel.listener = listener;
    return viewModel;
  }
}

