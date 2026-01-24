/**
 * GaplessAudioRequestBuilder.swift → gapless-audio-request-builder.ts
 *
 * Builds audio requests for gapless (per-sura) reciters.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IAyahNumber, ISura } from '../../../model/quran-kit/types';
import * as LegacyFS from 'expo-file-system/legacy';
import type { Reciter } from '../../../model/quran-audio';
import { AudioType, getReciterLocalSuraPath, reciterLocalDatabasePath } from '../../../model/quran-audio';
import type { AudioRequest, AudioFile, AudioFrame } from '../../../core/queue-player/audio-request';
import { createAudioRequest, createAudioFile, createAudioFrame } from '../../../core/queue-player/audio-request';
import type { PlayerItemInfo } from '../../../core/queue-player/player-item-info';
import { Runs } from '../../../core/queue-player/runs';
import type { QuranAudioRequest, QuranAudioRequestBuilder } from './quran-audio-request';
import { ReciterTimingRetriever } from '../../audio-timing-service';
import { getLocalizedSuraName } from '../../quran-text-kit';
import { getReciterLocalizedName } from '../../reciter-service';

// ============================================================================
// GaplessAudioRequest
// ============================================================================

/**
 * Audio request for gapless reciters.
 */
class GaplessAudioRequest implements QuranAudioRequest {
  private readonly request: AudioRequest;
  private readonly ayahs: IAyahNumber[][];
  private readonly reciter: Reciter;

  constructor(request: AudioRequest, ayahs: IAyahNumber[][], reciter: Reciter) {
    this.request = request;
    this.ayahs = ayahs;
    this.reciter = reciter;
  }

  getRequest(): AudioRequest {
    return this.request;
  }

  getAyahNumberFrom(fileIndex: number, frameIndex: number): IAyahNumber {
    return this.ayahs[fileIndex][frameIndex];
  }

  getPlayerInfo(fileIndex: number): PlayerItemInfo {
    const firstAyah = this.ayahs[fileIndex][0];
    return {
      title: getLocalizedSuraName(firstAyah.sura),
      artist: getReciterLocalizedName(this.reciter),
      image: undefined,
    };
  }
}

// ============================================================================
// GaplessAudioRequestBuilder
// ============================================================================

/**
 * Builds audio requests for gapless (per-sura) reciters.
 */
export class GaplessAudioRequestBuilder implements QuranAudioRequestBuilder {
  private readonly timingRetriever = new ReciterTimingRetriever();

  async buildRequest(
    reciter: Reciter,
    from: IAyahNumber,
    to: IAyahNumber,
    frameRuns: Runs,
    requestRuns: Runs
  ): Promise<QuranAudioRequest> {
    const databasePath = reciterLocalDatabasePath(reciter);
    if (!databasePath) {
      throw new Error('Gapless reciters require a timing database.');
    }

    const dbInfo = await LegacyFS.getInfoAsync(databasePath.url);
    if (!dbInfo.exists) {
      throw new Error('Timing database is missing. Please download audio for this reciter.');
    }

    // Get timing data
    const range = await this.timingRetriever.timing(reciter, from, to);
    
    // Get sura paths from the range
    // range.timings is Map<number, SuraTiming> where key is sura number
    const suraNumbers = Array.from(range.timings.keys()).sort((a, b) => a - b);
    const suras = suraNumbers.map(sn => from.quran.suras[sn - 1]).filter((s): s is ISura => s !== undefined);
    const surasPaths = this.urlsToPlay(reciter, suras);

    const files: AudioFile[] = [];
    const ayahs: IAyahNumber[][] = [];

    for (const { path, sura } of surasPaths) {
      const suraTimings = range.timings.get(sura.suraNumber);
      if (!suraTimings) continue;

      const frames: AudioFrame[] = [];
      const fileAyahs: IAyahNumber[] = [];

      for (let offset = 0; offset < suraTimings.verses.length; offset++) {
        const verse = suraTimings.verses[offset];
        const isLastVerse = offset === suraTimings.verses.length - 1;
        const endTime = isLastVerse ? suraTimings.endTime : undefined;

        let startTimeSeconds = verse.time.seconds;

        // Do not include the basmalah when the first verse is repeated
        if (offset === 0 && verse.ayah.ayah === 1 && (requestRuns === Runs.One || ayahs.length > 0)) {
          startTimeSeconds = 0;
        }

        frames.push(createAudioFrame(startTimeSeconds, endTime?.seconds));
        fileAyahs.push(verse.ayah);
      }

      files.push(createAudioFile(path, frames));
      ayahs.push(fileAyahs);
    }

    const request = createAudioRequest(files, {
      endTime: range.endTime?.seconds,
      frameRuns,
      requestRuns,
    });

    return new GaplessAudioRequest(request, ayahs, reciter);
  }

  /**
   * Gets the local URLs to play for the given suras.
   */
  private urlsToPlay(
    reciter: Reciter,
    suras: ISura[]
  ): Array<{ path: string; sura: ISura }> {
    if (reciter.audioType.type !== 'gapless') {
      throw new Error('Unsupported reciter type gapped. Only gapless reciters can be played here.');
    }

    return suras.map((sura) => {
      const localPath = getReciterLocalSuraPath(reciter, sura);
      return {
        path: localPath.url,
        sura,
      };
    });
  }
}
