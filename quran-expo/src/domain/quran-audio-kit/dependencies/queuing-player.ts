/**
 * QueuingPlayer.swift → queuing-player.ts
 *
 * Protocol for the underlying queue player.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { AudioRequest } from '../../../core/queue-player/audio-request';
import type { QueuePlayerActions } from '../../../core/queue-player/queue-player';

// ============================================================================
// QueuingPlayer Interface
// ============================================================================

/**
 * Interface for a queuing audio player.
 */
export interface QueuingPlayer {
  /**
   * Actions/callbacks for player events.
   */
  actions: QueuePlayerActions | null;

  /**
   * Plays an audio request.
   */
  play(request: AudioRequest): Promise<void>;

  /**
   * Pauses playback.
   */
  pause(): void;

  /**
   * Resumes playback.
   */
  resume(): void;

  /**
   * Stops playback completely.
   */
  stop(): void;

  /**
   * Steps forward to the next frame/verse.
   */
  stepForward(): void;

  /**
   * Steps backward to the previous frame/verse.
   */
  stepBackward(): void;

  /**
   * Sets the playback rate.
   */
  setRate(rate: number): void;
}

