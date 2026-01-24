/**
 * QuranAudioRequestBuilder.swift → quran-audio-request.ts
 *
 * Audio request types and builder interface.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../../../model/quran-kit/types';
import type { Reciter } from '../../../model/quran-audio';
import type { AudioRequest } from '../../../core/queue-player/audio-request';
import type { PlayerItemInfo } from '../../../core/queue-player/player-item-info';
import type { Runs } from '../../../core/queue-player/runs';

// ============================================================================
// QuranAudioRequest Interface
// ============================================================================

/**
 * Represents a Quran audio playback request.
 */
export interface QuranAudioRequest {
  /**
   * Gets the underlying AudioRequest.
   */
  getRequest(): AudioRequest;

  /**
   * Gets the AyahNumber for a given file and frame index.
   */
  getAyahNumberFrom(fileIndex: number, frameIndex: number): IAyahNumber;

  /**
   * Gets the player info for a file index.
   */
  getPlayerInfo(fileIndex: number): PlayerItemInfo;
}

// ============================================================================
// QuranAudioRequestBuilder Interface
// ============================================================================

/**
 * Interface for building Quran audio requests.
 */
export interface QuranAudioRequestBuilder {
  /**
   * Builds an audio request for the given range.
   */
  buildRequest(
    reciter: Reciter,
    from: IAyahNumber,
    to: IAyahNumber,
    frameRuns: Runs,
    requestRuns: Runs
  ): Promise<QuranAudioRequest>;
}

