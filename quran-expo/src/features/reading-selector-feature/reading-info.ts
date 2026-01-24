/**
 * ReadingInfo.swift + Reading+Resources.swift → reading-info.ts
 *
 * Reading info and properties for the reading selector.
 *
 * Quran.com. All rights reserved.
 */

import { l } from '../../core/localization';
import { Reading, SORTED_READINGS } from '../../model/quran-kit';
import type { SuraHeaderLocation, AyahNumberLocation } from '../../model/quran-geometry';

// ============================================================================
// ReadingPropertyType
// ============================================================================

/**
 * Type of property support.
 */
export type ReadingPropertyType = 'supports' | 'lacks';

// ============================================================================
// ReadingProperty
// ============================================================================

/**
 * A property of a reading.
 */
export interface ReadingProperty {
  type: ReadingPropertyType;
  property: string;
}

// ============================================================================
// ReadingInfo
// ============================================================================

/**
 * Information about a reading for display in the selector.
 */
export interface ReadingInfo<T> {
  value: T;
  title: string;
  description: string;
  properties: ReadingProperty[];
}

/**
 * Create a ReadingInfo from a Reading.
 */
export function createReadingInfo(reading: Reading): ReadingInfo<Reading> {
  return {
    value: reading,
    title: getReadingTitle(reading),
    description: getReadingDescription(reading),
    properties: getReadingProperties(reading),
  };
}

/**
 * Get the ID for a ReadingInfo.
 */
export function getReadingInfoId(info: ReadingInfo<Reading>): string {
  return info.value;
}

// ============================================================================
// Reading Title
// ============================================================================

/**
 * Get the localized title for a reading.
 */
export function getReadingTitle(reading: Reading): string {
  switch (reading) {
    case Reading.hafs_1405:
      return l('reading.hafs-1405.title');
    case Reading.hafs_1421:
      return l('reading.hafs-1421.title');
    case Reading.hafs_1440:
      return l('reading.hafs-1440.title');
    case Reading.tajweed:
      return l('reading.tajweed.title');
    default:
      return reading;
  }
}

// ============================================================================
// Reading Description
// ============================================================================

/**
 * Get the localized description for a reading.
 */
export function getReadingDescription(reading: Reading): string {
  switch (reading) {
    case Reading.hafs_1405:
      return l('reading.hafs-1405.description');
    case Reading.hafs_1421:
      return l('reading.hafs-1421.description');
    case Reading.hafs_1440:
      return l('reading.hafs-1440.description');
    case Reading.tajweed:
      return l('reading.tajweed.description');
    default:
      return '';
  }
}

// ============================================================================
// Reading Properties
// ============================================================================

/**
 * Get the properties for a reading.
 */
export function getReadingProperties(reading: Reading): ReadingProperty[] {
  switch (reading) {
    case Reading.hafs_1405:
      return [
        { type: 'supports', property: l('reading.selector.property.hafs') },
        { type: 'supports', property: l('reading.hafs-1405.issue') },
        { type: 'supports', property: l('reading.selector.property.pages.604') },
        { type: 'supports', property: l('reading.selector.property.lines.15') },
        { type: 'supports', property: l('reading.selector.property.word-translation.supported') },
      ];
    case Reading.hafs_1421:
      return [
        { type: 'supports', property: l('reading.selector.property.hafs') },
        { type: 'supports', property: l('reading.hafs-1421.issue') },
        { type: 'supports', property: l('reading.selector.property.pages.604') },
        { type: 'supports', property: l('reading.selector.property.lines.15') },
        { type: 'lacks', property: l('reading.selector.property.word-translation.not-supported') },
      ];
    case Reading.hafs_1440:
      return [
        { type: 'supports', property: l('reading.selector.property.hafs') },
        { type: 'supports', property: l('reading.hafs-1440.issue') },
        { type: 'supports', property: l('reading.selector.property.pages.604') },
        { type: 'supports', property: l('reading.selector.property.lines.15') },
        { type: 'lacks', property: l('reading.selector.property.word-translation.not-supported') },
      ];
    case Reading.tajweed:
      return [
        { type: 'supports', property: l('reading.selector.property.hafs') },
        { type: 'supports', property: l('reading.selector.property.pages.604') },
        { type: 'supports', property: l('reading.selector.property.lines.15') },
        { type: 'lacks', property: l('reading.selector.property.word-translation.not-supported') },
      ];
    default:
      return [];
  }
}

// ============================================================================
// Reading Image Name
// ============================================================================

/**
 * Get the image name for a reading.
 */
export function getReadingImageName(reading: Reading): string {
  switch (reading) {
    case Reading.hafs_1405:
      return 'hafs_1405';
    case Reading.hafs_1421:
      return 'hafs_1421';
    case Reading.hafs_1440:
      return 'hafs_1440';
    case Reading.tajweed:
      return 'tajweed';
    default:
      return 'hafs_1405';
  }
}

// ============================================================================
// Reading Sura Headers (for preview)
// ============================================================================

/**
 * Get the sura headers for a reading (used in preview).
 */
export function getReadingSuraHeaders(_reading: Reading): SuraHeaderLocation[] {
  // Only hafs_1421 has preview sura headers
  // These are hardcoded values from the iOS implementation
  // Note: In actual implementation, these would come from the QuranKit model
  return [];
}

// ============================================================================
// Reading Ayah Numbers (for preview)
// ============================================================================

/**
 * Get the ayah numbers for a reading (used in preview).
 */
export function getReadingAyahNumbers(_reading: Reading): AyahNumberLocation[] {
  // Only hafs_1421 has preview ayah numbers
  // These are hardcoded values from the iOS implementation
  return [];
}

// ============================================================================
// Get All Readings
// ============================================================================

/**
 * Get all readings as ReadingInfo array.
 */
export function getAllReadings(): ReadingInfo<Reading>[] {
  return SORTED_READINGS.map(createReadingInfo);
}

