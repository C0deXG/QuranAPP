/**
 * NoorSystemImage.swift → noor-system-image.ts
 *
 * System/icon image definitions.
 * Maps to SF Symbols on iOS or equivalent icons.
 *
 * In React Native, we use @expo/vector-icons or similar.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// System Image Names
// ============================================================================

/**
 * System image (icon) names.
 * These map to SF Symbols on iOS.
 */
export enum NoorSystemImage {
  Audio = 'headphones',
  Downloads = 'square.and.arrow.down',
  Download = 'icloud.and.arrow.down',
  Translation = 'globe',
  Share = 'square.and.arrow.up',
  Star = 'star',
  Mail = 'envelope',
  CheckmarkChecked = 'checkmark.circle.fill',
  CheckmarkUnchecked = 'circle',
  Checkmark = 'checkmark',
  Bookmark = 'bookmark.fill',
  Note = 'text.badge.star',
  LastPage = 'clock',
  Search = 'magnifyingglass',
  Mushafs = 'books.vertical.fill',
  Debug = 'ant',
  Play = 'play.fill',
  Stop = 'stop.fill',
  Pause = 'pause.fill',
  More = 'ellipsis.circle',
  Backward = 'backward.fill',
  Forward = 'forward.fill',
  Cancel = 'xmark',
}

// ============================================================================
// Icon Mapping for Ionicons
// ============================================================================

/**
 * Maps SF Symbol names to Ionicons names for cross-platform compatibility.
 * Used with @expo/vector-icons Ionicons.
 */
export const IoniconMap: Record<NoorSystemImage, string> = {
  [NoorSystemImage.Audio]: 'headset-outline',
  [NoorSystemImage.Downloads]: 'download-outline',
  [NoorSystemImage.Download]: 'cloud-download-outline',
  [NoorSystemImage.Translation]: 'globe-outline',
  [NoorSystemImage.Share]: 'share-outline',
  [NoorSystemImage.Star]: 'star-outline',
  [NoorSystemImage.Mail]: 'mail-outline',
  [NoorSystemImage.CheckmarkChecked]: 'checkmark-circle',
  [NoorSystemImage.CheckmarkUnchecked]: 'ellipse-outline',
  [NoorSystemImage.Checkmark]: 'checkmark',
  [NoorSystemImage.Bookmark]: 'bookmark',
  [NoorSystemImage.Note]: 'document-text-outline',
  [NoorSystemImage.LastPage]: 'time-outline',
  [NoorSystemImage.Search]: 'search-outline',
  [NoorSystemImage.Mushafs]: 'library-outline',
  [NoorSystemImage.Debug]: 'bug-outline',
  [NoorSystemImage.Play]: 'play',
  [NoorSystemImage.Stop]: 'stop',
  [NoorSystemImage.Pause]: 'pause',
  [NoorSystemImage.More]: 'ellipsis-horizontal-circle-outline',
  [NoorSystemImage.Backward]: 'play-back',
  [NoorSystemImage.Forward]: 'play-forward',
  [NoorSystemImage.Cancel]: 'close',
};

/**
 * Gets the Ionicons name for a system image.
 */
export function getIoniconName(image: NoorSystemImage): string {
  return IoniconMap[image];
}

// ============================================================================
// Icon Mapping for Material Icons
// ============================================================================

/**
 * Maps SF Symbol names to Material Icons names.
 * Used with @expo/vector-icons MaterialIcons.
 */
export const MaterialIconMap: Record<NoorSystemImage, string> = {
  [NoorSystemImage.Audio]: 'headset',
  [NoorSystemImage.Downloads]: 'download',
  [NoorSystemImage.Download]: 'cloud-download',
  [NoorSystemImage.Translation]: 'language',
  [NoorSystemImage.Share]: 'share',
  [NoorSystemImage.Star]: 'star-border',
  [NoorSystemImage.Mail]: 'email',
  [NoorSystemImage.CheckmarkChecked]: 'check-circle',
  [NoorSystemImage.CheckmarkUnchecked]: 'radio-button-unchecked',
  [NoorSystemImage.Checkmark]: 'check',
  [NoorSystemImage.Bookmark]: 'bookmark',
  [NoorSystemImage.Note]: 'note',
  [NoorSystemImage.LastPage]: 'access-time',
  [NoorSystemImage.Search]: 'search',
  [NoorSystemImage.Mushafs]: 'library-books',
  [NoorSystemImage.Debug]: 'bug-report',
  [NoorSystemImage.Play]: 'play-arrow',
  [NoorSystemImage.Stop]: 'stop',
  [NoorSystemImage.Pause]: 'pause',
  [NoorSystemImage.More]: 'more-horiz',
  [NoorSystemImage.Backward]: 'fast-rewind',
  [NoorSystemImage.Forward]: 'fast-forward',
  [NoorSystemImage.Cancel]: 'close',
};

/**
 * Gets the Material Icons name for a system image.
 */
export function getMaterialIconName(image: NoorSystemImage): string {
  return MaterialIconMap[image];
}

