/**
 * AudioPlaying.swift → audio-playing.ts
 *
 * Audio playback state management translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 4/27/19.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { AudioRequest, AudioFile, AudioFrame } from './audio-request';
import { Runs, getMaxRuns } from './runs';

/**
 * Tracks the current frame being played.
 */
interface FramePlaying {
  frameIndex: number;
  framePlays: number;
}

/**
 * Tracks the current file being played.
 */
interface FilePlaying {
  fileIndex: number;
}

/**
 * Manages the state of audio playback.
 * Equivalent to Swift's AudioPlaying struct.
 */
export class AudioPlaying {
  readonly request: AudioRequest;
  private _filePlaying: FilePlaying;
  private _framePlaying: FramePlaying;
  private _requestPlays: number;

  constructor(request: AudioRequest, fileIndex: number, frameIndex: number) {
    this.request = request;
    this._filePlaying = { fileIndex };
    this._framePlaying = { frameIndex, framePlays: 0 };
    this._requestPlays = 0;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get filePlaying(): Readonly<FilePlaying> {
    return this._filePlaying;
  }

  get framePlaying(): Readonly<FramePlaying> {
    return this._framePlaying;
  }

  get requestPlays(): number {
    return this._requestPlays;
  }

  /**
   * Gets the current file.
   */
  get file(): AudioFile {
    return this.request.files[this._filePlaying.fileIndex];
  }

  /**
   * Gets the current frame.
   */
  get frame(): AudioFrame {
    return this.file.frames[this._framePlaying.frameIndex];
  }

  /**
   * Gets the end time of the current frame.
   */
  get frameEndTime(): number | undefined {
    const currentFrame = this.request.files[this._filePlaying.fileIndex]
      .frames[this._framePlaying.frameIndex];

    // If frame has explicit end time, use it
    if (currentFrame.endTime !== undefined) {
      return currentFrame.endTime;
    }

    // Otherwise, look at next frame
    const next = this.nextFrame();
    if (!next) {
      // Last frame - use request end time
      return this.request.endTime;
    }

    if (next.fileIndex === this._filePlaying.fileIndex) {
      // Same file - next frame's start time is this frame's end
      return this.request.files[next.fileIndex].frames[next.frameIndex].startTime;
    }

    // Different file - no end time (play to end of file)
    return undefined;
  }

  // ============================================================================
  // State Updates
  // ============================================================================

  /**
   * Sets the current playing position.
   */
  setPlaying(fileIndex: number, frameIndex: number): void {
    this._filePlaying = { fileIndex };
    this._framePlaying.frameIndex = frameIndex;
  }

  /**
   * Checks if this is the last play for the current frame.
   */
  isLastPlayForCurrentFrame(): boolean {
    return this._framePlaying.framePlays + 1 >= getMaxRuns(this.request.frameRuns);
  }

  /**
   * Checks if this is the last run of the request.
   */
  isLastRun(): boolean {
    return this._requestPlays + 1 >= getMaxRuns(this.request.requestRuns);
  }

  /**
   * Increments the request play count.
   */
  incrementRequestPlays(): void {
    if (this.request.requestRuns === Runs.Indefinite) {
      return;
    }
    this._requestPlays++;
  }

  /**
   * Increments the frame play count.
   */
  incrementFramePlays(): void {
    if (this.request.frameRuns === Runs.Indefinite) {
      return;
    }
    this._framePlaying.framePlays++;
  }

  /**
   * Resets the frame play count.
   */
  resetFramePlays(): void {
    this._framePlaying.framePlays = 0;
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  /**
   * Gets the previous frame position.
   * @returns Previous frame position or undefined if at start
   */
  previousFrame(): { fileIndex: number; frameIndex: number } | undefined {
    // Same file, previous frame
    if (this._framePlaying.frameIndex > 0) {
      return {
        fileIndex: this._filePlaying.fileIndex,
        frameIndex: this._framePlaying.frameIndex - 1,
      };
    }

    // Previous file, last frame
    if (this._filePlaying.fileIndex > 0) {
      const previousFileIndex = this._filePlaying.fileIndex - 1;
      return {
        fileIndex: previousFileIndex,
        frameIndex: this.request.files[previousFileIndex].frames.length - 1,
      };
    }

    // At the beginning
    return undefined;
  }

  /**
   * Gets the next frame position.
   * @returns Next frame position or undefined if at end
   */
  nextFrame(): { fileIndex: number; frameIndex: number } | undefined {
    // Same file, next frame
    if (this._framePlaying.frameIndex < this.file.frames.length - 1) {
      return {
        fileIndex: this._filePlaying.fileIndex,
        frameIndex: this._framePlaying.frameIndex + 1,
      };
    }

    // Next file, first frame
    if (this._filePlaying.fileIndex < this.request.files.length - 1) {
      return {
        fileIndex: this._filePlaying.fileIndex + 1,
        frameIndex: 0,
      };
    }

    // At the end
    return undefined;
  }
}

