/**
 * WhatsNewFeature - What's new display
 *
 * Translated from quran-ios/Features/WhatsNewFeature
 *
 * This feature provides:
 * - What's new content data
 * - Version tracking to show only new items
 * - Modal display with items and continue button
 * - Analytics logging
 *
 * Used on app launch to inform users about new features.
 */

// Data Models
export {
  type WhatsNewItem,
  type WhatsNewVersion,
  type AppWhatsNew,
  getWhatsNewItemTitle,
  getWhatsNewItemSubtitle,
} from './app-whats-new';

// Content Data
export { whatsNewData } from './whats-new-data';

// Version Store
export {
  AppWhatsNewVersionStore,
  useWhatsNewVersion,
} from './app-whats-new-version-store';

// Controller
export { AppWhatsNewController } from './app-whats-new-controller';

// Screen
export {
  WhatsNewScreen,
  type WhatsNewScreenProps,
} from './WhatsNewScreen';

// Hook
export { useWhatsNew, type UseWhatsNewResult } from './useWhatsNew';

