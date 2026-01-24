/**
 * QueuePlayer.swift → queue-player.ts
 *
 * Main queue player translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 4/23/19.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { AudioRequest } from './audio-request';
import { AudioPlayer } from './audio-player';

/**
 * Actions/callbacks for queue player events.
 * Equivalent to Swift's QueuePlayerActions struct.
 */
export interface QueuePlayerActions {
  /**
   * Called when playback ends.
   */
  playbackEnded: () => void;

  /**
   * Called when playback rate changes.
   */
  playbackRateChanged: (rate: number) => void;

  /**
   * Called when the current audio frame changes.
   */
  audioFrameChanged: (fileIndex: number, frameIndex: number) => void;
}

/**
 * Creates a QueuePlayerActions object.
 */
export function createQueuePlayerActions(
  playbackEnded: () => void,
  playbackRateChanged: (rate: number) => void,
  audioFrameChanged: (fileIndex: number, frameIndex: number) => void
): QueuePlayerActions {
  return { playbackEnded, playbackRateChanged, audioFrameChanged };
}

/**
 * Main queue player for audio playback.
 * Equivalent to Swift's QueuePlayer class.
 *
 * @example
 * const queuePlayer = new QueuePlayer();
 *
 * queuePlayer.actions = {
 *   playbackEnded: () => console.log('Ended'),
 *   playbackRateChanged: (rate) => console.log('Rate:', rate),
 *   audioFrameChanged: (file, frame) => console.log('Frame:', file, frame),
 * };
 *
 * await queuePlayer.play(audioRequest);
 * await queuePlayer.pause();
 * await queuePlayer.resume();
 * await queuePlayer.stop();
 */
export class QueuePlayer {
  private player: AudioPlayer | null = null;
  private isInitialized: boolean = false;

  /**
   * Actions/callbacks for player events.
   */
  actions?: QueuePlayerActions;

  constructor() {
    this.initializeAudioSession();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Starts playing the given audio request.
   */
  async play(request: AudioRequest): Promise<void> {
    // Cleanup previous player
    await this.cleanup();

    // Create new player
    this.player = new AudioPlayer(request);
    this.player.actions = this.createInternalActions();
    await this.player.startPlaying();
  }

  /**
   * Pauses playback.
   */
  async pause(): Promise<void> {
    await this.player?.pause();
  }

  /**
   * Sets the playback rate.
   */
  async setRate(rate: number): Promise<void> {
    await this.player?.setRate(rate);
  }

  /**
   * Resumes paused playback.
   */
  async resume(): Promise<void> {
    await this.player?.resume();
  }

  /**
   * Stops playback completely.
   */
  async stop(): Promise<void> {
    await this.player?.stop();
  }

  /**
   * Steps forward to the next frame.
   */
  async stepForward(): Promise<void> {
    await this.player?.stepForward();
  }

  /**
   * Steps backward to the previous frame.
   */
  async stepBackward(): Promise<void> {
    await this.player?.stepBackward();
  }

  /**
   * Cleans up all resources.
   */
  async cleanup(): Promise<void> {
    if (this.player) {
      this.player.actions = undefined;
      await this.player.cleanup();
      this.player = null;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async initializeAudioSession(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio session:', error);
    }
  }

  private createInternalActions(): QueuePlayerActions {
    return {
      playbackEnded: () => {
        this.player = null;
        this.actions?.playbackEnded();
      },
      playbackRateChanged: (rate) => {
        this.actions?.playbackRateChanged(rate);
      },
      audioFrameChanged: (fileIndex, frameIndex) => {
        this.actions?.audioFrameChanged(fileIndex, frameIndex);
      },
    };
  }
}

/**
 * Creates a new queue player.
 */
export function createQueuePlayer(): QueuePlayer {
  return new QueuePlayer();
}

