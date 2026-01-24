/**
 * AudioUpdate.swift → audio-update.ts
 *
 * Audio update data models.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// AudioUpdates Types
// ============================================================================

/**
 * Represents a file update entry.
 */
export interface AudioUpdateFile {
  filename: string;
  md5: string;
}

/**
 * Represents an update for a specific reciter path.
 */
export interface AudioUpdate {
  path: string;
  databaseVersion?: number;
  files: AudioUpdateFile[];
}

/**
 * Represents the audio updates response.
 */
export interface AudioUpdates {
  currentRevision: number;
  updates: AudioUpdate[];
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Parses JSON into AudioUpdates.
 */
export function parseAudioUpdates(json: unknown): AudioUpdates | null {
  if (!json || typeof json !== 'object') {
    return null;
  }

  const data = json as Record<string, unknown>;

  if (typeof data.current_revision !== 'number' && typeof data.currentRevision !== 'number') {
    return null;
  }

  const currentRevision = (data.current_revision ?? data.currentRevision) as number;
  const updates = (data.updates ?? []) as Array<Record<string, unknown>>;

  return {
    currentRevision,
    updates: updates.map((u) => ({
      path: String(u.path ?? ''),
      databaseVersion: typeof u.database_version === 'number' 
        ? u.database_version 
        : (typeof u.databaseVersion === 'number' ? u.databaseVersion : undefined),
      files: (Array.isArray(u.files) ? u.files : []).map((f: Record<string, unknown>) => ({
        filename: String(f.filename ?? ''),
        md5: String(f.md5 ?? ''),
      })),
    })),
  };
}

