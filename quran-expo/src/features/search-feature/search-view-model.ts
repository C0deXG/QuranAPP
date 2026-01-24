/**
 * SearchViewModel.swift → search-view-model.ts
 *
 * View model for the Search screen.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import type { AnalyticsLibrary } from '../../core/analytics';
import type { CompositeSearcher } from '../../domain/quran-text-kit';
import { SearchRecentsService } from '../../domain/quran-text-kit';
import { ReadingPreferences } from '../../domain/reading-service';
import { QuranContentStatePreferences } from '../../domain/quran-text-kit';
import { SelectedTranslationsPreferences } from '../../domain/translation-service';
import { QuranMode } from '../../model/quran-text';
import { type AyahNumber, quranForReading } from '../../model/quran-kit';
import type { SearchResult, SearchResults, SearchResultsSource } from '../../model/quran-text';
import type { SearchUIState, SearchState, KeyboardState } from './search-types';

// ============================================================================
// SearchViewState
// ============================================================================

/**
 * State for the Search view.
 */
export interface SearchViewState {
  uiState: SearchUIState;
  searchState: SearchState;
  searchTerm: string;
  autocompletions: string[];
  recents: string[];
  keyboardState: KeyboardState;
  error: Error | null;
}

/**
 * Initial state for the Search view.
 */
export const initialSearchViewState: SearchViewState = {
  uiState: { type: 'entry' },
  searchState: { type: 'searching' },
  searchTerm: '',
  autocompletions: [],
  recents: [],
  keyboardState: 'closed',
  error: null,
};

// ============================================================================
// SearchViewModel
// ============================================================================

/**
 * View model for the Search screen.
 *
 * 1:1 translation of iOS SearchViewModel.
 */
export class SearchViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly analytics: AnalyticsLibrary;
  private readonly searchService: CompositeSearcher;
  private readonly navigateTo: (verse: AyahNumber) => void;

  private readonly recentsService = SearchRecentsService.shared;
  private readonly readingPreferences = ReadingPreferences.shared;
  private readonly contentStatePreferences = QuranContentStatePreferences.shared;
  private readonly selectedTranslationsPreferences = SelectedTranslationsPreferences.shared;

  /** Current state */
  private _state: SearchViewState = { ...initialSearchViewState };

  /** State change listeners */
  private listeners: ((state: SearchViewState) => void)[] = [];

  /** Autocomplete debounce timer */
  private autocompleteTimer: ReturnType<typeof setTimeout> | null = null;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    analytics: AnalyticsLibrary,
    searchService: CompositeSearcher,
    navigateTo: (verse: AyahNumber) => void
  ) {
    this.analytics = analytics;
    this.searchService = searchService;
    this.navigateTo = navigateTo;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): SearchViewState {
    return this._state;
  }

  get populars(): string[] {
    return this.recentsService.popularTerms;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a state change listener.
   */
  addListener(listener: (state: SearchViewState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener.
   */
  removeListener(listener: (state: SearchViewState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<SearchViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.listeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start the view model.
   */
  async start(): Promise<void> {
    // Load recent search items
    this.setState({ recents: this.recentsService.recentSearchItems });

    // Subscribe to recents updates
    this.recentsService.addRecentItemsListener((recents: string[]) => {
      this.setState({ recents });
    });
  }

  /**
   * Select a search result.
   */
  select(searchResult: SearchResult, source: SearchResultsSource): void {
    logger.info(`Search: search result selected '${searchResult.text}', source: ${source.type}`);

    // Show translation if not an active translation
    if (source.type === 'translation') {
      this.contentStatePreferences.quranMode = QuranMode.translation;
      const translationIds = [...this.selectedTranslationsPreferences.selectedTranslationIds];
      if (!translationIds.includes(source.translation.id)) {
        translationIds.push(source.translation.id);
        this.selectedTranslationsPreferences.selectedTranslationIds = translationIds;
      }
    }

    // Navigate to the selected page
    this.analytics.logEvent('openingQuran', 'searchResults');
    this.navigateTo(searchResult.ayah);
  }

  /**
   * Reset search state.
   */
  reset(): void {
    this.setState({
      uiState: { type: 'entry' },
      searchTerm: '',
      autocompletions: [],
    });
  }

  /**
   * Handle autocomplete request.
   */
  autocomplete(term: string): void {
    if (this._state.searchTerm !== term) {
      this.setState({
        uiState: { type: 'entry' },
        searchTerm: term,
      });

      // Debounce autocomplete
      if (this.autocompleteTimer) {
        clearTimeout(this.autocompleteTimer);
      }

      this.autocompleteTimer = setTimeout(async () => {
        logger.debug(`[Search] Autocomplete requested for ${term}`);
        const autocompletions = await this.getAutocompletions(term);
        if (this._state.searchTerm === term) {
          this.setState({ autocompletions });
        }
      }, 300);
    }
  }

  /**
   * Search for the user's typed term.
   */
  searchForUserTypedTerm(): void {
    this.search(this._state.searchTerm);
  }

  /**
   * Search for a term.
   */
  search(term: string): void {
    this.setState({
      keyboardState: 'closed',
      searchTerm: term,
      uiState: { type: 'search', term },
      searchState: { type: 'searching' },
    });

    this.performSearch(term);
  }

  /**
   * Set keyboard state.
   */
  setKeyboardState(state: KeyboardState): void {
    this.setState({ keyboardState: state });
  }

  /**
   * Clear error.
   */
  clearError(): void {
    this.setState({ error: null });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Perform the actual search.
   */
  private async performSearch(term: string): Promise<void> {
    try {
      const quran = quranForReading(this.readingPreferences.reading);
      const results = await this.searchService.search(term, quran);

      // Log analytics
      this.logSearchAnalytics(term, results);

      // Add to recents
      this.recentsService.addToRecents(term);

      // Update state if term still matches
      if (this._state.searchTerm === term) {
        this.setState({
          searchState: { type: 'searchResult', results },
        });
      }
    } catch (error) {
      if (this._state.searchTerm === term) {
        this.setState({
          error: error as Error,
          searchState: { type: 'searchResult', results: [] },
        });
      }
    }
  }

  /**
   * Get autocompletions for a term.
   */
  private async getAutocompletions(term: string): Promise<string[]> {
    const quran = this.readingPreferences.reading.quran;
    return this.searchService.autocomplete(term, quran);
  }

  /**
   * Log search analytics.
   */
  private logSearchAnalytics(term: string, results: SearchResults[]): void {
    this.analytics.logEvent('SearchTerm', term);
    this.analytics.logEvent('SearchSections', results.length.toString());

    for (const result of results) {
      const sourceName = result.source.type === 'quran' ? 'Quran' : result.source.translation.translationName;
      this.analytics.logEvent('SearchSource', sourceName);
      this.analytics.logEvent('SearchResultsCount', result.items.length.toString());
    }
  }
}

