/**
 * ContentViewModel.swift → content-view-model.ts
 *
 * View model for the Quran content display.
 *
 * Quran.com. All rights reserved.
 */

import type { AnalyticsLibrary } from '../../core/analytics';
import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { Page, AyahNumber, Word, Quran } from '../../model/quran-kit';
import type { QuranMode, FontSize } from '../../model/quran-text';
import type { QuranHighlights, Note } from '../../model/quran-annotations';
import { createQuranHighlights } from '../../model/quran-annotations';
import type { Point } from '../../model/quran-geometry';
import type { NoteService, QuranHighlightsService, LastPageUpdater } from '../../domain/annotations-service';
import {
  QuranContentStatePreferences,
  FontSizePreferences,
  SelectedTranslationsPreferences,
} from '../../domain/quran-text-kit';
import type { QuranInput } from './quran-input';
import type { ContentListener } from './content-listener';

// ============================================================================
// PagingStrategy
// ============================================================================

export type PagingStrategy = 'singlePage' | 'doublePage';

// ============================================================================
// PageGeometryActions
// ============================================================================

/**
 * Interface for getting word/verse at a specific point.
 */
export interface PageGeometryActions {
  word(point: Point): Word | null;
  verse(point: Point): AyahNumber | null;
}

// ============================================================================
// LongPressData
// ============================================================================

interface LongPressData {
  startPosition: Point;
  endPosition: Point;
  startVerse: AyahNumber;
  endVerse: AyahNumber;
}

// ============================================================================
// ContentViewModelDeps
// ============================================================================

export interface ContentViewModelDeps {
  analytics: AnalyticsLibrary;
  noteService: NoteService;
  lastPageUpdater: LastPageUpdater;
  quran: Quran;
  highlightsService: QuranHighlightsService;
}

// ============================================================================
// ContentViewState
// ============================================================================

export interface ContentViewState {
  visiblePages: Page[];
  quranMode: QuranMode;
  twoPagesEnabled: boolean;
  highlights: QuranHighlights;
  geometryActions: PageGeometryActions[];
}

// ============================================================================
// ContentViewModel
// ============================================================================

/**
 * View model for the Quran content display.
 *
 * 1:1 translation of iOS ContentViewModel.
 */
export class ContentViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  listener: ContentListener | null = null;

  readonly deps: ContentViewModelDeps;
  private readonly input: QuranInput;

  private readonly quranContentStatePreferences = QuranContentStatePreferences.shared;
  private readonly fontSizePreferences = FontSizePreferences.shared;
  private readonly selectedTranslationsPreferences = SelectedTranslationsPreferences.shared;

  private _state: ContentViewState;
  private stateListeners: ((state: ContentViewState) => void)[] = [];

  private longPressData: LongPressData | null = null;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(deps: ContentViewModelDeps, input: QuranInput) {
    this.deps = deps;
    this.input = input;

    this._state = {
      visiblePages: [input.initialPage],
      quranMode: this.quranContentStatePreferences.quranMode,
      twoPagesEnabled: this.quranContentStatePreferences.twoPagesEnabled,
      highlights: deps.highlightsService.highlights,
      geometryActions: [],
    };

    this.setupListeners();
    this.loadNotes();
    this.configureInitialPage();
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): ContentViewState {
    return this._state;
  }

  get pagingStrategy(): PagingStrategy {
    return this._state.twoPagesEnabled ? 'doublePage' : 'singlePage';
  }

  // ============================================================================
  // State Management
  // ============================================================================

  addListener(listener: (state: ContentViewState) => void): void {
    this.stateListeners.push(listener);
  }

  removeListener(listener: (state: ContentViewState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  private setState(updates: Partial<ContentViewState>): void {
    const oldState = this._state;
    this._state = { ...this._state, ...updates };

    // Handle visible pages change
    if (updates.visiblePages && updates.visiblePages !== oldState.visiblePages) {
      this.visiblePagesUpdated();
    }

    // Sync highlights with service
    if (updates.highlights && updates.highlights !== oldState.highlights) {
      this.deps.highlightsService.highlights = this._state.highlights;

      // Scroll to verse if needed
      const ayah = this.verseToScrollTo(oldState.highlights, this._state.highlights);
      if (ayah) {
        this.setState({ visiblePages: [ayah.page] });
      }
    }

    for (const listener of this.stateListeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods - Page Navigation
  // ============================================================================

  /**
   * Set visible pages.
   */
  setVisiblePages(pages: Page[]): void {
    this.setState({ visiblePages: pages });
  }

  /**
   * Set geometry actions for hit testing.
   */
  setGeometryActions(actions: PageGeometryActions[]): void {
    this.setState({ geometryActions: actions });
  }

  // ============================================================================
  // Public Methods - Highlights
  // ============================================================================

  /**
   * Remove ayah menu highlight.
   */
  removeAyahMenuHighlight(): void {
    this.longPressData = null;
    this.updateShareVerses();
  }

  /**
   * Highlight a translation verse.
   */
  highlightTranslationVerse(verse: AyahNumber): void {
    if (this.longPressData) {
      this.longPressData.startVerse = verse;
      this.longPressData.endVerse = verse;
      this.updateShareVerses();
    }
  }

  /**
   * Highlight a word (for word pointer).
   */
  highlightWord(word: Word | null): void {
    this.setState({
      highlights: {
        ...this._state.highlights,
        pointedWord: word,
      },
    });
  }

  /**
   * Highlight the currently reading ayah.
   */
  highlightReadingAyah(ayah: AyahNumber | null): void {
    this.setState({
      highlights: {
        ...this._state.highlights,
        readingVerses: ayah ? [ayah] : [],
      },
    });
  }

  // ============================================================================
  // Public Methods - Long Press Handling
  // ============================================================================

  /**
   * Called when long press starts.
   */
  onViewLongPressStarted(point: Point, verse: AyahNumber): void {
    this.longPressData = {
      startPosition: point,
      endPosition: point,
      startVerse: verse,
      endVerse: verse,
    };
    this.updateShareVerses();
  }

  /**
   * Called when long press position changes.
   */
  onViewLongPressChanged(point: Point, verse: AyahNumber): void {
    if (!this.longPressData) {
      return;
    }
    this.longPressData.endPosition = point;
    this.longPressData.endVerse = verse;
    this.updateShareVerses();
  }

  /**
   * Called when long press ends.
   */
  onViewLongPressEnded(): void {
    const selectedVerses = this.getSelectedVerses();
    if (!this.longPressData || !selectedVerses) {
      return;
    }

    this.listener?.presentAyahMenu(this.longPressData.startPosition, selectedVerses);
  }

  /**
   * Called when long press is cancelled.
   */
  onViewLongPressCancelled(): void {
    this.longPressData = null;
    this.updateShareVerses();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupListeners(): void {
    // Listen to highlights service changes
    this.deps.highlightsService.addListener('highlights', (highlights) => {
      this.setState({ highlights });
    });

    // Listen to preference changes
    this.quranContentStatePreferences.addListener('twoPagesEnabled', (enabled: boolean) => {
      this.setState({ twoPagesEnabled: enabled });
    });

    this.quranContentStatePreferences.addListener('quranMode', (mode: QuranMode) => {
      this.setState({ quranMode: mode });
    });
  }

  private configureInitialPage(): void {
    this.deps.lastPageUpdater.configure(this.input.initialPage, this.input.lastPage);

    if (this.input.highlightingSearchAyah) {
      this.setState({
        highlights: {
          ...this._state.highlights,
          searchVerses: [this.input.highlightingSearchAyah],
        },
      });
    }
  }

  private visiblePagesUpdated(): void {
    // Remove search highlight when page changes
    if (this._state.highlights.searchVerses.length > 0) {
      this.setState({
        highlights: {
          ...this._state.highlights,
          searchVerses: [],
        },
      });
    }

    const pages = this._state.visiblePages;
    const isTranslationView = this.quranContentStatePreferences.quranMode === 'translation';

    // Analytics
    crasher.setValue(pages.map((p) => p.pageNumber), 'VisiblePages');
    this.logShowingPages(
      pages,
      isTranslationView,
      this.selectedTranslationsPreferences.selectedTranslationIds.length,
      this.fontSizePreferences.arabicFontSize,
      this.fontSizePreferences.translationFontSize
    );

    if (isTranslationView) {
      logger.info(
        `Using translations ${this.selectedTranslationsPreferences.selectedTranslationIds}`
      );
    }

    // Update last page
    this.updateLastPageTo(pages);
  }

  private updateLastPageTo(pages: Page[]): void {
    this.deps.lastPageUpdater.updateTo(pages);
  }

  private loadNotes(): void {
    this.deps.noteService
      .notes(this.deps.quran)
      .then((notes: Note[]) => {
        const noteVerses: Map<string, Note> = new Map();
        for (const note of notes) {
          for (const verse of note.verses) {
            noteVerses.set(`${verse.sura.suraNumber}:${verse.ayah}`, note);
          }
        }
        this.setState({
          highlights: {
            ...this._state.highlights,
            noteVerses,
          },
        });
      })
      .catch((error: Error) => {
        logger.error(`Failed to load notes: ${error}`);
      });
  }

  private getSelectedVerses(): AyahNumber[] | null {
    if (!this.longPressData) {
      return null;
    }

    let start = this.longPressData.startVerse;
    let end = this.longPressData.endVerse;

    // Ensure start is before end
    if (this.compareVerses(end, start) < 0) {
      const temp = start;
      start = end;
      end = temp;
    }

    return this.versesArray(start, end);
  }

  private updateShareVerses(): void {
    const selectedVerses = this.getSelectedVerses();
    this.setState({
      highlights: {
        ...this._state.highlights,
        shareVerses: selectedVerses ?? [],
      },
    });
  }

  private compareVerses(a: AyahNumber, b: AyahNumber): number {
    if (a.sura.suraNumber !== b.sura.suraNumber) {
      return a.sura.suraNumber - b.sura.suraNumber;
    }
    return a.ayah - b.ayah;
  }

  private versesArray(start: AyahNumber, end: AyahNumber): AyahNumber[] {
    const verses: AyahNumber[] = [];
    let current: AyahNumber | null = start;

    while (current && this.compareVerses(current, end) <= 0) {
      verses.push(current);
      current = current.next;
    }

    return verses;
  }

  private verseToScrollTo(
    oldHighlights: QuranHighlights,
    newHighlights: QuranHighlights
  ): AyahNumber | null {
    // Check if reading verse changed and we should scroll to it
    if (
      newHighlights.readingVerses.length > 0 &&
      (oldHighlights.readingVerses.length === 0 ||
        !this.versesEqual(oldHighlights.readingVerses[0], newHighlights.readingVerses[0]))
    ) {
      return newHighlights.readingVerses[0];
    }
    return null;
  }

  private versesEqual(a: AyahNumber, b: AyahNumber): boolean {
    return a.sura.suraNumber === b.sura.suraNumber && a.ayah === b.ayah;
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  private logShowingPages(
    pages: Page[],
    isTranslation: boolean,
    numberOfSelectedTranslations: number,
    arabicFontSize: FontSize,
    translationFontSize: FontSize
  ): void {
    const { analytics } = this.deps;
    analytics.logEvent('PageNumbers', pages.map((p) => p.pageNumber).join(','));
    analytics.logEvent('PageIsTranslation', String(isTranslation));
    analytics.logEvent('PageViewingMode', isTranslation ? 'Translation' : 'Arabic');

    if (isTranslation) {
      analytics.logEvent('PageTranslationsNum', String(numberOfSelectedTranslations));
      analytics.logEvent('PageArabicFontSize', arabicFontSize);
      analytics.logEvent('PageTranslationFontSize', translationFontSize);
    }
  }
}

