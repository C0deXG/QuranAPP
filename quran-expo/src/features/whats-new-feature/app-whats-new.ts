/**
 * AppWhatsNew.swift → app-whats-new.ts
 *
 * What's new data models.
 *
 * Quran.com. All rights reserved.
 */

import { l, lTable, type TranslationTable } from '../../core/localization';

// ============================================================================
// WhatsNewItem
// ============================================================================

/**
 * A single what's new item.
 *
 * 1:1 translation of iOS WhatsNewItem.
 */
export interface WhatsNewItem {
  /** Localization key for title */
  title: string;

  /** Localization key for subtitle */
  subtitle: string;

  /** SF Symbol name for image */
  image: string;
}

/**
 * Get the localized title for a what's new item.
 */
export function getWhatsNewItemTitle(item: WhatsNewItem): string {
  return l(item.title);
}

/**
 * Get the localized subtitle for a what's new item.
 *
 * Supports embedded localization references like %%Readers:qari_muaiqly_haramain_gapless%%
 */
export function getWhatsNewItemSubtitle(item: WhatsNewItem): string {
  let text = l(item.subtitle);

  // Replace %%{table}:{key}%% patterns with localized text
  const pattern = /%%(.+?)%%/g;
  text = text.replace(pattern, (match, captured) => {
    return localizeEmbeddedText(captured);
  });

  return text;
}

/**
 * Localize an embedded text reference like "Readers:qari_muaiqly_haramain_gapless".
 */
function localizeEmbeddedText(text: string): string {
  const components = text.split(':');
  if (components.length !== 2) {
    return text;
  }

  const table = components[0] as TranslationTable;
  const key = components[1];

  return lTable(key, table);
}

// ============================================================================
// WhatsNewVersion
// ============================================================================

/**
 * A what's new version with items.
 *
 * 1:1 translation of iOS WhatsNewVersion.
 */
export interface WhatsNewVersion {
  /** Version string (e.g., "2.2.3") */
  version: string;

  /** Items for this version */
  items: WhatsNewItem[];
}

// ============================================================================
// AppWhatsNew
// ============================================================================

/**
 * Container for all what's new versions.
 *
 * 1:1 translation of iOS AppWhatsNew.
 */
export interface AppWhatsNew {
  versions: WhatsNewVersion[];
}

