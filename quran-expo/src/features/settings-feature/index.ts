/**
 * SettingsFeature - Settings screen
 *
 * Translated from quran-ios/Features/SettingsFeature
 *
 * This module provides:
 * - SettingsBuilder for creating the settings screen
 * - SettingsViewModel for managing settings state
 * - SettingsScreen component for rendering
 * - ContactUsService for contact form
 * - Diagnostics sub-feature
 */

// Contact Us
export { ContactUsService } from './contact-us-service';

// Appearance Mode Selector
export { AppearanceModeSelector, type AppearanceModeSelectorProps } from './AppearanceModeSelector';

// View Model
export {
  SettingsViewModel,
  type SettingsViewState,
  type SettingsNavigation,
} from './settings-view-model';

// Screen
export { SettingsScreen, type SettingsScreenProps } from './SettingsScreen';

// Builder
export { SettingsBuilder } from './settings-builder';

// Diagnostics
export * from './diagnostics';

