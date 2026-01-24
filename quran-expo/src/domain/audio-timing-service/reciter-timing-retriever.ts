/**
 * ReciterTimingRetriever.swift → reciter-timing-retriever.ts
 *
 * Retrieves audio timing data for reciters.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { createLogger } from '../../core/logging';
import type { AyahTimingPersistence } from '../../data/audio-timing-persistence';
import { SQLiteAyahTimingPersistence } from '../../data/audio-timing-persistence';
import type { Reciter } from '../../model/quran-audio';
import type { RangeTiming, SuraTiming, Timing, AyahTiming } from '../../model/quran-audio';
import { createRangeTiming, createSuraTiming, reciterLocalDatabasePath } from '../../model/quran-audio';
import type { IAyahNumber, ISura } from '../../model/quran-kit/types';

const logger = createLogger('ReciterTimingRetriever');

// ============================================================================
// Types
// ============================================================================

/**
 * Factory function for creating persistence instances.
 */
export type AyahTimingPersistenceFactory = (databasePath: string) => AyahTimingPersistence;

// ============================================================================
// ReciterTimingRetriever
// ============================================================================

/**
 * Retrieves audio timing data for reciters.
 */
export class ReciterTimingRetriever {
  private readonly persistenceFactory: AyahTimingPersistenceFactory;

  constructor(
    persistenceFactory: AyahTimingPersistenceFactory = (path) =>
      SQLiteAyahTimingPersistence.fromPath(path)
  ) {
    this.persistenceFactory = persistenceFactory;
  }

  /**
   * Gets timing data for a range of ayahs.
   */
  async timing(
    reciter: Reciter,
    start: IAyahNumber,
    end: IAyahNumber
  ): Promise<RangeTiming> {
    const suras = this.getSurasInRange(start, end);
    const timings = await this.retrieveTiming(reciter, suras);

    // Determine end time
    const endTime = this.getEndTime(timings, start, end);

    // Filter out unneeded timings
    const filteredTimings = this.filterTimings(timings, start, end);

    return createRangeTiming({
      timings: filteredTimings,
      endTime,
    });
  }

  /**
   * Gets all suras in the range from start to end ayah.
   */
  private getSurasInRange(start: IAyahNumber, end: IAyahNumber): ISura[] {
    const suras: ISura[] = [];
    let currentSura: ISura | undefined = start.sura;

    while (currentSura && currentSura.suraNumber <= end.sura.suraNumber) {
      suras.push(currentSura);
      currentSura = currentSura.next;
    }

    return suras;
  }

  /**
   * Retrieves timing data from the database.
   */
  private async retrieveTiming(
    reciter: Reciter,
    suras: ISura[]
  ): Promise<Map<number, SuraTiming>> {
    const databasePath = reciterLocalDatabasePath(reciter);
    if (!databasePath) {
      throw new Error('Gapped reciters are not supported.');
    }

    const persistence = this.persistenceFactory(databasePath.url);

    const result = new Map<number, SuraTiming>();

    for (const sura of suras) {
      const timings = await persistence.getOrderedTimingForSura(sura.firstVerse);
      result.set(sura.suraNumber, timings);
    }

    return result;
  }

  /**
   * Gets the end time for the range.
   */
  private getEndTime(
    timings: Map<number, SuraTiming>,
    start: IAyahNumber,
    end: IAyahNumber
  ): Timing | null {
    const lastSuraTimings = timings.get(end.sura.suraNumber);
    if (!lastSuraTimings) {
      logger.error("lastSuraTimings doesn't exist for end sura");
      return null;
    }

    // Check if end is the last verse in the sura
    const lastVerse = lastSuraTimings.verses[lastSuraTimings.verses.length - 1];
    if (lastVerse && this.ayahEquals(lastVerse.ayah, end)) {
      return lastSuraTimings.endTime ?? null;
    }

    // Find the next ayah's timing as the end time
    const endIndex = lastSuraTimings.verses.findIndex((v) =>
      this.ayahEquals(v.ayah, end)
    );
    if (endIndex !== -1 && endIndex + 1 < lastSuraTimings.verses.length) {
      return lastSuraTimings.verses[endIndex + 1].time;
    }

    logger.error("lastSuraTimings doesn't have the end verse");
    return null;
  }

  /**
   * Filters timings to only include ayahs in the range.
   */
  private filterTimings(
    timings: Map<number, SuraTiming>,
    start: IAyahNumber,
    end: IAyahNumber
  ): Map<number, SuraTiming> {
    const ayahSet = this.getAyahsInRange(start, end);
    const result = new Map<number, SuraTiming>();

    for (const [suraNumber, suraTimings] of timings) {
      let endTime: Timing | undefined;

      // Include end time only if the last verse is in our range
      if (suraTimings.endTime) {
        const lastVerse = suraTimings.verses[suraTimings.verses.length - 1];
        if (lastVerse && this.isAyahInSet(lastVerse.ayah, ayahSet)) {
          endTime = suraTimings.endTime;
        }
      }

      const filteredVerses = suraTimings.verses.filter((v) =>
        this.isAyahInSet(v.ayah, ayahSet)
      );

      result.set(
        suraNumber,
        createSuraTiming({
          verses: filteredVerses,
          endTime,
        })
      );
    }

    return result;
  }

  /**
   * Gets a set of all ayahs in the range.
   */
  private getAyahsInRange(start: IAyahNumber, end: IAyahNumber): Set<string> {
    const set = new Set<string>();
    let current: IAyahNumber | undefined = start;

    while (current) {
      set.add(this.ayahKey(current));
      if (this.ayahEquals(current, end)) {
        break;
      }
      current = current.next;
    }

    return set;
  }

  /**
   * Creates a unique key for an ayah.
   */
  private ayahKey(ayah: IAyahNumber): string {
    return `${ayah.sura.suraNumber}:${ayah.ayah}`;
  }

  /**
   * Checks if two ayahs are equal.
   */
  private ayahEquals(a: IAyahNumber, b: IAyahNumber): boolean {
    return a.sura.suraNumber === b.sura.suraNumber && a.ayah === b.ayah;
  }

  /**
   * Checks if an ayah is in a set.
   */
  private isAyahInSet(ayah: IAyahNumber, set: Set<string>): boolean {
    return set.has(this.ayahKey(ayah));
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a reciter timing retriever.
 */
export function createReciterTimingRetriever(): ReciterTimingRetriever {
  return new ReciterTimingRetriever();
}
