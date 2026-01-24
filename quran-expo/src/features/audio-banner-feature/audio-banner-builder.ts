/**
 * AudioBannerBuilder.swift → audio-banner-builder.ts
 *
 * Builder for the Audio Banner feature.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import {
  ReciterDataRetriever,
  RecentRecitersService,
} from '../../domain/reciter-service';
import {
  QuranAudioPlayer,
  QuranAudioDownloader,
} from '../../domain/quran-audio-kit';
import {
  AudioBannerViewModel,
  type AudioBannerListener,
} from './audio-banner-view-model';

// ============================================================================
// AudioBannerBuilder
// ============================================================================

/**
 * Builder for the Audio Banner feature.
 *
 * 1:1 translation of iOS AudioBannerBuilder.
 */
export class AudioBannerBuilder {
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
   * Build the Audio Banner view model.
   *
   * @param listener The listener for audio banner events
   * @returns The configured AudioBannerViewModel
   */
  build(listener: AudioBannerListener): AudioBannerViewModel {
    const viewModel = new AudioBannerViewModel(
      this.container.analytics,
      new ReciterDataRetriever(),
      new RecentRecitersService(),
      new QuranAudioPlayer(),
      new QuranAudioDownloader(
        this.container.filesAppHost,
        this.container.downloadManager
      )
    );

    viewModel.listener = listener;

    return viewModel;
  }
}

