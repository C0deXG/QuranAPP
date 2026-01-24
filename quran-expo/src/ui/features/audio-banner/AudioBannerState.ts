/**
 * AudioBannerViewUI.swift → AudioBannerState.ts
 *
 * State types for the audio banner.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Audio Banner State
// ============================================================================

/**
 * The current state of the audio banner.
 */
export type AudioBannerState =
  | { type: 'playing'; paused: boolean }
  | { type: 'readyToPlay'; reciter: string }
  | { type: 'downloading'; progress: number };

/**
 * Creates a playing state.
 */
export function playingState(paused: boolean): AudioBannerState {
  return { type: 'playing', paused };
}

/**
 * Creates a ready to play state.
 */
export function readyToPlayState(reciter: string): AudioBannerState {
  return { type: 'readyToPlay', reciter };
}

/**
 * Creates a downloading state.
 */
export function downloadingState(progress: number): AudioBannerState {
  return { type: 'downloading', progress };
}

// ============================================================================
// Audio Banner Actions
// ============================================================================

/**
 * Actions available for the audio banner.
 */
export interface AudioBannerActions {
  /** Start playing */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Resume playback */
  resume: () => void;
  /** Stop playback */
  stop: () => void;
  /** Go to previous ayah */
  backward: () => void;
  /** Go to next ayah */
  forward: () => void;
  /** Cancel downloading */
  cancelDownloading: () => Promise<void>;
  /** Open reciters selection */
  reciters: () => void;
  /** Open more options menu */
  more: () => void;
  /** Current playback rate */
  currentRate: number;
  /** Set playback rate */
  setPlaybackRate: (rate: number) => void;
}

// ============================================================================
// Speed Values
// ============================================================================

/**
 * Available playback speed values.
 */
export const SPEED_VALUES: number[] = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

/**
 * Formats a speed value for display.
 */
export function formatSpeed(rate: number): string {
  // Format with up to 2 decimal places, removing trailing zeros
  const formatted = rate.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted}×`;
}

