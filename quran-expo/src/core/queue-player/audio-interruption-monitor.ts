/**
 * AudioInterruptionMonitor.swift → audio-interruption-monitor.ts
 *
 * Audio interruption handling translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 4/29/19.
 *
 * In React Native, we use expo-av's audio mode and app state to handle interruptions.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { AppState, AppStateStatus } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

/**
 * Types of audio interruptions.
 * Equivalent to Swift's AudioInterruptionType enum.
 */
export enum AudioInterruptionType {
  /**
   * Interruption began (e.g., phone call started).
   */
  Began = 'began',

  /**
   * Interruption ended and playback should resume.
   */
  EndedShouldResume = 'endedShouldResume',

  /**
   * Interruption ended but playback should not resume.
   */
  EndedShouldNotResume = 'endedShouldNotResume',
}

/**
 * Monitors audio interruptions (phone calls, other apps, etc.).
 * Equivalent to Swift's AudioInterruptionMonitor class.
 */
export class AudioInterruptionMonitor {
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private wasPlayingBeforeBackground: boolean = false;

  /**
   * Callback when an audio interruption occurs.
   */
  onAudioInterruption?: (type: AudioInterruptionType) => void;

  /**
   * Whether the app is currently in foreground.
   */
  private isInForeground: boolean = true;

  constructor() {
    this.setupAudioMode();
    this.setupAppStateListener();
  }

  /**
   * Starts monitoring for interruptions.
   */
  start(): void {
    // Monitoring is started in constructor
  }

  /**
   * Stops monitoring and cleans up.
   */
  stop(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Notifies the monitor that playback is starting.
   * Used to track if we should resume after interruption.
   */
  notifyPlaybackStarted(): void {
    this.wasPlayingBeforeBackground = true;
  }

  /**
   * Notifies the monitor that playback has stopped.
   */
  notifyPlaybackStopped(): void {
    this.wasPlayingBeforeBackground = false;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async setupAudioMode(): Promise<void> {
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
    } catch (error) {
      console.error('Failed to set audio mode:', error);
    }
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active' && !this.isInForeground) {
      // App came to foreground
      this.isInForeground = true;

      if (this.wasPlayingBeforeBackground) {
        // Suggest resuming playback
        this.onAudioInterruption?.(AudioInterruptionType.EndedShouldResume);
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background
      if (this.isInForeground) {
        this.isInForeground = false;
        // Note: We don't trigger interruption here as audio should continue in background
        // The interruption callback is mainly for phone calls, which are handled by the OS
      }
    }
  }
}

/**
 * Creates an audio interruption monitor.
 */
export function createAudioInterruptionMonitor(): AudioInterruptionMonitor {
  return new AudioInterruptionMonitor();
}

