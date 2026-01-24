/**
 * WordPointerBuilder.swift → word-pointer-builder.ts
 *
 * Builder for the word pointer feature.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { WordTextService } from '../../domain/word-text-service';
import { WordPointerViewModel } from './word-pointer-view-model';
import type { WordPointerListener } from './word-pointer-listener';

// ============================================================================
// WordPointerBuilder
// ============================================================================

/**
 * Builder for the word pointer feature.
 *
 * 1:1 translation of iOS WordPointerBuilder.
 */
export class WordPointerBuilder {
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
   * Build the word pointer view model.
   *
   * @param listener The listener for word pointer events
   * @returns The configured WordPointerViewModel
   */
  build(listener: WordPointerListener): WordPointerViewModel {
    const service = new WordTextService(this.container.wordsDatabase);
    const viewModel = new WordPointerViewModel(service);
    viewModel.listener = listener;
    return viewModel;
  }
}

