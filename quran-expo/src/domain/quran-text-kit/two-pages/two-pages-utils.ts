/**
 * TwoPagesUtils.swift → two-pages-utils.ts
 *
 * Utilities for two-page display mode.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Dimensions, Platform } from 'react-native';

// ============================================================================
// Two Pages Utils
// ============================================================================

/**
 * Gets the default value for two pages setting.
 * Enable by default if not a phone (tablet/iPad).
 */
export function getTwoPagesSettingDefaultValue(): boolean {
  // In React Native, we can check if it's a tablet
  const { width, height } = Dimensions.get('window');
  const isTablet = Math.min(width, height) >= 600;
  return isTablet;
}

/**
 * Checks if there's enough horizontal space for two pages.
 */
export function hasEnoughHorizontalSpace(): boolean {
  const { width } = Dimensions.get('window');
  return width > 900;
}

/**
 * Checks if the device is a phone.
 */
export function isPhone(): boolean {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) < 600;
}

/**
 * Gets the appropriate number of pages to display.
 */
export function getPageCount(twoPagesEnabled: boolean): 1 | 2 {
  if (!twoPagesEnabled) return 1;
  if (!hasEnoughHorizontalSpace()) return 1;
  return 2;
}

