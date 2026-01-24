/**
 * AppDependencies - Dependency Injection Container
 *
 * Translated from quran-ios/Features/AppDependencies
 *
 * This module provides:
 * - AppDependencies interface (DI container protocol)
 * - Factory methods for creating services
 */

export {
  type AppDependencies,
  type AppDependenciesWithFactories,
  getQuranUthmaniV2Database,
  createTextDataService,
  createNoteService,
  withFactories,
} from './app-dependencies';

