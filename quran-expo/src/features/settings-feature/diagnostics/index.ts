/**
 * Diagnostics - Diagnostics screen
 *
 * Provides:
 * - DiagnosticsBuilder for creating the diagnostics screen
 * - DiagnosticsViewModel for managing state
 * - DiagnosticsScreen component
 * - DiagnosticsService for building diagnostics data
 * - DiagnosticsPreferences for debug logging preference
 */

// Preferences
export { DiagnosticsPreferences } from './diagnostics-preferences';

// Service
export {
  DiagnosticsService,
  type DiagnosticsResult,
} from './diagnostics-service';

// View Model
export {
  DiagnosticsViewModel,
  type DiagnosticsViewState,
  initialDiagnosticsViewState,
} from './diagnostics-view-model';

// Screen
export { DiagnosticsScreen, type DiagnosticsScreenProps } from './DiagnosticsScreen';

// Builder
export { DiagnosticsBuilder } from './diagnostics-builder';

