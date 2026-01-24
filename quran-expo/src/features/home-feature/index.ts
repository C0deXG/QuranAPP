/**
 * HomeFeature - Home screen
 *
 * Translated from quran-ios/Features/HomeFeature
 *
 * This module provides:
 * - HomeBuilder for creating the home screen
 * - HomeViewModel for managing home screen state
 * - HomeScreen component for rendering
 * - QuarterItem data model
 */

// Quarter Item
export {
  type QuarterItem,
  createQuarterItem,
  getQuarterItemId,
} from './quarter-item';

// View Model
export {
  HomeViewModel,
  HomeViewType,
  SurahSortOrder,
  type HomeViewState,
  initialHomeViewState,
} from './home-view-model';

// Screen
export { HomeScreen, type HomeScreenProps } from './HomeScreen';

// Builder
export { HomeBuilder } from './home-builder';

