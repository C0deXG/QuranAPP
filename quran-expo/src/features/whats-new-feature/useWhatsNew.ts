/**
 * useWhatsNew.ts
 *
 * React hook for what's new feature.
 *
 * Quran.com. All rights reserved.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AnalyticsLibrary } from '../../core/analytics';
import type { WhatsNewVersion } from './app-whats-new';
import { AppWhatsNewController } from './app-whats-new-controller';

// ============================================================================
// useWhatsNew Hook
// ============================================================================

export interface UseWhatsNewResult {
  /** Versions to show */
  versions: WhatsNewVersion[];

  /** Whether the what's new modal should be visible */
  visible: boolean;

  /** Dismiss the what's new modal */
  dismiss: () => void;

  /** Check and show what's new if needed */
  checkAndShow: () => Promise<void>;
}

/**
 * Hook for managing what's new display.
 *
 * @param analytics Analytics library for logging
 * @param autoCheck Whether to automatically check on mount
 */
export function useWhatsNew(
  analytics: AnalyticsLibrary,
  autoCheck = true
): UseWhatsNewResult {
  const [versions, setVersions] = useState<WhatsNewVersion[]>([]);
  const [visible, setVisible] = useState(false);
  const [controller] = useState(() => new AppWhatsNewController(analytics));

  const checkAndShow = useCallback(async () => {
    const versionsToShow = await controller.getVersionsToPresent();
    if (versionsToShow.length > 0) {
      setVersions(versionsToShow);
      setVisible(true);
    }
  }, [controller]);

  const dismiss = useCallback(async () => {
    await controller.markAsSeen(versions);
    setVisible(false);
  }, [controller, versions]);

  // Auto-check on mount
  useEffect(() => {
    if (autoCheck) {
      checkAndShow();
    }
  }, [autoCheck, checkAndShow]);

  return {
    versions,
    visible,
    dismiss,
    checkAndShow,
  };
}

