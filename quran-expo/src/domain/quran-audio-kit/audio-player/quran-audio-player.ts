/**
 * QuranAudioPlayer.swift → quran-audio-player.ts
 *
 * Main Quran audio player.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber } from '../../../model/quran-kit/types';
import type { Reciter } from '../../../model/quran-audio';
import { AudioType } from '../../../model/quran-audio';
import type { AudioRequest } from '../../../core/queue-player/audio-request';
import type { QueuePlayerActions } from '../../../core/queue-player/queue-player';
import { QueuePlayer } from '../../../core/queue-player/queue-player';
import { NowPlayingUpdater } from '../../../core/queue-player/now-playing-updater';
import { Runs } from '../../../core/queue-player/runs';
import { createLogger } from '../../../core/logging';
import type { QueuingPlayer } from '../dependencies/queuing-player';
import type { QuranAudioRequest, QuranAudioRequestBuilder } from './quran-audio-request';
import { GaplessAudioRequestBuilder } from './gapless-audio-request-builder';
import { GappedAudioRequestBuilder } from './gapped-audio-request-builder';
import { AudioUnzipper } from '../../reciter-service';

const logger = createLogger('QuranAudioPlayer');

// ============================================================================
// QuranAudioPlayerActions
// ============================================================================

/**
 * Callbacks for player events.
 */
export interface QuranAudioPlayerActions {
  /**
   * Called when playback ends.
   */
  playbackEnded: () => void;

  /**
   * Called when playback is paused.
   */
  playbackPaused: () => void;

  /**
   * Called when playback is resumed.
   */
  playbackResumed: () => void;

  /**
   * Called when playing a new ayah.
   */
  playing: (ayah: IAyahNumber) => void;
}

// ============================================================================
// QuranAudioPlayer
// ============================================================================

/**
 * Main Quran audio player.
 */
export class QuranAudioPlayer {
  private readonly player: QueuingPlayer;
  private readonly unzipper = new AudioUnzipper();
  private readonly nowPlaying = new NowPlayingUpdater();

  private readonly gappedAudioRequestBuilder: QuranAudioRequestBuilder = new GappedAudioRequestBuilder();
  private readonly gaplessAudioRequestBuilder: QuranAudioRequestBuilder = new GaplessAudioRequestBuilder();

  private audioRequest: QuranAudioRequest | null = null;

  /**
   * Actions/callbacks for player events.
   */
  actions: QuranAudioPlayerActions | null = null;

  constructor(player?: QueuingPlayer) {
    this.player = player ?? new QueuePlayer();
  }

  /**
   * Sets the player actions.
   */
  setActions(actions: QuranAudioPlayerActions): void {
    this.actions = actions;
  }

  // ============================================================================
  // Playback Controls
  // ============================================================================

  /**
   * Pauses audio playback.
   */
  pauseAudio(): void {
    this.player.pause();
  }

  /**
   * Resumes audio playback.
   */
  resumeAudio(): void {
    this.player.resume();
  }

  /**
   * Stops audio playback.
   */
  stopAudio(): void {
    this.player.stop();
  }

  /**
   * Steps forward to the next verse/frame.
   */
  stepForward(): void {
    this.player.stepForward();
  }

  /**
   * Steps backward to the previous verse/frame.
   */
  stepBackward(): void {
    this.player.stepBackward();
  }

  /**
   * Sets the playback rate.
   */
  setRate(rate: number): void {
    this.player.setRate(rate);
  }

  // ============================================================================
  // Play
  // ============================================================================

  /**
   * Plays audio for the given range.
   */
  async play(
    reciter: Reciter,
    from: IAyahNumber,
    to: IAyahNumber,
    verseRuns: Runs,
    listRuns: Runs
  ): Promise<void> {
    logger.notice(
      `Playing startAyah: ${from.sura.suraNumber}:${from.ayah}, ` +
      `to: ${to.sura.suraNumber}:${to.ayah}, ` +
      `reciter: ${reciter.id}, ` +
      `verseRuns: ${verseRuns}, ` +
      `listRuns: ${listRuns}`
    );

    // Unzip audio database if needed (for gapless)
    await this.unzipper.unzip(reciter);

    // Build audio request
    const builder = this.getAudioRequestBuilder(reciter);
    const audioRequest = await builder.buildRequest(reciter, from, to, verseRuns, listRuns);
    const request = audioRequest.getRequest();

    // Setup playback
    this.willPlay(request);
    this.audioRequest = audioRequest;
    this.player.actions = this.newPlayerActions();

    // Start playback
    await this.player.play(request);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Called when playback ends.
   */
  private playbackEnded(): void {
    this.nowPlaying.clear();
    this.actions?.playbackEnded();
    
    // Not interested in more notifications
    this.player.actions = null;
    this.audioRequest = null;
  }

  /**
   * Called when playback rate changes.
   */
  private playbackRateChanged(rate: number): void {
    this.nowPlaying.update({ rate });
    
    if (rate > 0.1) {
      this.actions?.playbackResumed();
    } else {
      this.actions?.playbackPaused();
    }
  }

  /**
   * Called when audio frame changes.
   */
  private audioFrameChanged(
    fileIndex: number,
    frameIndex: number,
    duration: number,
    currentTime: number
  ): void {
    if (!this.audioRequest) return;

    const info = this.audioRequest.getPlayerInfo(fileIndex);
    this.nowPlaying.update({ info });
    this.nowPlaying.update({ playingIndex: fileIndex });
    this.nowPlaying.update({ duration });
    this.nowPlaying.update({ elapsedTime: currentTime });

    const ayah = this.audioRequest.getAyahNumberFrom(fileIndex, frameIndex);
    this.actions?.playing(ayah);
  }

  /**
   * Called before playing starts.
   */
  private willPlay(request: AudioRequest): void {
    this.nowPlaying.clear();
    this.nowPlaying.update({ count: request.files.length });
  }

  /**
   * Gets the appropriate request builder for a reciter.
   */
  private getAudioRequestBuilder(reciter: Reciter): QuranAudioRequestBuilder {
    const type = reciter.audioType?.type;
    if (type === AudioType.gapless) {
      return this.gaplessAudioRequestBuilder;
    }
    return this.gappedAudioRequestBuilder;
  }

  /**
   * Creates new player actions.
   */
  private newPlayerActions(): QueuePlayerActions {
    return {
      playbackEnded: () => this.playbackEnded(),
      playbackRateChanged: (rate: number) => this.playbackRateChanged(rate),
      audioFrameChanged: (fileIndex: number, frameIndex: number, duration: number, currentTime: number) =>
        this.audioFrameChanged(fileIndex, frameIndex, duration, currentTime),
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a QuranAudioPlayer.
 */
export function createQuranAudioPlayer(player?: QueuingPlayer): QuranAudioPlayer {
  return new QuranAudioPlayer(player);
}
