/**
 * TabInteractor.swift → tab-interactor.ts
 *
 * Interactor that handles navigation within a tab.
 *
 * Quran.com. All rights reserved.
 */

import type { NavigationProp } from '@react-navigation/native';
import type { Page, AyahNumber } from '../../../model/quran-kit';
import type { QuranNavigator } from '../../features-support';

// ============================================================================
// QuranInput
// ============================================================================

/**
 * Input parameters for navigating to the Quran reading screen.
 * Matches iOS QuranInput struct.
 */
export interface QuranInput {
  /** The page to navigate to initially */
  initialPage: Page;
  /** The last page context (for "continue reading" behavior) */
  lastPage: Page | null;
  /** An ayah to highlight (from search results) */
  highlightingSearchAyah: AyahNumber | null;
}

/**
 * Creates a QuranInput object.
 */
export function createQuranInput(
  initialPage: Page,
  lastPage: Page | null = null,
  highlightingSearchAyah: AyahNumber | null = null
): QuranInput {
  return { initialPage, lastPage, highlightingSearchAyah };
}

// ============================================================================
// TabPresenter Interface
// ============================================================================

/**
 * Interface for tab presenter (navigation controller).
 * In React Native, this wraps the navigation prop.
 */
export interface TabPresenter {
  /**
   * Push a screen onto the navigation stack.
   *
   * @param screenName - The name of the screen to navigate to
   * @param params - Parameters to pass to the screen
   */
  push(screenName: string, params?: Record<string, unknown>): void;
}

// ============================================================================
// TabInteractor
// ============================================================================

/**
 * Interactor that handles navigation within a tab.
 * Implements QuranNavigator to allow child screens to navigate to Quran.
 *
 * 1:1 translation of iOS TabInteractor.
 */
export class TabInteractor implements QuranNavigator {
  // ============================================================================
  // Properties
  // ============================================================================

  /** Reference to the presenter (navigation) */
  presenter: TabPresenter | null = null;

  /** Screen name for the Quran view */
  private readonly quranScreenName: string;

  // ============================================================================
  // Constructor
  // ============================================================================

  /**
   * Creates a new TabInteractor.
   *
   * @param quranScreenName - The name of the Quran screen to navigate to
   */
  constructor(quranScreenName: string = 'Quran') {
    this.quranScreenName = quranScreenName;
  }

  // ============================================================================
  // QuranNavigator Implementation
  // ============================================================================

  /**
   * Navigate to a page in the Quran.
   *
   * @param page - The page to navigate to
   * @param lastPage - The last page context
   * @param highlightingSearchAyah - An ayah to highlight
   */
  navigateTo(
    page: Page,
    lastPage: Page | null,
    highlightingSearchAyah: AyahNumber | null
  ): void {
    const input = createQuranInput(page, lastPage, highlightingSearchAyah);
    this.presenter?.push(this.quranScreenName, { input });
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Called when the tab starts.
   * Subclasses can override to perform initialization.
   */
  start(): void {
    // Default implementation does nothing
  }
}

// ============================================================================
// Navigation Adapter
// ============================================================================

/**
 * Creates a TabPresenter from a React Navigation navigation prop.
 *
 * @param navigation - The React Navigation navigation prop
 * @returns A TabPresenter wrapper
 */
export function createTabPresenter(
  navigation: NavigationProp<any>
): TabPresenter {
  return {
    push(screenName: string, params?: Record<string, unknown>): void {
      (navigation as any).push(screenName, params);
    },
  };
}

