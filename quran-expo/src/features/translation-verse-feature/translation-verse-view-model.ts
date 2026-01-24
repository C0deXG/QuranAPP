/**
 * TranslationVerseViewModel.swift → translation-verse-view-model.ts
 *
 * View model for the translation verse screen.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import type { AyahNumber } from '../../model/quran-kit';
import { QuranHighlightsService } from '../../domain/annotations-service';
import { QuranTextDataService, type LocalTranslationsRetriever } from '../../domain/quran-text-kit';
import { ContentTranslationViewModel } from '../quran-translation-feature';
import type { TranslationVerseActions } from './translation-verse-actions';

// ============================================================================
// TranslationVerseViewModelState
// ============================================================================

export interface TranslationVerseViewModelState {
  currentVerse: AyahNumber;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// TranslationVerseViewModel
// ============================================================================

/**
 * View model for the translation verse screen.
 *
 * 1:1 translation of iOS TranslationVerseViewModel.
 */
export class TranslationVerseViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  /** The translation view model (reused from QuranTranslationFeature) */
  readonly translationViewModel: ContentTranslationViewModel;

  private _currentVerse: AyahNumber;
  private readonly dataService: QuranTextDataService;
  private readonly actions: TranslationVerseActions;

  private stateListeners: ((state: TranslationVerseViewModelState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    startingVerse: AyahNumber,
    localTranslationsRetriever: LocalTranslationsRetriever,
    dataService: QuranTextDataService,
    actions: TranslationVerseActions
  ) {
    this._currentVerse = startingVerse;
    this.dataService = dataService;
    this.actions = actions;

    // Create a no-op highlighting service for standalone translation view
    const noOpHighlightingService = new QuranHighlightsService();

    // Create the translation view model
    this.translationViewModel = new ContentTranslationViewModel(
      localTranslationsRetriever,
      dataService,
      noOpHighlightingService
    );

    // Configure for single verse display
    this.translationViewModel.setShowHeaderAndFooter(false);
    this.translationViewModel.setVerses([startingVerse]);
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get currentVerse(): AyahNumber {
    return this._currentVerse;
  }

  get state(): TranslationVerseViewModelState {
    return {
      currentVerse: this._currentVerse,
      hasNext: this._currentVerse.next !== null,
      hasPrevious: this._currentVerse.previous !== null,
    };
  }

  // ============================================================================
  // State Management
  // ============================================================================

  addListener(listener: (state: TranslationVerseViewModelState) => void): void {
    this.stateListeners.push(listener);
  }

  removeListener(listener: (state: TranslationVerseViewModelState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    const state = this.state;
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  /**
   * Move to the next verse.
   */
  next(): void {
    logger.info(`Verse Translation: moving to next verse currentVerse:${this._currentVerse.sura.suraNumber}:${this._currentVerse.ayah}`);

    const nextVerse = this._currentVerse.next;
    if (nextVerse) {
      this.setCurrentVerse(nextVerse);
    }
  }

  /**
   * Move to the previous verse.
   */
  previous(): void {
    logger.info(`Verse Translation: moving to previous verse currentVerse:${this._currentVerse.sura.suraNumber}:${this._currentVerse.ayah}`);

    const previousVerse = this._currentVerse.previous;
    if (previousVerse) {
      this.setCurrentVerse(previousVerse);
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setCurrentVerse(verse: AyahNumber): void {
    this._currentVerse = verse;

    // Update the translation view model
    this.translationViewModel.setVerses([verse]);

    // Notify the parent
    this.actions.updateCurrentVerseTo(verse);

    // Notify state listeners
    this.notifyListeners();
  }
}

