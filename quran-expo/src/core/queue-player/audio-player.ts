/**
 * AudioPlayer.swift → audio-player.ts
 *
 * Audio player with frame tracking translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 4/27/19.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Timer } from '../timing/timer';
import { AudioRequest } from './audio-request';
import { AudioPlaying } from './audio-playing';
import { Player } from './player';
import { AudioInterruptionMonitor, AudioInterruptionType } from './audio-interruption-monitor';
import { QueuePlayerActions } from './queue-player';

/**
 * Internal audio player that manages frame-by-frame playback.
 * Equivalent to Swift's AudioPlayer class.
 */
export class AudioPlayer {
  private readonly request: AudioRequest;
  private audioPlaying: AudioPlaying;
  private player: Player;
  private readonly interruptionMonitor: AudioInterruptionMonitor;

  private playbackRate: number = 1.0;
  private isPaused: boolean = false;
  private pendingRate: number | undefined;
  private timer: Timer | null = null;

  /**
   * Actions callback for player events.
   */
  actions?: QueuePlayerActions;

  constructor(request: AudioRequest) {
    this.request = request;
    this.audioPlaying = new AudioPlaying(request, 0, 0);
    this.player = new Player(request.files[0].uri);

    // Set up rate change handler
    this.player.onRateChanged = (rate) => {
      this.rateChanged(rate);
    };

    // Set up interruption monitor
    this.interruptionMonitor = new AudioInterruptionMonitor();
    this.interruptionMonitor.onAudioInterruption = (type) => {
      this.onAudioInterruption(type);
    };
  }

  // ============================================================================
  // Interruption Handling
  // ============================================================================

  private onAudioInterruption(type: AudioInterruptionType): void {
    switch (type) {
      case AudioInterruptionType.Began:
        this.pause();
        break;
      case AudioInterruptionType.EndedShouldResume:
        this.resume();
        break;
      case AudioInterruptionType.EndedShouldNotResume:
        // Do nothing
        break;
    }
  }

  // ============================================================================
  // Player Controls
  // ============================================================================

  /**
   * Starts playback from the beginning.
   */
  async startPlaying(): Promise<void> {
    await this.playFrame(0, 0, true);
  }

  /**
   * Resumes paused playback.
   */
  async resume(): Promise<void> {
    this.isPaused = false;

    // Apply any pending rate before resuming
    if (this.pendingRate !== undefined) {
      this.playbackRate = this.pendingRate;
      this.pendingRate = undefined;
      await this.player.setRate(this.playbackRate);
      this.actions?.playbackRateChanged(this.playbackRate);
    }

    this.timer?.resume();
    await this.player.play();
    this.interruptionMonitor.notifyPlaybackStarted();
  }

  /**
   * Pauses playback.
   */
  async pause(): Promise<void> {
    this.isPaused = true;
    this.timer?.pause();
    await this.player.pause();
  }

  /**
   * Stops playback completely.
   */
  async stop(): Promise<void> {
    this.isPaused = true;
    this.timer?.cancel();
    this.timer = null;
    await this.player.stop();
    this.interruptionMonitor.notifyPlaybackStopped();
    this.actions?.playbackEnded();
  }

  /**
   * Sets the playback rate.
   */
  async setRate(rate: number): Promise<void> {
    this.playbackRate = rate;
    await this.player.setRate(rate);
    this.actions?.playbackRateChanged(rate);

    // If currently playing, reschedule the frame end timer
    if (this.player.isPlaying && rate > 0) {
      this.timer?.cancel();
      this.waitUntilFrameEnds();
    } else {
      this.pendingRate = undefined;
    }
  }

  /**
   * Steps to the next frame.
   */
  async stepForward(): Promise<void> {
    const next = this.audioPlaying.nextFrame();
    if (next) {
      this.audioPlaying.resetFramePlays();
      await this.playFrame(next.fileIndex, next.frameIndex, true);
    } else {
      // Last frame - stop playback
      await this.stop();
    }
  }

  /**
   * Steps to the previous frame.
   */
  async stepBackward(): Promise<void> {
    const previous = this.audioPlaying.previousFrame();
    if (previous) {
      this.audioPlaying.resetFramePlays();
      await this.playFrame(previous.fileIndex, previous.frameIndex, true);
    } else {
      // First frame - stop playback
      await this.stop();
    }
  }

  /**
   * Cleans up resources.
   */
  async cleanup(): Promise<void> {
    this.timer?.cancel();
    this.timer = null;
    this.interruptionMonitor.stop();
    await this.player.unload();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async playFrame(fileIndex: number, frameIndex: number, forceSeek: boolean): Promise<void> {
    const oldFileIndex = this.audioPlaying.filePlaying.fileIndex;
    const oldFrameIndex = this.audioPlaying.framePlaying.frameIndex;

    const shouldSeek = forceSeek || oldFileIndex !== fileIndex || frameIndex - 1 !== oldFrameIndex;

    // Update the model
    this.audioPlaying.setPlaying(fileIndex, frameIndex);

    // Reload player if needed
    if (shouldSeek) {
      await this.player.unload();
      this.player = new Player(this.request.files[fileIndex].uri);
      this.player.onRateChanged = (rate) => this.rateChanged(rate);
      await this.player.setRate(this.playbackRate);
    }

    // Seek to frame start
    let currentTime: number | undefined;
    if (shouldSeek) {
      await this.seekToFrame(this.audioPlaying.frame);
      currentTime = this.audioPlaying.frame.startTime;
    }

    // Start playing
    await this.resume();

    // Wait until frame ends
    this.waitUntilFrameEnds(currentTime);

    // Notify delegate
    this.actions?.audioFrameChanged(fileIndex, frameIndex);
  }

  private async onFrameEnded(): Promise<void> {
    const timeToEnd = this.getDurationToFrameEnd();

    // Make sure we reached the end of the frame
    if (timeToEnd >= 0.2) {
      // Audio is behind, reschedule the timer
      this.waitUntilFrameEnds();
      return;
    }

    // Frame completed - decide what's next
    if (this.audioPlaying.isLastPlayForCurrentFrame()) {
      const next = this.audioPlaying.nextFrame();

      if (next) {
        // Move to next frame
        this.audioPlaying.resetFramePlays();
        await this.playFrame(next.fileIndex, next.frameIndex, false);
      } else {
        // Last frame
        if (this.audioPlaying.isLastRun()) {
          // All runs complete - stop
          await this.stop();
        } else {
          // Start a new run
          this.audioPlaying.incrementRequestPlays();
          this.audioPlaying.resetFramePlays();
          await this.playFrame(0, 0, true);
        }
      }
    } else {
      // Repeat frame
      this.audioPlaying.incrementFramePlays();
      await this.playFrame(
        this.audioPlaying.filePlaying.fileIndex,
        this.audioPlaying.framePlaying.frameIndex,
        true
      );
    }
  }

  private waitUntilFrameEnds(currentTime?: number): void {
    // Calculate time to frame end
    const mediaDelta = Math.max(0, this.getDurationToFrameEnd(currentTime));

    // Convert media time to wall-clock time
    const rate = Math.max(0.1, this.player.effectiveRate);
    const interval = Math.max(50, (mediaDelta / rate) * 1000); // Convert to milliseconds

    this.timer?.cancel();
    this.timer = new Timer({
      interval,
      handler: () => {
        this.timer = null;
        this.onFrameEnded();
      },
    });
  }

  private rateChanged(rate: number): void {
    this.playbackRate = rate;
    if (this.player.isPlaying && rate > 0) {
      this.timer?.cancel();
      this.waitUntilFrameEnds();
    }
    this.actions?.playbackRateChanged(rate);
  }

  private async seekToFrame(frame: { startTime: number }): Promise<void> {
    await this.player.pause();
    await this.player.seek(frame.startTime);
    await this.player.play();
  }

  private getDurationToFrameEnd(currentTime?: number): number {
    const currentTimeInSeconds = currentTime ?? this.player.currentTime;
    const frameEndTime = this.audioPlaying.frameEndTime ?? this.player.duration;
    return frameEndTime - currentTimeInSeconds;
  }
}

