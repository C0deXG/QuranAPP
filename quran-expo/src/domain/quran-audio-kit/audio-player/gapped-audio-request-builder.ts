/**
 * GappedAudioRequestBuilder.swift → gapped-audio-request-builder.ts
 *
 * Builds audio requests for gapped (per-ayah) reciters.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber, ISura } from '../../../model/quran-kit/types';
import { AyahNumber } from '../../../model/quran-kit';
import type { Reciter } from '../../../model/quran-audio';
import { AudioType, getReciterLocalAyahPath } from '../../../model/quran-audio';
import type { AudioRequest, AudioFile } from '../../../core/queue-player/audio-request';
import { createAudioRequest, createAudioFile, createAudioFrame } from '../../../core/queue-player/audio-request';
import type { PlayerItemInfo } from '../../../core/queue-player/player-item-info';
import { Runs } from '../../../core/queue-player/runs';
import type { QuranAudioRequest, QuranAudioRequestBuilder } from './quran-audio-request';
import { getLocalizedAyahName } from '../../quran-text-kit';
import { getReciterLocalizedName } from '../../reciter-service';

// ============================================================================
// GappedAudioRequest
// ============================================================================

/**
 * Audio request for gapped reciters.
 */
class GappedAudioRequest implements QuranAudioRequest {
  private readonly request: AudioRequest;
  private readonly ayahs: IAyahNumber[];
  private readonly reciter: Reciter;

  constructor(request: AudioRequest, ayahs: IAyahNumber[], reciter: Reciter) {
    this.request = request;
    this.ayahs = ayahs;
    this.reciter = reciter;
  }

  getRequest(): AudioRequest {
    return this.request;
  }

  getAyahNumberFrom(fileIndex: number, frameIndex: number): IAyahNumber {
    return this.ayahs[fileIndex];
  }

  getPlayerInfo(fileIndex: number): PlayerItemInfo {
    const ayah = this.ayahs[fileIndex];
    return {
      title: getLocalizedAyahName(ayah),
      artist: getReciterLocalizedName(this.reciter),
      image: undefined,
    };
  }
}

// ============================================================================
// GappedAudioRequestBuilder
// ============================================================================

/**
 * Builds audio requests for gapped (per-ayah) reciters.
 */
export class GappedAudioRequestBuilder implements QuranAudioRequestBuilder {
  async buildRequest(
    reciter: Reciter,
    from: IAyahNumber,
    to: IAyahNumber,
    frameRuns: Runs,
    requestRuns: Runs
  ): Promise<QuranAudioRequest> {
    const { urls, ayahs } = this.urlsToPlay(reciter, from, to, requestRuns);

    const files: AudioFile[] = urls.map((url) =>
      createAudioFile(url, [createAudioFrame(0, undefined)])
    );

    const request = createAudioRequest(files, { frameRuns, requestRuns });
    return new GappedAudioRequest(request, ayahs, reciter);
  }

  /**
   * Gets the local URLs to play for the given range.
   */
  private urlsToPlay(
    reciter: Reciter,
    from: IAyahNumber,
    to: IAyahNumber,
    requestRuns: Runs
  ): { urls: string[]; ayahs: IAyahNumber[] } {
    if (reciter.audioType.type !== 'gapped') {
      throw new Error('Unsupported reciter type gapless. Only gapped reciters can be played here.');
    }

    const urls: string[] = [];
    const ayahs: IAyahNumber[] = [];

    // Get all verses from start to end
    const verses = this.getVersesInRange(from, to);
    
    // Group by sura
    const surasDictionary = new Map<ISura, IAyahNumber[]>();
    for (const verse of verses) {
      const existing = surasDictionary.get(verse.sura) || [];
      existing.push(verse);
      surasDictionary.set(verse.sura, existing);
    }

    // Sort suras
    const sortedSuras = Array.from(surasDictionary.keys()).sort(
      (a, b) => a.suraNumber - b.suraNumber
    );

    for (const sura of sortedSuras) {
      const suraVerses = surasDictionary.get(sura) || [];

      // Add Bismillah for all except Al-Fatihah and At-Tawbah
      if (
        (requestRuns === Runs.One || ayahs.length > 0) &&
        sura.startsWithBesmAllah &&
        suraVerses[0].ayah === sura.firstVerse.ayah
      ) {
        // Add first verse of Quran (Bismillah)
        urls.push(getReciterLocalAyahPath(reciter, from.quran.firstVerse).url);
        ayahs.push(suraVerses[0]);
      }

      for (const verse of suraVerses) {
        urls.push(getReciterLocalAyahPath(reciter, verse).url);
        ayahs.push(verse);
      }
    }

    return { urls, ayahs };
  }

  /**
   * Gets all verses in the range.
   */
  private getVersesInRange(from: IAyahNumber, to: IAyahNumber): IAyahNumber[] {
    const verses: IAyahNumber[] = [];
    let current: IAyahNumber | undefined = from;

    while (current) {
      verses.push(current);
      
      if (
        current.sura.suraNumber === to.sura.suraNumber &&
        current.ayah === to.ayah
      ) {
        break;
      }

      current = current.next ?? undefined;
    }

    return verses;
  }
}
