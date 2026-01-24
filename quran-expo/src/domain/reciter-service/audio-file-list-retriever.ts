/**
 * AudioFileListRetriever.swift → audio-file-list-retriever.ts
 *
 * Retrieves list of audio files for download.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { Reciter, AudioType } from '../../model/quran-audio';
import {
  reciterDatabaseRemoteURL,
  reciterLocalURLForAyah,
  reciterLocalURLForSura,
  reciterLocalZipPath,
  reciterRemoteURLForAyah,
  reciterRemoteURLForSura,
} from '../../model/quran-audio';
import type { IAyahNumber, ISura } from '../../model/quran-kit/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents an audio file to download.
 */
export interface ReciterAudioFile {
  /** Remote URL to download from */
  remote: string;
  /** Local path to save to (relative to documents) */
  local: string;
  /** Sura this file belongs to (if applicable) */
  sura?: ISura;
}

/**
 * Creates a ReciterAudioFile.
 */
export function createReciterAudioFile(params: {
  remote: string;
  local: string;
  sura?: ISura;
}): ReciterAudioFile {
  return {
    remote: params.remote,
    local: params.local,
    sura: params.sura,
  };
}

// ============================================================================
// AudioFileListRetriever
// ============================================================================

/**
 * Gets the list of audio files needed for a range of ayahs.
 */
export function getAudioFiles(
  reciter: Reciter,
  baseURL: string,
  from: IAyahNumber,
  to: IAyahNumber
): ReciterAudioFile[] {
  if (reciter.audioType.type === 'gapless') {
    return getGaplessAudioFiles(reciter, baseURL, from, to);
  } else {
    return getGappedAudioFiles(reciter, from, to);
  }
}

/**
 * Gets audio files for gapless reciter.
 */
function getGaplessAudioFiles(
  reciter: Reciter,
  baseURL: string,
  from: IAyahNumber,
  to: IAyahNumber
): ReciterAudioFile[] {
  const files: ReciterAudioFile[] = [];
  const seenRemotes = new Set<string>();

  // Add database file
  const databaseRemoteURL = getDatabaseRemoteURL(reciter, baseURL);
  const localZipPath = reciterLocalZipPath(reciter)?.path;

  if (databaseRemoteURL && localZipPath) {
    files.push(
      createReciterAudioFile({
        remote: databaseRemoteURL,
        local: localZipPath,
      })
    );
  }

  // Add sura files
  const suras = getSurasInRange(from, to);
  for (const sura of suras) {
    const remoteURL = getRemoteURL(reciter, sura);
    const localPath = getLocalPath(reciter, sura);

    if (!seenRemotes.has(remoteURL)) {
      seenRemotes.add(remoteURL);
      files.push(
        createReciterAudioFile({
          remote: remoteURL,
          local: localPath,
          sura,
        })
      );
    }
  }

  return files;
}

/**
 * Gets audio files for gapped reciter.
 */
function getGappedAudioFiles(
  reciter: Reciter,
  from: IAyahNumber,
  to: IAyahNumber
): ReciterAudioFile[] {
  const files: ReciterAudioFile[] = [];
  const seenRemotes = new Set<string>();

  // Add Bismillah (first verse of Quran)
  const firstVerse = from.quran.firstVerse;
  const bismillahRemote = getRemoteURLForAyah(reciter, firstVerse);
  const bismillahLocal = getLocalPathForAyah(reciter, firstVerse);
  files.push(
    createReciterAudioFile({
      remote: bismillahRemote,
      local: bismillahLocal,
    })
  );
  seenRemotes.add(bismillahRemote);

  // Add all ayahs in range
  const ayahs = getAyahsInRange(from, to);
  for (const ayah of ayahs) {
    const remoteURL = getRemoteURLForAyah(reciter, ayah);
    if (!seenRemotes.has(remoteURL)) {
      seenRemotes.add(remoteURL);
      files.push(
        createReciterAudioFile({
          remote: remoteURL,
          local: getLocalPathForAyah(reciter, ayah),
          sura: ayah.sura,
        })
      );
    }
  }

  return files;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the database remote URL for a gapless reciter.
 */
function getDatabaseRemoteURL(reciter: Reciter, baseURL: string): string | null {
  if (reciter.audioType.type !== 'gapless') return null;
  return reciterDatabaseRemoteURL(reciter, baseURL) ?? null;
}

/**
 * Gets the remote URL for a sura (gapless).
 */
function getRemoteURL(reciter: Reciter, sura: ISura): string {
  return reciterRemoteURLForSura(reciter, sura);
}

/**
 * Gets the local path for a sura (gapless).
 */
function getLocalPath(reciter: Reciter, sura: ISura): string {
  return reciterLocalURLForSura(reciter, sura).path;
}

/**
 * Gets the remote URL for an ayah (gapped).
 */
function getRemoteURLForAyah(reciter: Reciter, ayah: IAyahNumber): string {
  return reciterRemoteURLForAyah(reciter, ayah);
}

/**
 * Gets the local path for an ayah (gapped).
 */
function getLocalPathForAyah(reciter: Reciter, ayah: IAyahNumber): string {
  return reciterLocalURLForAyah(reciter, ayah).path;
}

/**
 * Gets all suras in a range of ayahs.
 */
function getSurasInRange(from: IAyahNumber, to: IAyahNumber): ISura[] {
  const suras: ISura[] = [];
  let current: ISura | null = from.sura;

  while (current && current.suraNumber <= to.sura.suraNumber) {
    suras.push(current);
    current = current.next;
  }

  return suras;
}

/**
 * Gets all ayahs in a range.
 */
function getAyahsInRange(from: IAyahNumber, to: IAyahNumber): IAyahNumber[] {
  const ayahs: IAyahNumber[] = [];
  let current: IAyahNumber | null = from;

  while (current) {
    ayahs.push(current);
    if (current.sura.suraNumber === to.sura.suraNumber && current.ayah === to.ayah) {
      break;
    }
    current = current.next;
  }

  return ayahs;
}
