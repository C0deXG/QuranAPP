/**
 * Player.swift → player.ts
 *
 * Low-level audio player translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 5/4/19.
 *
 * Uses expo-av for audio playback.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

/**
 * Low-level audio player wrapper.
 * Equivalent to Swift's Player class.
 */
export class Player {
  private sound: Audio.Sound | null = null;
  private _currentRate: number = 1.0;
  private _duration: number = 0;
  private _currentTime: number = 0;
  private _isPlaying: boolean = false;
  private readonly uri: string;

  /**
   * Callback when playback rate changes.
   */
  onRateChanged?: (rate: number) => void;

  constructor(uri: string) {
    this.uri = uri;
    this.loadAudio();
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /**
   * Current playback time in seconds.
   */
  get currentTime(): number {
    return this._currentTime;
  }

  /**
   * Total duration in seconds.
   */
  get duration(): number {
    return this._duration;
  }

  /**
   * Whether audio is currently playing.
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * The effective rate for scheduling.
   * If playing, returns actual rate; if paused, returns last set rate.
   */
  get effectiveRate(): number {
    return this._isPlaying ? this._currentRate : this._currentRate;
  }

  // ============================================================================
  // Playback Controls
  // ============================================================================

  /**
   * Starts or resumes playback.
   */
  async play(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
      await this.sound.setRateAsync(this._currentRate, true);
    }
  }

  /**
   * Pauses playback.
   */
  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  /**
   * Stops playback.
   */
  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
    }
  }

  /**
   * Sets the playback rate.
   */
  async setRate(rate: number): Promise<void> {
    this._currentRate = rate;
    if (this.sound && this._isPlaying) {
      await this.sound.setRateAsync(rate, true);
    }
    this.onRateChanged?.(rate);
  }

  /**
   * Seeks to a specific time.
   */
  async seek(timeInSeconds: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(timeInSeconds * 1000);
    }
  }

  /**
   * Unloads the audio resource.
   */
  async unload(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async loadAudio(): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: this.uri },
        { shouldPlay: false, rate: this._currentRate, shouldCorrectPitch: true },
        this.onPlaybackStatusUpdate.bind(this)
      );
      this.sound = sound;
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  }

  private onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (!status.isLoaded) {
      return;
    }

    const loadedStatus = status as AVPlaybackStatusSuccess;

    this._currentTime = (loadedStatus.positionMillis ?? 0) / 1000;
    this._duration = (loadedStatus.durationMillis ?? 0) / 1000;
    this._isPlaying = loadedStatus.isPlaying ?? false;

    // Track rate changes
    if (loadedStatus.rate !== undefined && loadedStatus.rate !== this._currentRate) {
      this._currentRate = loadedStatus.rate;
      this.onRateChanged?.(loadedStatus.rate);
    }
  }
}

/**
 * Creates a player for the given URI.
 */
export function createPlayer(uri: string): Player {
  return new Player(uri);
}

