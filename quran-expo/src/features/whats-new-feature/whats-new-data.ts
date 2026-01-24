/**
 * whats-new.plist → whats-new-data.ts
 *
 * What's new content data.
 *
 * Quran.com. All rights reserved.
 */

import type { WhatsNewVersion } from './app-whats-new';

// ============================================================================
// What's New Data
// ============================================================================

/**
 * What's new content data.
 *
 * Converted from iOS whats-new.plist
 */
export const whatsNewData: WhatsNewVersion[] = [
  {
    version: '2.2.3',
    items: [
      {
        title: 'new.mushafs',
        subtitle: 'new.mushafs.details',
        image: 'books.vertical.fill',
      },
      {
        title: 'new.reciters',
        subtitle: 'new.reciters.details',
        image: 'mic.fill',
      },
      {
        title: 'new.miscellaneous',
        subtitle: 'new.miscellaneous.details',
        image: 'sparkles',
      },
    ],
  },
];

