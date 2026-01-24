/**
 * NowPlayingUpdater.swift → now-playing-updater.ts
 *
 * Now playing info management translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 4/28/19.
 *
 * In React Native, we use expo-av's Audio.Sound metadata capabilities.
 * For lock screen controls, react-native-track-player would be needed for full support.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { PlayerItemInfo } from './player-item-info';

/**
 * Now playing info structure.
 */
interface NowPlayingInfo {
  title?: string;
  artist?: string;
  artworkUri?: string;
  duration?: number;
  elapsedTime?: number;
  rate?: number;
  queueCount?: number;
  queueIndex?: number;
  // Extended properties for audio player
  info?: PlayerItemInfo;
  playingIndex?: number;
  count?: number;
}

/**
 * Updates now playing info for lock screen display.
 * Equivalent to Swift's NowPlayingUpdater class.
 *
 * Note: Full lock screen control integration requires react-native-track-player
 * or similar library. This provides the interface and basic functionality.
 */
export class NowPlayingUpdater {
  private nowPlayingInfo: NowPlayingInfo = {};
  private onInfoChanged?: (info: NowPlayingInfo) => void;

  /**
   * Sets a callback for when now playing info changes.
   * Useful for integrating with lock screen control libraries.
   */
  setOnInfoChanged(callback: (info: NowPlayingInfo) => void): void {
    this.onInfoChanged = callback;
  }

  /**
   * Clears all now playing info.
   */
  clear(): void {
    this.nowPlayingInfo = {};
    this.notifyChange();
  }

  /**
   * Updates the duration.
   */
  updateDuration(duration: number): void {
    this.update({ duration });
  }

  /**
   * Updates the elapsed time.
   */
  updateElapsedTime(elapsedTime: number): void {
    this.update({ elapsedTime });
  }

  /**
   * Updates the player item info.
   */
  updateInfo(info: PlayerItemInfo): void {
    this.update({
      title: info.title,
      artist: info.artist,
      artworkUri: info.artworkUri,
    });
  }

  /**
   * Updates the playback rate.
   */
  updateRate(rate: number): void {
    this.update({ rate });
  }

  /**
   * Updates the queue count.
   */
  updateQueueCount(count: number): void {
    this.update({ queueCount: count });
  }

  /**
   * Updates the current queue index.
   */
  updateQueueIndex(index: number): void {
    this.update({ queueIndex: index });
  }

  /**
   * Gets the current now playing info.
   */
  getInfo(): Readonly<NowPlayingInfo> {
    return { ...this.nowPlayingInfo };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  public update(values: Partial<NowPlayingInfo>): void {
    this.nowPlayingInfo = {
      ...this.nowPlayingInfo,
      ...values,
    };
    this.notifyChange();
  }

  private notifyChange(): void {
    this.onInfoChanged?.({ ...this.nowPlayingInfo });
  }
}

/**
 * Creates a now playing updater.
 */
export function createNowPlayingUpdater(): NowPlayingUpdater {
  return new NowPlayingUpdater();
}

/**
 * Shared now playing updater instance.
 */
export const nowPlayingUpdater = new NowPlayingUpdater();

