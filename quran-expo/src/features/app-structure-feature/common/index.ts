/**
 * AppStructureFeature/Common - Tab base components
 *
 * Translated from quran-ios/Features/AppStructureFeature/Common
 *
 * This module provides:
 * - TabBuildable interface for building tabs
 * - TabInteractor for handling navigation within tabs
 * - TabNavigator component (stack navigator for tabs)
 */

// Tab Builder
export { type TabBuildable, type TabConfig } from './tab-builder';

// Tab Interactor
export {
  TabInteractor,
  type TabPresenter,
  type QuranInput,
  createQuranInput,
  createTabPresenter,
} from './tab-interactor';

// Tab Navigator
export {
  TabNavigator,
  useTabInteractor,
  type TabNavigatorProps,
  type TabScreen,
} from './TabNavigator';

