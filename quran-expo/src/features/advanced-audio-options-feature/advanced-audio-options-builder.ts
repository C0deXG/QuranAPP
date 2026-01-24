/**
 * AdvancedAudioOptionsBuilder.swift → advanced-audio-options-builder.ts
 *
 * Builder for the Advanced Audio Options feature.
 *
 * Quran.com. All rights reserved.
 */

import type { AdvancedAudioOptions } from './advanced-audio-options';
import {
  AdvancedAudioOptionsViewModel,
  type AdvancedAudioOptionsListener,
} from './advanced-audio-options-view-model';

// ============================================================================
// AdvancedAudioOptionsBuilder
// ============================================================================

/**
 * Builder for the Advanced Audio Options feature.
 *
 * 1:1 translation of iOS AdvancedAudioOptionsBuilder.
 */
export class AdvancedAudioOptionsBuilder {
  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() {}

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the Advanced Audio Options view model.
   *
   * @param listener The listener for audio options events
   * @param options The initial audio options
   * @returns The configured AdvancedAudioOptionsViewModel
   */
  build(
    listener: AdvancedAudioOptionsListener,
    options: AdvancedAudioOptions
  ): AdvancedAudioOptionsViewModel {
    const viewModel = new AdvancedAudioOptionsViewModel(options);
    viewModel.listener = listener;
    return viewModel;
  }
}

