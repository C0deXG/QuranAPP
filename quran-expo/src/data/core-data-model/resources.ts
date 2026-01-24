/**
 * Resources.swift → resources.ts
 *
 * Resource paths and database configuration.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { getDatabasePath } from '../sqlite-persistence';

/**
 * Database file name for annotations.
 */
export const ANNOTATIONS_DB_NAME = 'annotations.db';

/**
 * Gets the full path to the annotations database.
 */
export function getAnnotationsDatabasePath(): string {
  return getDatabasePath(ANNOTATIONS_DB_NAME);
}

/**
 * Current schema version for the annotations database.
 */
export const ANNOTATIONS_SCHEMA_VERSION = 1;

/**
 * Configuration for the annotations database.
 */
export const AnnotationsDatabaseConfig = {
  name: ANNOTATIONS_DB_NAME,
  version: ANNOTATIONS_SCHEMA_VERSION,
} as const;

