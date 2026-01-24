/**
 * AudioRequest.swift → audio-request.ts
 *
 * Audio request types translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 4/27/19.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Runs } from './runs';

/**
 * Represents a single audio frame (a portion of an audio file).
 * Equivalent to Swift's AudioFrame struct.
 */
export interface AudioFrame {
  /**
   * Start time in seconds.
   */
  readonly startTime: number;

  /**
   * End time in seconds (undefined means end of file/next frame).
   */
  readonly endTime?: number;
}

/**
 * Creates an audio frame.
 */
export function createAudioFrame(startTime: number, endTime?: number): AudioFrame {
  return { startTime, endTime };
}

/**
 * Represents an audio file with frames.
 * Equivalent to Swift's AudioFile struct.
 */
export interface AudioFile {
  /**
   * URI to the audio file.
   */
  readonly uri: string;

  /**
   * Frames within this file.
   */
  readonly frames: AudioFrame[];
}

/**
 * Creates an audio file.
 */
export function createAudioFile(uri: string, frames: AudioFrame[]): AudioFile {
  return { uri, frames };
}

/**
 * Represents a complete audio playback request.
 * Equivalent to Swift's AudioRequest struct.
 */
export interface AudioRequest {
  /**
   * Audio files to play.
   */
  readonly files: AudioFile[];

  /**
   * End time for the last frame (undefined means end of file).
   */
  readonly endTime?: number;

  /**
   * How many times to repeat each frame.
   */
  readonly frameRuns: Runs;

  /**
   * How many times to repeat the entire request.
   */
  readonly requestRuns: Runs;
}

/**
 * Creates an audio request.
 */
export function createAudioRequest(
  files: AudioFile[],
  options?: {
    endTime?: number;
    frameRuns?: Runs;
    requestRuns?: Runs;
  }
): AudioRequest {
  return {
    files,
    endTime: options?.endTime,
    frameRuns: options?.frameRuns ?? Runs.One,
    requestRuns: options?.requestRuns ?? Runs.One,
  };
}

/**
 * Gets the total number of frames in a request.
 */
export function getTotalFrameCount(request: AudioRequest): number {
  return request.files.reduce((sum, file) => sum + file.frames.length, 0);
}

/**
 * Gets the total number of files in a request.
 */
export function getTotalFileCount(request: AudioRequest): number {
  return request.files.length;
}

/**
 * Checks if two audio requests are equal.
 */
export function audioRequestsEqual(a: AudioRequest, b: AudioRequest): boolean {
  if (a.files.length !== b.files.length) return false;
  if (a.endTime !== b.endTime) return false;
  if (a.frameRuns !== b.frameRuns) return false;
  if (a.requestRuns !== b.requestRuns) return false;

  for (let i = 0; i < a.files.length; i++) {
    const fileA = a.files[i];
    const fileB = b.files[i];

    if (fileA.uri !== fileB.uri) return false;
    if (fileA.frames.length !== fileB.frames.length) return false;

    for (let j = 0; j < fileA.frames.length; j++) {
      const frameA = fileA.frames[j];
      const frameB = fileB.frames[j];

      if (frameA.startTime !== frameB.startTime) return false;
      if (frameA.endTime !== frameB.endTime) return false;
    }
  }

  return true;
}

