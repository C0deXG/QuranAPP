/**
 * PlayerItemInfo.swift → player-item-info.ts
 *
 * Now playing info types translated from quran-ios Core/QueuePlayer
 * Created by Afifi, Mohamed on 2018-04-04.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2018 Quran.com
 */

/**
 * Information about the currently playing item.
 * Used for lock screen and notification display.
 *
 * Equivalent to Swift's PlayerItemInfo struct.
 */
export interface PlayerItemInfo {
  /**
   * Title of the track (e.g., Surah name).
   */
  readonly title: string;

  /**
   * Artist/reciter name.
   */
  readonly artist: string;

  /**
   * URI to the artwork image.
   */
  readonly artworkUri?: string;

  /**
   * Alias for artworkUri for compatibility.
   */
  readonly image?: string;
}

/**
 * Creates player item info.
 */
export function createPlayerItemInfo(
  title: string,
  artist: string,
  artworkUri?: string
): PlayerItemInfo {
  return { title, artist, artworkUri };
}

/**
 * Default app artwork URI.
 * Should be set during app initialization.
 */
let defaultArtworkUri: string | undefined;

/**
 * Sets the default artwork URI to use when none is provided.
 */
export function setDefaultArtworkUri(uri: string): void {
  defaultArtworkUri = uri;
}

/**
 * Gets the artwork URI, falling back to default if needed.
 */
export function getArtworkUri(info: PlayerItemInfo): string | undefined {
  return info.artworkUri ?? defaultArtworkUri;
}

