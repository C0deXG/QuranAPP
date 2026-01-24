/**
 * AudioUpdatesNetworkManager.swift → audio-updates-network-manager.ts
 *
 * Network manager for fetching audio updates.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { NetworkManager } from '../../data/network-support';
import type { AudioUpdates } from './audio-update';
import { parseAudioUpdates } from './audio-update';

// ============================================================================
// Constants
// ============================================================================

const PATH = '/data/audio_updates.php';
const REVISION_PARAM = 'revision';

// ============================================================================
// AudioUpdatesNetworkManager
// ============================================================================

/**
 * Network manager for fetching audio updates.
 */
export class AudioUpdatesNetworkManager {
  private readonly networkManager: NetworkManager;

  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager;
  }

  /**
   * Gets audio updates since the given revision.
   */
  async getAudioUpdates(revision: number): Promise<AudioUpdates | null> {
    const data = await this.networkManager.request(PATH, [
      [REVISION_PARAM, String(revision)],
    ]);

    return this.parse(data);
  }

  /**
   * Parses the response data.
   */
  private parse(data: string): AudioUpdates | null {
    if (!data || data.trim() === '') {
      return null;
    }

    try {
      const json = JSON.parse(data);
      return parseAudioUpdates(json);
    } catch {
      return null;
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an AudioUpdatesNetworkManager.
 */
export function createAudioUpdatesNetworkManager(
  networkManager: NetworkManager
): AudioUpdatesNetworkManager {
  return new AudioUpdatesNetworkManager(networkManager);
}

