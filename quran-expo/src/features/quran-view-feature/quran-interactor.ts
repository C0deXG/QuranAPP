/**
 * QuranInteractor.swift → quran-interactor.ts
 *
 * Main interactor for the Quran view feature.
 * Coordinates all child features and manages state.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { AnalyticsLibrary } from '../../core/analytics';
import type { Page, AyahNumber, Word, Quran, Reading } from '../../model/quran-kit';
import type { QuranMode } from '../../model/quran-text';
import type { Note, PageBookmark } from '../../model/quran-annotations';
import type { Point } from '../../model/quran-geometry';
import {
  type NoteService,
  type PageBookmarkService,
  type QuranHighlightsService,
  QuranHighlightsService as QuranHighlightsServiceClass,
} from '../../domain/annotations-service';
import { ReadingPreferences, type ReadingResourcesService } from '../../domain/reading-service';
import {
  QuranContentStatePreferences,
  SelectedTranslationsPreferences,
} from '../../domain/quran-text-kit';
import type { QuranInput } from '../quran-content-feature';
import type { ContentViewModel, ContentBuilder } from '../quran-content-feature';
import type { AyahMenuBuilder, AyahMenuInput } from '../ayah-menu-feature';
import type { MoreMenuBuilder, MoreMenuControlsState, MoreMenuModel } from '../more-menu-feature';
import type { AudioBannerBuilder, AudioBannerViewModel } from '../audio-banner-feature';
import type { WordPointerBuilder } from '../word-pointer-feature';
import type { NoteEditorBuilder } from '../note-editor-feature';
import type { TranslationsListBuilder } from '../translations-feature';
import type { TranslationVerseBuilder } from '../translation-verse-feature';
import type { Screen } from '../features-support';

// ============================================================================
// ContentStatus
// ============================================================================

export type ContentStatus =
  | { type: 'downloading'; progress: number }
  | { type: 'error'; error: Error; retry: () => void }
  | null;

// ============================================================================
// QuranPresentable
// ============================================================================

/**
 * Interface for the presenter (view controller).
 *
 * 1:1 translation of iOS QuranPresentable.
 */
export interface QuranPresentable {
  /** The pages content view */
  pagesView: any; // Reference to the content container

  /** Start the timer to hide bars */
  startHiddenBarsTimer(): void;

  /** Hide navigation and audio bars */
  hideBars(): void;

  /** Set the visible pages */
  setVisiblePages(pages: Page[]): void;

  /** Update bookmark state */
  updateBookmark(isBookmarked: boolean): void;

  /** Share text */
  shareText(lines: string[], point: Point, completion: () => void): void;

  /** Present more menu */
  presentMoreMenu(onDismiss: () => void): void;

  /** Present ayah menu */
  presentAyahMenu(input: AyahMenuInput): void;

  /** Present translated verse */
  presentTranslatedVerse(verse: AyahNumber, onDismiss: () => void): void;

  /** Present audio banner */
  presentAudioBanner(): void;

  /** Present word pointer */
  presentWordPointer(): void;

  /** Present quran content */
  presentQuranContent(): void;

  /** Present translations selection */
  presentTranslationsSelection(): void;

  /** Dismiss word pointer */
  dismissWordPointer(): void;

  /** Dismiss presented view */
  dismissPresentedViewController(completion?: () => void): void;

  /** Confirm note delete */
  confirmNoteDelete(onDelete: () => Promise<void>, onCancel: () => void): void;

  /** Rotate to portrait on phone */
  rotateToPortraitIfPhone(): void;

  /** Present note editor */
  presentNoteEditor(note: Note): void;

  /** Dismiss note editor */
  dismissNoteEditor(): void;

  /** Go back */
  goBack(): void;
}

// ============================================================================
// QuranInteractorDeps
// ============================================================================

export interface QuranInteractorDeps {
  quran: Quran;
  analytics: AnalyticsLibrary;
  pageBookmarkService: PageBookmarkService;
  noteService: NoteService;
  highlightsService: QuranHighlightsServiceClass;
  ayahMenuBuilder: AyahMenuBuilder;
  moreMenuBuilder: MoreMenuBuilder;
  audioBannerBuilder: AudioBannerBuilder;
  wordPointerBuilder: WordPointerBuilder;
  noteEditorBuilder: NoteEditorBuilder;
  contentBuilder: ContentBuilder;
  translationsSelectionBuilder: TranslationsListBuilder;
  translationVerseBuilder: TranslationVerseBuilder;
  resources: ReadingResourcesService;
}

// ============================================================================
// QuranInteractorState
// ============================================================================

export interface QuranInteractorState {
  contentStatus: ContentStatus;
  notes: Note[];
  pageBookmarks: PageBookmark[];
  isWordPointerActive: boolean;
  visiblePages: Page[];
}

// ============================================================================
// Reading Extensions
// ============================================================================

function supportsWordPositions(reading: Reading): boolean {
  switch (reading) {
    case 'hafs_1405':
      return true;
    case 'hafs_1421':
      return false;
    case 'hafs_1440':
      return false;
    case 'tajweed':
      // TODO: Enable word-by-word translation.
      // Tajweed ayah info contains words dimensions, but they don't match the word-by-word database.
      return false;
    default:
      return false;
  }
}

// ============================================================================
// QuranInteractor
// ============================================================================

/**
 * Main interactor for the Quran view feature.
 *
 * 1:1 translation of iOS QuranInteractor.
 *
 * Implements:
 * - WordPointerListener
 * - ContentListener
 * - NoteEditorListener
 * - MoreMenuListener
 * - AudioBannerListener
 * - AyahMenuListener
 */
export class QuranInteractor {
  // ============================================================================
  // Properties
  // ============================================================================

  presenter: QuranPresentable | null = null;

  private readonly deps: QuranInteractorDeps;
  private readonly input: QuranInput;

  private readonly readingPreferences = ReadingPreferences.shared;
  private readonly contentStatePreferences = QuranContentStatePreferences.shared;
  private readonly selectedTranslationsPreferences = SelectedTranslationsPreferences.shared;

  private _state: QuranInteractorState;
  private stateListeners: ((state: QuranInteractorState) => void)[] = [];

  private audioBanner: AudioBannerViewModel | null = null;
  private contentViewModel: ContentViewModel | null = null;
  private isWordPointerPresented = false;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(deps: QuranInteractorDeps, input: QuranInput) {
    this.deps = deps;
    this.input = input;

    this._state = {
      contentStatus: null,
      notes: [],
      pageBookmarks: [],
      isWordPointerActive: false,
      visiblePages: [],
    };

    logger.info(`Quran: opening quran initialPage=${input.initialPage.pageNumber}`);
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): QuranInteractorState {
    return this._state;
  }

  get quranMode(): QuranMode {
    return this.contentStatePreferences.quranMode;
  }

  get visiblePages(): Page[] {
    return this.contentViewModel?.state.visiblePages ?? [];
  }

  // ============================================================================
  // State Management
  // ============================================================================

  addListener(listener: (state: QuranInteractorState) => void): void {
    this.stateListeners.push(listener);
  }

  removeListener(listener: (state: QuranInteractorState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  private setState(updates: Partial<QuranInteractorState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.stateListeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Start the interactor.
   */
  async start(): Promise<void> {
    // Subscribe to notes
    this.deps.noteService.notesPublisher.addListener('notes', (notes: Note[]) => {
      this.setState({ notes });
    });

    // Subscribe to page bookmarks
    this.deps.pageBookmarkService.pageBookmarksPublisher.addListener('bookmarks', (bookmarks: PageBookmark[]) => {
      this.setState({ pageBookmarks: bookmarks });
      this.reloadPageBookmark();
    });

    // Subscribe to quran mode changes
    this.contentStatePreferences.addListener('quranMode', () => {
      this.onQuranModeUpdated();
    });

    // Subscribe to reading resources status
    this.deps.resources.addStatusListener((status: { type: string; progress?: number; error?: Error }) => {
      switch (status.type) {
        case 'downloading':
          this.setState({ contentStatus: { type: 'downloading', progress: status.progress } });
          break;
        case 'error':
          this.setState({
            contentStatus: {
              type: 'error',
              error: status.error,
              retry: () => {
                this.setState({ contentStatus: { type: 'downloading', progress: 0 } });
                this.deps.resources.retry();
              },
            },
          });
          break;
        case 'ready':
          this.setState({ contentStatus: null });
          this.loadContent();
          break;
      }
    });

    // Load initial notes
    const notes = await this.deps.noteService.notes(this.deps.quran);
    this.setState({ notes });

    // Load initial bookmarks
    const bookmarks = await this.deps.pageBookmarkService.pageBookmarks(this.deps.quran);
    this.setState({ pageBookmarks: bookmarks });
  }

  // ============================================================================
  // Popover
  // ============================================================================

  /**
   * Called when popover is dismissed.
   */
  didDismissPopover(): void {
    logger.info('Quran: dismiss popover');
    this.contentViewModel?.removeAyahMenuHighlight();
  }

  // ============================================================================
  // More Menu
  // ============================================================================

  /**
   * Handle more bar button tap.
   */
  onMoreBarButtonTapped(): void {
    logger.info('Quran: more bar button tapped');

    const wordPointer = supportsWordPositions(this.readingPreferences.reading)
      ? 'conditional'
      : 'alwaysOff';

    // TODO: Enable vertical scrolling.
    const controlsState: MoreMenuControlsState = {
      wordPointer,
      verticalScrolling: 'alwaysOff',
      twoPages: 'conditional',
      theme: 'conditional',
    };

    const model: MoreMenuModel = {
      isWordPointerActive: this._state.isWordPointerActive,
      state: controlsState,
    };

    this.presenter?.presentMoreMenu(() => {
      this.didDismissPopover();
    });
  }

  /**
   * Handle quran mode update.
   */
  onQuranModeUpdated(): void {
    const noTranslationsSelected = this.selectedTranslationsPreferences.selectedTranslationIds.length === 0;
    if (this.quranMode === 'translation' && noTranslationsSelected) {
      this.presentTranslationsSelection();
    }
  }

  /**
   * Handle translations selection tap.
   */
  onTranslationsSelectionsTapped(): void {
    this.presentTranslationsSelection();
  }

  /**
   * Highlight reading ayah.
   */
  highlightReadingAyah(ayah: AyahNumber | null): void {
    logger.info(`Quran: highlight reading verse ${ayah ? `${ayah.sura.suraNumber}:${ayah.ayah}` : 'null'}`);
    this.contentViewModel?.highlightReadingAyah(ayah);
  }

  // ============================================================================
  // Ayah Menu
  // ============================================================================

  /**
   * Play audio from ayah.
   */
  playAudio(from: AyahNumber, to: AyahNumber | null, repeatVerses: boolean): void {
    this.audioBanner?.play(from, to, repeatVerses);
  }

  /**
   * Delete notes.
   */
  async deleteNotes(notes: Note[], verses: AyahNumber[]): Promise<void> {
    const containsText = notes.some((note) => (note.note ?? '').trim() !== '');

    if (containsText) {
      // Confirm deletion first if there is text
      this.presenter?.confirmNoteDelete(
        async () => {
          await this.forceDeleteNotes(notes, verses);
        },
        () => {
          this.contentViewModel?.removeAyahMenuHighlight();
        }
      );
    } else {
      // Delete highlight
      await this.forceDeleteNotes(notes, verses);
    }
  }

  /**
   * Share text.
   */
  shareText(lines: string[], point: Point): void {
    logger.info('Quran: share text');
    this.dismissAyahMenu();
    this.presenter?.shareText(lines, point, () => {});
  }

  /**
   * Edit note.
   */
  editNote(note: Note): void {
    this.dismissAyahMenu();
    this.presenter?.rotateToPortraitIfPhone();
    this.presenter?.presentNoteEditor(note);
  }

  /**
   * Dismiss note editor.
   */
  dismissNoteEditor(): void {
    logger.info('Quran: dismiss note editor');
    this.presenter?.dismissNoteEditor();
  }

  /**
   * Show translation for verses.
   */
  showTranslation(verses: AyahNumber[]): void {
    const verse = verses[0];
    if (!verse) return;

    this.presenter?.dismissPresentedViewController(() => {
      this.presenter?.presentTranslatedVerse(verse, () => {
        this.contentViewModel?.removeAyahMenuHighlight();
      });
    });
  }

  /**
   * Present ayah menu.
   */
  presentAyahMenu(point: Point, verses: AyahNumber[]): void {
    logger.info(`Quran: present ayah menu, verses: ${verses.length}`);

    const notes = this.notesInteractingVerses(verses);
    const input: AyahMenuInput = {
      pointInView: point,
      verses,
      notes,
    };

    this.presenter?.presentAyahMenu(input);
  }

  /**
   * Dismiss ayah menu.
   */
  dismissAyahMenu(): void {
    logger.info('Quran: dismiss ayah menu');
    this.presenter?.dismissPresentedViewController();
    this.contentViewModel?.removeAyahMenuHighlight();
  }

  // ============================================================================
  // Word Pointer
  // ============================================================================

  /**
   * Handle word pointer pan began.
   */
  onWordPointerPanBegan(): void {
    this.presenter?.hideBars();
  }

  /**
   * Get word at point.
   */
  word(at: Point): Word | null {
    // This will be delegated to the content view
    return null;
  }

  /**
   * Highlight word.
   */
  highlightWord(word: Word | null): void {
    this.contentViewModel?.highlightWord(word);
  }

  /**
   * Handle word pointer active state update.
   */
  onIsWordPointerActiveUpdated(isActive: boolean): void {
    this.setState({ isWordPointerActive: isActive });

    if (isActive) {
      this.showWordPointer();
    } else {
      this.hideWordPointer();
    }
  }

  // ============================================================================
  // Content Listener
  // ============================================================================

  /**
   * User will begin drag scroll.
   */
  userWillBeginDragScroll(): void {
    logger.info('Quran: userWillBeginDragScroll');
    this.presenter?.hideBars();
  }

  // ============================================================================
  // Bookmark
  // ============================================================================

  /**
   * Toggle bookmark.
   */
  async toggleBookmark(): Promise<void> {
    logger.info('Quran: onBookmarkBarButtonTapped');

    const pages = this.visiblePages;
    const wasBookmarked = this.bookmarked(pages);

    try {
      for (const page of pages) {
        if (!wasBookmarked) {
          this.logBookmarkPage(page);
          await this.deps.pageBookmarkService.insertPageBookmark(page);
        } else {
          this.logRemoveBookmarkPage(page);
          await this.deps.pageBookmarkService.removePageBookmark(page);
        }
      }
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to toggle page bookmark');
    }
  }

  // ============================================================================
  // Back Navigation
  // ============================================================================

  /**
   * Handle back tap.
   */
  onBackTapped(): void {
    this.presenter?.goBack();
  }

  // ============================================================================
  // Content View Model Access
  // ============================================================================

  /**
   * Get the content view model.
   */
  getContentViewModel(): ContentViewModel | null {
    return this.contentViewModel;
  }

  /**
   * Set the content view model.
   */
  setContentViewModel(viewModel: ContentViewModel): void {
    this.contentViewModel = viewModel;

    // Subscribe to visible pages changes
    viewModel.addListener((state) => {
      this.setVisiblePages(state.visiblePages);
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private loadContent(): void {
    // Present audio banner
    this.presenter?.presentAudioBanner();

    // Present quran content
    this.presenter?.presentQuranContent();

    // Start hidden bars timer
    this.presenter?.startHiddenBarsTimer();
  }

  private presentTranslationsSelection(): void {
    this.presenter?.dismissPresentedViewController(() => {
      this.presenter?.presentTranslationsSelection();
    });
  }

  private async forceDeleteNotes(notes: Note[], verses: AyahNumber[]): Promise<void> {
    this.contentViewModel?.removeAyahMenuHighlight();
    try {
      await this.deps.noteService.removeNotes(verses);
    } catch (error) {
      crasher.recordError(error as Error, 'Failed to remove notes');
    }
  }

  private notesInteractingVerses(verses: AyahNumber[]): Note[] {
    const selectedVerses = new Set(
      verses.map((v) => `${v.sura.suraNumber}:${v.ayah}`)
    );

    return this._state.notes.filter((note) => {
      for (const verse of note.verses) {
        const key = `${verse.sura.suraNumber}:${verse.ayah}`;
        if (selectedVerses.has(key)) {
          return true;
        }
      }
      return false;
    });
  }

  private showWordPointer(): void {
    logger.info('Quran: show word pointer');
    if (!this.isWordPointerPresented) {
      this.presenter?.presentWordPointer();
      this.isWordPointerPresented = true;
    }
  }

  private hideWordPointer(): void {
    logger.info('Quran: hide word pointer');
    this.presenter?.dismissWordPointer();
    this.isWordPointerPresented = false;
  }

  private setVisiblePages(pages: Page[]): void {
    logger.info(`Quran: set visible pages ${pages.map((p) => p.pageNumber).join(', ')}`);
    this.setState({ visiblePages: pages });
    this.presenter?.setVisiblePages(pages);
    this.showPageBookmarkIfNeeded(pages);
  }

  private reloadPageBookmark(): void {
    logger.info('Quran: reloadPageBookmark');
    if (this._state.visiblePages.length > 0) {
      this.showPageBookmarkIfNeeded(this._state.visiblePages);
    }
  }

  private bookmarked(pages: Page[]): boolean {
    const pageNumbers = new Set(pages.map((p) => p.pageNumber));
    return this._state.pageBookmarks.some((bookmark) => pageNumbers.has(bookmark.page.pageNumber));
  }

  private showPageBookmarkIfNeeded(pages: Page[]): void {
    this.presenter?.updateBookmark(this.bookmarked(pages));
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  private logBookmarkPage(page: Page): void {
    this.deps.analytics.logEvent('BookmarkPage', String(page.pageNumber));
  }

  private logRemoveBookmarkPage(page: Page): void {
    this.deps.analytics.logEvent('RemoveBookmarkPage', String(page.pageNumber));
  }
}

