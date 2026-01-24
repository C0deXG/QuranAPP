/**
 * NoorImage.swift → noor-image.ts
 *
 * Custom image assets for the app.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { ImageSourcePropType } from 'react-native';

// ============================================================================
// Noor Image Assets
// ============================================================================

/**
 * Custom image assets used in the app.
 */
export enum NoorImage {
  AyahEnd = 'ayahEnd',
  Pointer = 'pointer',
  RotateToLandscape = 'rotateToLandscape',
  RotateToPortrait = 'rotateToPortrait',
  Settings = 'settings',
  SettingsFilled = 'settingsFilled',
  SuraHeader = 'suraHeader',
}

/**
 * Image source map for Noor images.
 * Note: Actual asset requires may need adjustment based on bundled assets.
 */
export const NoorImageSource: Record<NoorImage, ImageSourcePropType> = {
  [NoorImage.AyahEnd]: require('./assets/ayah-end.png'),
  [NoorImage.Pointer]: require('./assets/pointer-25.png'),
  [NoorImage.RotateToLandscape]: require('./assets/rotate_to_landscape-25.png'),
  [NoorImage.RotateToPortrait]: require('./assets/rotate_to_portrait-25.png'),
  [NoorImage.Settings]: require('./assets/settings-25.png'),
  [NoorImage.SettingsFilled]: require('./assets/settings_filled-25.png'),
  [NoorImage.SuraHeader]: require('./assets/sura_header.png'),
};

/**
 * Gets the image source for a Noor image.
 */
export function getNoorImageSource(image: NoorImage): ImageSourcePropType {
  return NoorImageSource[image];
}

