/**
 * MoreMenuBuilder.swift → more-menu-builder.ts
 *
 * Builder for the More Menu feature.
 *
 * Quran.com. All rights reserved.
 */

import { MoreMenuViewModel } from './more-menu-view-model';
import type { MoreMenuModel } from './more-menu-model';
import type { MoreMenuListener } from './more-menu-listener';

// ============================================================================
// MoreMenuBuilder
// ============================================================================

/**
 * Builder for the More Menu feature.
 *
 * 1:1 translation of iOS MoreMenuBuilder.
 */
export class MoreMenuBuilder {
  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() {}

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the MoreMenuViewModel.
   *
   * @param listener The listener for menu events
   * @param model The model for the menu
   * @returns The configured MoreMenuViewModel
   */
  build(listener: MoreMenuListener, model: MoreMenuModel): MoreMenuViewModel {
    const viewModel = new MoreMenuViewModel(model);
    viewModel.listener = listener;
    return viewModel;
  }
}

