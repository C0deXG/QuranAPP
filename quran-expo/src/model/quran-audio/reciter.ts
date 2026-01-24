/**
 * Reciter.swift + Reciter+URLs.swift → reciter.ts
 *
 * Reciter model for Quran audio.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { RelativeFilePath } from '../../core/utilities/relative-file-path';
import { as3DigitString } from '../../core/utilities/number';
import type { ISura, IAyahNumber } from '../quran-kit/types';

// ============================================================================
// Constants
// ============================================================================

const AUDIO_EXTENSION = 'mp3';
const DATABASE_REMOTE_FILE_EXTENSION = 'zip';
const DATABASE_LOCAL_FILE_EXTENSION = 'db';
const AUDIO_FILES_PATH_COMPONENT = 'audio_files';
const AUDIO_REMOTE_PATH = 'hafs/databases/audio/';

function reciterBaseURL(reciter: Reciter): string {
  return reciter.audioURL.endsWith('/')
    ? reciter.audioURL.slice(0, -1)
    : reciter.audioURL;
}

function buildReciterRemoteURL(reciter: Reciter, fileName: string): string {
  return `${reciterBaseURL(reciter)}/${fileName}.${AUDIO_EXTENSION}`;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Type of audio files.
 */
export type AudioType =
  | { type: 'gapless'; databaseName: string }
  | { type: 'gapped' };

/**
 * Creates a gapless AudioType.
 */
export function gaplessAudioType(databaseName: string): AudioType {
  return { type: 'gapless', databaseName };
}

/**
 * Creates a gapped AudioType.
 */
export function gappedAudioType(): AudioType {
  return { type: 'gapped' };
}

/**
 * Checks if an AudioType is gapless.
 */
export function isGapless(
  audioType: AudioType
): audioType is { type: 'gapless'; databaseName: string } {
  return audioType.type === 'gapless';
}

/**
 * AudioType constants for use in comparisons.
 */
export const AudioType = {
  gapless: 'gapless' as const,
  gapped: 'gapped' as const,
};

/**
 * Check if AudioType is gapped.
 */
export function isGapped(audioType: AudioType): audioType is { type: 'gapped' } {
  return audioType.type === 'gapped';
}

/**
 * Gapped audio type constant.
 */
export const AudioTypeGapped = gappedAudioType();

/**
 * Creates a gapless AudioType constant (factory function for type compatibility).
 */
export function AudioTypeGapless(databaseName: string): AudioType {
  return gaplessAudioType(databaseName);
}

/**
 * Gets a list of audio files for a reciter and verse range.
 */
export function getReciterAudioFiles(
  reciter: Reciter,
  _baseURL: string,
  from: { sura: { suraNumber: number }; ayah: number },
  to: { sura: { suraNumber: number }; ayah: number }
): { remote: string; local: string }[] {
  const files: { remote: string; local: string }[] = [];
  
  // Generate file list for the range
  // This is a simplified implementation
  const localFolder = reciterLocalFolder(reciter);
  
  // For gapped audio, each ayah is a separate file
  if (isGapped(reciter.audioType)) {
    // Iterate through suras and ayahs
    for (let suraNum = from.sura.suraNumber; suraNum <= to.sura.suraNumber; suraNum++) {
      const startAyah = suraNum === from.sura.suraNumber ? from.ayah : 1;
      const endAyah = suraNum === to.sura.suraNumber ? to.ayah : 286; // Max ayahs in any sura
      
      for (let ayahNum = startAyah; ayahNum <= endAyah; ayahNum++) {
        const fileName = `${as3DigitString(suraNum)}${as3DigitString(ayahNum)}`;
        files.push({
          remote: buildReciterRemoteURL(reciter, fileName),
          local: `${localFolder.path}/${fileName}.${AUDIO_EXTENSION}`,
        });
      }
    }
  } else {
    // For gapless audio, each sura is a file
    for (let suraNum = from.sura.suraNumber; suraNum <= to.sura.suraNumber; suraNum++) {
      const fileName = `${as3DigitString(suraNum)}`;
      files.push({
        remote: buildReciterRemoteURL(reciter, fileName),
        local: `${localFolder.path}/${fileName}.${AUDIO_EXTENSION}`,
      });
    }
  }
  
  return files;
}

/**
 * Category of reciter.
 */
export enum ReciterCategory {
  Arabic = 'arabic',
  English = 'english',
  ArabicEnglish = 'arabicEnglish',
}

/**
 * Represents a Quran reciter.
 */
export interface Reciter {
  /** Unique identifier */
  readonly id: number;
  /** Localization key for the reciter name */
  readonly nameKey: string;
  /** Directory name for storing audio files */
  readonly directory: string;
  /** Remote URL for audio files */
  readonly audioURL: string;
  /** Type of audio (gapless or gapped) */
  readonly audioType: AudioType;
  /** Whether a gapless alternative exists */
  readonly hasGaplessAlternative: boolean;
  /** Category of the reciter */
  readonly category: ReciterCategory;
  /** Local folder path (computed) */
  readonly localFolder?: string;
  /** Local database path (computed) */
  readonly localDatabasePath?: string;
  /** Local zip path (computed) */
  readonly localZipPath?: string;
  /** Localized name of the reciter */
  readonly localizedName?: string;
}

/**
 * Creates a Reciter.
 */
export function createReciter(params: {
  id: number;
  nameKey: string;
  directory: string;
  audioURL: string;
  audioType: AudioType;
  hasGaplessAlternative: boolean;
  category: ReciterCategory;
}): Reciter {
  return {
    id: params.id,
    nameKey: params.nameKey,
    directory: params.directory,
    audioURL: params.audioURL,
    audioType: params.audioType,
    hasGaplessAlternative: params.hasGaplessAlternative,
    category: params.category,
  };
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Gets the audio files base directory.
 */
export function audioFilesPath(): RelativeFilePath {
  return new RelativeFilePath(AUDIO_FILES_PATH_COMPONENT, true);
}

/**
 * Gets the local folder for a reciter.
 */
export function reciterLocalFolder(reciter: Reciter): RelativeFilePath {
  return audioFilesPath().appendingPathComponent(reciter.directory, true);
}

/**
 * Gets the old local folder (for migration).
 */
export function reciterOldLocalFolder(reciter: Reciter): RelativeFilePath {
  return new RelativeFilePath(reciter.directory, true);
}

/**
 * Gets the local database path for a gapless reciter.
 */
export function reciterLocalDatabasePath(
  reciter: Reciter
): RelativeFilePath | undefined {
  if (!isGapless(reciter.audioType)) {
    return undefined;
  }
  const baseFileName = reciterLocalFolder(reciter).appendingPathComponent(
    reciter.audioType.databaseName,
    true
  );
  return baseFileName.appendingPathExtension(DATABASE_LOCAL_FILE_EXTENSION);
}

/**
 * Gets the local zip path for a gapless reciter database.
 */
export function reciterLocalZipPath(
  reciter: Reciter
): RelativeFilePath | undefined {
  const dbPath = reciterLocalDatabasePath(reciter);
  if (!dbPath) {
    return undefined;
  }
  return dbPath
    .deletingPathExtension
    .appendingPathExtension(DATABASE_REMOTE_FILE_EXTENSION);
}

/**
 * Gets the remote URL for the database of a gapless reciter.
 */
export function reciterDatabaseRemoteURL(
  reciter: Reciter,
  baseURL: string
): string | undefined {
  if (!isGapless(reciter.audioType)) {
    return undefined;
  }

  const audioDatabaseURL = `${baseURL}/${AUDIO_REMOTE_PATH}`;
  return `${audioDatabaseURL}${reciter.audioType.databaseName}.${DATABASE_REMOTE_FILE_EXTENSION}`;
}

/**
 * Gets the remote URL for a sura's audio file.
 */
export function reciterRemoteURLForSura(reciter: Reciter, sura: ISura): string {
  const fileName = as3DigitString(sura.suraNumber);
  return buildReciterRemoteURL(reciter, fileName);
}

/**
 * Gets the local path for a sura's audio file.
 */
export function reciterLocalURLForSura(
  reciter: Reciter,
  sura: ISura
): RelativeFilePath {
  const fileName = as3DigitString(sura.suraNumber);
  return reciterLocalFolder(reciter)
    .appendingPathComponent(fileName, true)
    .appendingPathExtension(AUDIO_EXTENSION);
}

/**
 * Gets the remote URL for an ayah's audio file.
 */
export function reciterRemoteURLForAyah(
  reciter: Reciter,
  ayah: IAyahNumber
): string {
  const fileName =
    as3DigitString(ayah.sura.suraNumber) + as3DigitString(ayah.ayah);
  return buildReciterRemoteURL(reciter, fileName);
}

/**
 * Gets the local path for an ayah's audio file.
 */
export function reciterLocalURLForAyah(
  reciter: Reciter,
  ayah: IAyahNumber
): RelativeFilePath {
  const fileName =
    as3DigitString(ayah.sura.suraNumber) + as3DigitString(ayah.ayah);
  return reciterLocalFolder(reciter)
    .appendingPathComponent(fileName, true)
    .appendingPathExtension(AUDIO_EXTENSION);
}

/**
 * Checks if a directory URL belongs to this reciter.
 */
export function isReciterDirectory(
  reciter: Reciter,
  directoryURL: string
): boolean {
  const lastComponent = directoryURL.split('/').pop() ?? '';
  return reciter.directory === lastComponent;
}

// ============================================================================
// Comparison
// ============================================================================

/**
 * Checks if two reciters are equal.
 */
export function recitersEqual(a: Reciter, b: Reciter): boolean {
  return a.id === b.id;
}

/**
 * Gets a hash code for a reciter.
 */
export function reciterHashCode(reciter: Reciter): number {
  return reciter.id;
}
