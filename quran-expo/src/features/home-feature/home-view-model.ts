/**
 * HomeViewModel.swift → home-view-model.ts
 *
 * View model for the Home screen.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { LastPageService } from '../../domain/annotations-service';
import type { QuranTextDataService } from '../../domain/quran-text-kit';
import { type Page, type Sura, type Quarter, type AyahNumber, type IQuarter, quranForReading } from '../../model/quran-kit';
import type { LastPage } from '../../model/quran-annotations';
import type { VerseText } from '../../model/quran-text';
import { ReadingPreferences } from '../../domain/reading-service';
import type { QuarterItem } from './quarter-item';
import { createQuarterItem } from './quarter-item';

// ============================================================================
// Enums
// ============================================================================

/**
 * Sort order for suras.
 */
export enum SurahSortOrder {
  ascending = 1,
  descending = -1,
}

/**
 * Type of view displayed on the home screen.
 */
export enum HomeViewType {
  suras = 0,
  juzs = 1,
}

// ============================================================================
// HomeViewState
// ============================================================================

/**
 * State for the Home view.
 */
export interface HomeViewState {
  suras: Sura[];
  quarters: QuarterItem[];
  lastPages: LastPage[];
  surahSortOrder: SurahSortOrder;
  type: HomeViewType;
  isLoading: boolean;
}

/**
 * Initial state for the Home view.
 */
export const initialHomeViewState: HomeViewState = {
  suras: [],
  quarters: [],
  lastPages: [],
  surahSortOrder: SurahSortOrder.ascending,
  type: HomeViewType.suras,
  isLoading: true,
};

// ============================================================================
// HomeViewModel
// ============================================================================

/**
 * View model for the Home screen.
 *
 * 1:1 translation of iOS HomeViewModel.
 */
export class HomeViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly lastPageService: LastPageService;
  private readonly textRetriever: QuranTextDataService;
  private readonly navigateToPage: (page: Page) => void;
  private readonly navigateToSura: (sura: Sura) => void;
  private readonly navigateToQuarter: (quarter: Quarter) => void;
  private readonly readingPreferences = ReadingPreferences.shared;

  /** Current state */
  private _state: HomeViewState = { ...initialHomeViewState };

  /** State change listeners */
  private listeners: ((state: HomeViewState) => void)[] = [];

  /** Subscription cleanup */
  private subscriptionCleanup: (() => void) | null = null;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    lastPageService: LastPageService,
    textRetriever: QuranTextDataService,
    navigateToPage: (page: Page) => void,
    navigateToSura: (sura: Sura) => void,
    navigateToQuarter: (quarter: Quarter) => void
  ) {
    this.lastPageService = lastPageService;
    this.textRetriever = textRetriever;
    this.navigateToPage = navigateToPage;
    this.navigateToSura = navigateToSura;
    this.navigateToQuarter = navigateToQuarter;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): HomeViewState {
    return this._state;
  }

  get suras(): Sura[] {
    return this._state.suras;
  }

  get quarters(): QuarterItem[] {
    return this._state.quarters;
  }

  get lastPages(): LastPage[] {
    return this._state.lastPages;
  }

  get surahSortOrder(): SurahSortOrder {
    return this._state.surahSortOrder;
  }

  get type(): HomeViewType {
    return this._state.type;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: HomeViewState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: HomeViewState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<HomeViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start loading data.
   */
  async start(): Promise<void> {
    this.setState({ isLoading: true });

    // Load all data in parallel
    await Promise.all([
      this.loadLastPages(),
      this.loadSuras(),
      this.loadQuarters(),
    ]);

    this.setState({ isLoading: false });
  }

  /**
   * Cleanup subscriptions.
   */
  cleanup(): void {
    if (this.subscriptionCleanup) {
      this.subscriptionCleanup();
      this.subscriptionCleanup = null;
    }
  }

  /**
   * Navigate to a last page.
   */
  navigateTo(lastPage: Page): void {
    this.navigateToPage(lastPage);
  }

  /**
   * Navigate to a sura.
   */
  navigateToSuraItem(sura: Sura): void {
    this.navigateToSura(sura);
  }

  /**
   * Navigate to a quarter.
   */
  navigateToQuarterItem(item: QuarterItem): void {
    this.navigateToQuarter(item.quarter);
  }

  /**
   * Set the view type.
   */
  setType(type: HomeViewType): void {
    logger.info(`Home: ${type === HomeViewType.suras ? 'suras' : 'juzs'} selected`);
    this.setState({ type });
  }

  /**
   * Toggle sura sort order.
   */
  toggleSurahSortOrder(): void {
    const newOrder = this._state.surahSortOrder === SurahSortOrder.ascending
      ? SurahSortOrder.descending
      : SurahSortOrder.ascending;
    this.setState({ surahSortOrder: newOrder });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Load last pages.
   */
  private async loadLastPages(): Promise<void> {
    try {
      const reading = this.readingPreferences.reading;
      const lastPagesPublisher = this.lastPageService.lastPages(quranForReading(reading));

      // Get initial value
      for await (const lastPages of lastPagesPublisher) {
        this.setState({ lastPages });
        break; // Only get first value for initial load
      }
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to load last pages');
    }
  }

  /**
   * Load suras.
   */
  private async loadSuras(): Promise<void> {
    const reading = this.readingPreferences.reading;
    this.setState({ suras: quranForReading(reading).suras });
  }

  /**
   * Load quarters with their Arabic text.
   */
  private async loadQuarters(): Promise<void> {
    const reading = this.readingPreferences.reading;
    const quarters = quranForReading(reading).quarters;

    const quartersText = await this.textForQuarters(quarters);
    const quarterItems = quarters.map((quarter: IQuarter) =>
      createQuarterItem(quarter, quartersText.get(quarter) ?? '')
    );

    this.setState({ quarters: quarterItems });
  }

  /**
   * Get Arabic text for quarters.
   */
  private async textForQuarters(
    quarters: Quarter[]
  ): Promise<Map<Quarter, string>> {
    try {
      const verses = quarters.map((q) => q.firstVerse);
      const translatedVerses = await this.textRetriever.textForVerses(verses, []);

      return this.cleanUpText(quarters, verses, translatedVerses.verses);
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to retrieve quarters text');
      return new Map();
    }
  }

  /**
   * Clean up quarter text by removing hizb markers.
   */
  private cleanUpText(
    quarters: Quarter[],
    verses: AyahNumber[],
    versesText: VerseText[]
  ): Map<Quarter, string> {
    const quarterStart = '۞'; // Hizb marker
    const cleanedVersesText = versesText.map((v) =>
      v.arabicText.replace(quarterStart, '')
    );

    const versesTextMap = new Map<string, string>();
    verses.forEach((verse, index) => {
      const key = `${verse.sura.suraNumber}:${verse.ayah}`;
      if (!versesTextMap.has(key)) {
        versesTextMap.set(key, cleanedVersesText[index] ?? '');
      }
    });

    const result = new Map<Quarter, string>();
    for (const quarter of quarters) {
      const key = `${quarter.firstVerse.sura.suraNumber}:${quarter.firstVerse.ayah}`;
      result.set(quarter, versesTextMap.get(key) ?? '');
    }

    return result;
  }
}

