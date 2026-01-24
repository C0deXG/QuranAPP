/**
 * ReadingSelectorFeature - Reading selector
 *
 * Translated from quran-ios/Features/ReadingSelectorFeature
 *
 * This module provides:
 * - ReadingSelectorBuilder for creating the reading selector screen
 * - ReadingSelectorViewModel for managing reading selection state
 * - ReadingSelectorScreen component for rendering
 * - ReadingInfo data model
 */

// Reading Info
export {
  type ReadingInfo,
  type ReadingProperty,
  type ReadingPropertyType,
  createReadingInfo,
  getReadingInfoId,
  getReadingTitle,
  getReadingDescription,
  getReadingProperties,
  getReadingImageName,
  getReadingSuraHeaders,
  getReadingAyahNumbers,
  getAllReadings,
} from './reading-info';

// View Model
export {
  ReadingSelectorViewModel,
  type ReadingSelectorViewState,
  initialReadingSelectorViewState,
} from './reading-selector-view-model';

// Screen
export { ReadingSelectorScreen, type ReadingSelectorScreenProps } from './ReadingSelectorScreen';

// Builder
export { ReadingSelectorBuilder } from './reading-selector-builder';

