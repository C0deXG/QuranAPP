/**
 * AppStructureFeature/App - Main app builder and navigator
 *
 * Translated from quran-ios/Features/AppStructureFeature/App
 *
 * This module provides:
 * - AppBuilder for creating the app
 * - AppInteractor for app-level logic
 * - AppNavigator component (tab bar controller)
 */

// App Builder
export { AppBuilder } from './app-builder';

// App Interactor
export { AppInteractor, type AppPresenter } from './app-interactor';

// App Navigator
export {
  AppNavigator,
  createAppInteractor,
  useAppInteractor,
  type AppNavigatorProps,
} from './AppNavigator';

