/**
 * NoorUI/Images - Image assets
 *
 * Translated from quran-ios/UI/NoorUI/Images
 *
 * This module provides:
 * - Custom image assets (ayah-end, sura header, etc.)
 * - System image/icon mappings
 */

// Custom Images
export {
  NoorImage,
  NoorImageSource,
  getNoorImageSource,
} from './noor-image';

// System Images / Icons
export {
  NoorSystemImage,
  IoniconMap,
  MaterialIconMap,
  getIoniconName,
  getMaterialIconName,
} from './noor-system-image';

// Alias for compatibility
export { getIoniconName as mapSFSymbolToIonicon } from './noor-system-image';

