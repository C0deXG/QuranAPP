/**
 * AdvancedAudioOptionsViewModel.swift → advanced-audio-options-view-model.ts
 *
 * View model for advanced audio options.
 *
 * Quran.com. All rights reserved.
 */

import type { Runs } from '../../core/queue-player';
import type { Reciter } from '../../model/quran-audio';
import type { AyahNumber, Sura, ISura, IAyahNumber } from '../../model/quran-kit';
import {
  PageBasedLastAyahFinder,
  JuzBasedLastAyahFinder,
} from '../../model/quran-kit';
import type { AdvancedAudioOptions } from './advanced-audio-options';

// ============================================================================
// AdvancedAudioOptionsListener
// ============================================================================

/**
 * Listener for advanced audio options events.
 *
 * 1:1 translation of iOS AdvancedAudioOptionsListener.
 */
export interface AdvancedAudioOptionsListener {
  updateAudioOptions(newOptions: AdvancedAudioOptions): void;
  dismissAudioOptions(): void;
}

// ============================================================================
// AdvancedAudioOptionsViewState
// ============================================================================

export interface AdvancedAudioOptionsViewState {
  reciter: Reciter;
  fromVerse: IAyahNumber;
  toVerse: IAyahNumber;
  verseRuns: Runs;
  listRuns: Runs;
}

// ============================================================================
// AdvancedAudioOptionsViewModel
// ============================================================================

/**
 * View model for advanced audio options.
 *
 * 1:1 translation of iOS AdvancedAudioOptionsViewModel.
 */
export class AdvancedAudioOptionsViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  listener: AdvancedAudioOptionsListener | null = null;

  private readonly options: AdvancedAudioOptions;

  /** Current state */
  private _state: AdvancedAudioOptionsViewState;

  /** State change listeners */
  private stateListeners: ((state: AdvancedAudioOptionsViewState) => void)[] = [];

  /** Callback for presenting reciter list */
  onPresentReciterList: (() => void) | null = null;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(options: AdvancedAudioOptions) {
    this.options = options;
    this._state = {
      reciter: options.reciter,
      fromVerse: options.start,
      toVerse: options.end,
      verseRuns: options.verseRuns,
      listRuns: options.listRuns,
    };
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): AdvancedAudioOptionsViewState {
    return this._state;
  }

  get suras(): ISura[] {
    return this.options.start.quran.suras;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  addListener(listener: (state: AdvancedAudioOptionsViewState) => void): void {
    this.stateListeners.push(listener);
  }

  removeListener(listener: (state: AdvancedAudioOptionsViewState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  private setState(updates: Partial<AdvancedAudioOptionsViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.stateListeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Play with current options.
   */
  play(): void {
    this.listener?.updateAudioOptions(this.currentOptions());
    this.dismiss();
  }

  /**
   * Dismiss the options.
   */
  dismiss(): void {
    this.listener?.dismissAudioOptions();
  }

  /**
   * Update the "from" verse.
   */
  updateFromVerseTo(from: IAyahNumber): void {
    let updates: Partial<AdvancedAudioOptionsViewState> = { fromVerse: from };

    // If toVerse is before fromVerse, update toVerse
    if (this.compareVerses(this._state.toVerse, from) < 0) {
      updates.toVerse = from;
    }

    this.setState(updates);
  }

  /**
   * Update the "to" verse.
   */
  updateToVerseTo(to: IAyahNumber): void {
    let updates: Partial<AdvancedAudioOptionsViewState> = { toVerse: to };

    // If toVerse is before fromVerse, update fromVerse
    if (this.compareVerses(to, this._state.fromVerse) < 0) {
      updates.fromVerse = to;
    }

    this.setState(updates);
  }

  /**
   * Update verse runs.
   */
  updateVerseRuns(runs: Runs): void {
    this.setState({ verseRuns: runs });
  }

  /**
   * Update list runs.
   */
  updateListRuns(runs: Runs): void {
    this.setState({ listRuns: runs });
  }

  /**
   * Set the last verse to the end of the current page.
   */
  setLastVerseInPage(): void {
    const finder = new PageBasedLastAyahFinder();
    const verse = finder.findLastAyah(this._state.fromVerse);
    this.updateToVerseTo(verse);
  }

  /**
   * Set the last verse to the end of the current juz.
   */
  setLastVerseInJuz(): void {
    const finder = new JuzBasedLastAyahFinder();
    const verse = finder.findLastAyah(this._state.fromVerse);
    this.updateToVerseTo(verse);
  }

  /**
   * Set the last verse to the end of the current sura.
   */
  setLastVerseInSura(): void {
    for (const sura of this.suras) {
      const verses = sura.verses;
      if (verses.some((v) => v.sura.suraNumber === this._state.fromVerse.sura.suraNumber &&
                            v.ayah === this._state.fromVerse.ayah)) {
        const lastVerse = verses[verses.length - 1];
        this.updateToVerseTo(lastVerse);
        break;
      }
    }
  }

  /**
   * Show reciter selection.
   */
  presentReciterList(): void {
    this.onPresentReciterList?.();
  }

  /**
   * Called when a reciter is selected from the list.
   */
  onSelectedReciterChanged(reciter: Reciter): void {
    this.setState({ reciter });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private currentOptions(): AdvancedAudioOptions {
    return {
      reciter: this._state.reciter,
      start: this._state.fromVerse,
      end: this._state.toVerse,
      verseRuns: this._state.verseRuns,
      listRuns: this._state.listRuns,
    };
  }

  /**
   * Compare two verses.
   * Returns negative if a < b, 0 if equal, positive if a > b.
   */
  private compareVerses(a: IAyahNumber, b: IAyahNumber): number {
    if (a.sura.suraNumber !== b.sura.suraNumber) {
      return a.sura.suraNumber - b.sura.suraNumber;
    }
    return a.ayah - b.ayah;
  }
}

