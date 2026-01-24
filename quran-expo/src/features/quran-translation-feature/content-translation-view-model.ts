/**
 * ContentTranslationViewModel.swift → content-translation-view-model.ts
 *
 * View model for translation display.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import { NumberFormatter } from '../../core/localization';
import type { Page, AyahNumber, Quran, IAyahNumber, ISura, IPage } from '../../model/quran-kit';
import type {
  Translation,
  TranslationString,
  FontSize,
  VerseText,
  TranslationText,
} from '../../model/quran-text';
import type { QuranHighlights } from '../../model/quran-annotations';
import type { Point } from '../../model/quran-geometry';
import type { QuranHighlightsService } from '../../domain/annotations-service';
import { QuranTextDataService } from '../../domain/quran-text-kit';
import {
  LocalTranslationsRetriever,
  SelectedTranslationsPreferences,
} from '../../domain/translation-service';
import { FontSizePreferences } from '../../domain/quran-text-kit';
import {
  type TranslationItem,
  type TranslationItemId,
  translationItemIdKey,
  translationItemIdAyah,
  createTranslationPageHeader,
  createTranslationPageFooter,
  createTranslationVerseSeparator,
  createTranslationSuraName,
  createTranslationArabicText,
  createTranslationTextChunk,
  createTranslationReferenceVerse,
  createTranslatorText,
} from './translation-item';
import type { TranslationFootnote } from './translation-footnote';
import { type TranslationURL, parseTranslationURL } from './translation-url';
import { chunkString } from '../../core/utilities/string-chunking';

// ============================================================================
// CollectionTracker
// ============================================================================

/**
 * Tracks item positions for hit testing.
 */
export class CollectionTracker<T> {
  private items: Map<string, { id: T; rect: { x: number; y: number; width: number; height: number } }> = new Map();

  setItemRect(id: T, idKey: string, rect: { x: number; y: number; width: number; height: number }): void {
    this.items.set(idKey, { id, rect });
  }

  itemAtPoint(point: Point): T | null {
    for (const [, item] of this.items) {
      const { rect, id } = item;
      if (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      ) {
        return id;
      }
    }
    return null;
  }
}

// ============================================================================
// ContentTranslationViewState
// ============================================================================

export interface ContentTranslationViewState {
  showHeaderAndFooter: boolean;
  verses: AyahNumber[];
  selectedTranslations: Translation['id'][];
  translations: Translation[];
  verseTexts: Map<string, VerseText>; // key: "sura:ayah"
  expandedTranslations: Map<string, Map<Translation['id'], Array<{ start: number; end: number }>>>; // verse key -> translation id -> chunks
  translationFontSize: FontSize;
  arabicFontSize: FontSize;
  highlights: Map<string, string>; // verse key -> color
  footnote: TranslationFootnote | null;
  scrollToItem: TranslationItemId | null;
}

// ============================================================================
// ContentTranslationViewModel
// ============================================================================

/**
 * View model for translation display.
 *
 * 1:1 translation of iOS ContentTranslationViewModel.
 */
export class ContentTranslationViewModel {
  // ============================================================================
  // Constants
  // ============================================================================

  private static readonly MAX_CHUNK_SIZE = 800;

  // ============================================================================
  // Properties
  // ============================================================================

  readonly tracker = new CollectionTracker<TranslationItemId>();

  private readonly dataService: QuranTextDataService;
  private readonly highlightsService: QuranHighlightsService;
  private readonly localTranslationsRetriever: LocalTranslationsRetriever;
  private readonly selectedTranslationsPreferences = SelectedTranslationsPreferences.shared;
  private readonly fontSizePreferences = FontSizePreferences.shared;

  private _state: ContentTranslationViewState;
  private stateListeners: ((state: ContentTranslationViewState) => void)[] = [];

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    localTranslationsRetriever: LocalTranslationsRetriever,
    dataService: QuranTextDataService,
    highlightsService: QuranHighlightsService
  ) {
    this.dataService = dataService;
    this.highlightsService = highlightsService;
    this.localTranslationsRetriever = localTranslationsRetriever;

    this._state = {
      showHeaderAndFooter: true,
      verses: [],
      selectedTranslations: this.selectedTranslationsPreferences.selectedTranslationIds,
      translations: [],
      verseTexts: new Map(),
      expandedTranslations: new Map(),
      translationFontSize: this.fontSizePreferences.translationFontSize,
      arabicFontSize: this.fontSizePreferences.arabicFontSize,
      highlights: this.extractHighlights(highlightsService.highlights),
      footnote: null,
      scrollToItem: null,
    };

    this.setupListeners();
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): ContentTranslationViewState {
    return this._state;
  }

  /**
   * Get the computed items for display.
   */
  get items(): TranslationItem[] {
    const { verseTexts, translations, verses, highlights, arabicFontSize, translationFontSize, showHeaderAndFooter } =
      this._state;

    if (verseTexts.size === 0) {
      return [];
    }

    const firstVerseText = verseTexts.values().next().value;
    if (!firstVerseText || firstVerseText.translations.length !== translations.length) {
      return [];
    }

    const page = verses[0]?.page;
    if (!page) {
      return [];
    }

    const items: TranslationItem[] = [];

    // Sort verses
    const sortedVerses = [...verses].sort((a, b) => {
      if (a.sura.suraNumber !== b.sura.suraNumber) {
        return a.sura.suraNumber - b.sura.suraNumber;
      }
      return a.ayah - b.ayah;
    });

    for (const verse of sortedVerses) {
      const verseKey = `${verse.sura.suraNumber}:${verse.ayah}`;
      const verseText = verseTexts.get(verseKey);
      if (!verseText) continue;

      const color = highlights.get(verseKey) ?? null;

      // Add sura name if new sura
      if (verse.sura.firstVerse && this.versesEqual(verse.sura.firstVerse, verse)) {
        items.push({
          type: 'suraName',
          data: createTranslationSuraName(verse.sura, arabicFontSize),
          color,
        });
      }

      // Add Arabic quran text
      const arabicVerseNumber = NumberFormatter.arabicNumberFormatter.format(verse.ayah);
      const arabicText = `${verseText.arabicText} ${arabicVerseNumber}`;
      items.push({
        type: 'arabicText',
        data: createTranslationArabicText(verse, arabicText, arabicFontSize),
        color,
      });

      // Add translations
      for (let index = 0; index < translations.length; index++) {
        const translation = translations[index];
        const text = verseText.translations[index];

        if (text.type === 'reference') {
          items.push({
            type: 'translationReferenceVerse',
            data: createTranslationReferenceVerse(verse, translation, text.reference, translationFontSize),
            color,
          });
        } else if (text.type === 'string') {
          const { chunks, readMore } = this.getChunksForTranslation(verse, translation, text.value);

          for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const isLastChunk = chunkIndex === chunks.length - 1;
            items.push({
              type: 'translationTextChunk',
              data: createTranslationTextChunk(
                verse,
                translation,
                text.value,
                chunks,
                chunkIndex,
                isLastChunk ? readMore : false,
                translationFontSize
              ),
              color,
            });
          }
        }

        // Show translator if showing more than one translation
        if (translations.length > 1) {
          items.push({
            type: 'translatorText',
            data: createTranslatorText(verse, translation, translationFontSize),
            color,
          });
        }
      }

      // Add separator if not last verse
      const isLastVerse = verses.length > 0 && this.versesEqual(verses[verses.length - 1], verse);
      if (!isLastVerse) {
        items.push({
          type: 'verseSeparator',
          data: createTranslationVerseSeparator(verse),
          color,
        });
      }
    }

    // Add header and footer
    if (showHeaderAndFooter) {
      items.unshift({
        type: 'pageHeader',
        data: createTranslationPageHeader(page),
      });
      items.push({
        type: 'pageFooter',
        data: createTranslationPageFooter(page),
      });
    }

    return items;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  addListener(listener: (state: ContentTranslationViewState) => void): void {
    this.stateListeners.push(listener);
  }

  removeListener(listener: (state: ContentTranslationViewState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  private setState(updates: Partial<ContentTranslationViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.stateListeners) {
      listener(this._state);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Set the verses to display.
   */
  setVerses(verses: AyahNumber[]): void {
    this.setState({ verses });
  }

  /**
   * Set whether to show header and footer.
   */
  setShowHeaderAndFooter(show: boolean): void {
    this.setState({ showHeaderAndFooter: show });
  }

  /**
   * Load translation data.
   */
  async load(): Promise<void> {
    try {
      const { verses, selectedTranslations } = this._state;
      logger.info(`Loading translations data; selectedTranslations='${selectedTranslations}'; verses='${verses.length}'`);

      const localTranslations = await this.localTranslationsRetriever.getLocalTranslations();
      const translations = this.selectedTranslationsPreferences.selectedTranslations(localTranslations);

      this.setState({ translations });

      const verseTextsMap = await this.dataService.textForVerses(verses, translations);
      const verseTexts = new Map<string, VerseText>();
      for (const [verse, text] of verseTextsMap) {
        const key = `${verse.sura.suraNumber}:${verse.ayah}`;
        verseTexts.set(key, text);
      }

      this.setState({ verseTexts });

      this.scrollToVerseIfNeeded();
    } catch (error) {
      // TODO: should show error to the user
      crasher.recordError(error as Error, 'Failed to retrieve quran page details');
    }
  }

  /**
   * Handle URL open.
   */
  openURL(urlString: string): void {
    const url = parseTranslationURL(urlString);
    if (!url) return;

    switch (url.type) {
      case 'footnote':
        this.setFootnoteIfNeeded(url.translationId, url.sura, url.ayah, url.footnoteIndex);
        break;
      case 'readMore':
        this.expandTranslationIfNeeded(url.translationId, url.sura, url.ayah);
        break;
    }
  }

  /**
   * Get the ayah at a point.
   */
  ayahAtPoint(point: Point): AyahNumber | null {
    const itemId = this.tracker.itemAtPoint(point);
    return itemId ? translationItemIdAyah(itemId) : null;
  }

  /**
   * Dismiss footnote.
   */
  dismissFootnote(): void {
    this.setState({ footnote: null });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupListeners(): void {
    // Listen to highlights changes
    this.highlightsService.addListener('highlights', (highlights) => {
      this.setState({ highlights: this.extractHighlights(highlights) });
    });

    // Listen to scrolling events
    this.highlightsService.addListener('scrolling', () => {
      this.scrollToVerseIfNeeded();
    });

    // Listen to font size changes
    this.fontSizePreferences.addListener('translationFontSize', (size) => {
      this.setState({ translationFontSize: size });
    });

    this.fontSizePreferences.addListener('arabicFontSize', (size) => {
      this.setState({ arabicFontSize: size });
    });

    // Listen to selected translations changes
    this.selectedTranslationsPreferences.addListener('selectedTranslationIds', (ids: number[]) => {
      this.setState({ selectedTranslations: ids });
    });
  }

  private extractHighlights(highlights: QuranHighlights): Map<string, string> {
    const result = new Map<string, string>();

    // Get verses by highlights with colors
    const versesByHighlights = this.getVersesByHighlights(highlights);
    for (const [verse, color] of versesByHighlights) {
      const key = `${verse.sura.suraNumber}:${verse.ayah}`;
      result.set(key, color);
    }

    return result;
  }

  private getVersesByHighlights(highlights: QuranHighlights): Map<AyahNumber, string> {
    const result = new Map<AyahNumber, string>();

    // Reading verses
    for (const verse of highlights.readingVerses) {
      result.set(verse, 'rgba(255, 204, 0, 0.35)');
    }

    // Search verses
    for (const verse of highlights.searchVerses) {
      result.set(verse, 'rgba(255, 204, 0, 0.35)');
    }

    // Share verses override everything else for in-progress selection (matches iOS)
    for (const verse of highlights.shareVerses) {
      result.set(verse, 'rgba(0, 122, 255, 0.2)');
    }

    return result;
  }

  private versesEqual(a: IAyahNumber, b: IAyahNumber): boolean {
    return a.sura.suraNumber === b.sura.suraNumber && a.ayah === b.ayah;
  }

  private getChunksForTranslation(
    verse: IAyahNumber,
    translation: Translation,
    text: TranslationString
  ): { chunks: Array<{ start: number; end: number }>; readMore: boolean } {
    const cutoffChunk = this.cutoffChunkIfTruncationNeeded(text.text);

    if (!cutoffChunk) {
      return {
        chunks: [{ start: 0, end: text.text.length }],
        readMore: false,
      };
    }

    const verseKey = `${verse.sura.suraNumber}:${verse.ayah}`;
    const expandedChunks = this._state.expandedTranslations.get(verseKey)?.get(translation.id);

    if (expandedChunks) {
      return { chunks: expandedChunks, readMore: false };
    }

    return { chunks: [cutoffChunk], readMore: true };
  }

  private cutoffChunkIfTruncationNeeded(text: string): { start: number; end: number } | null {
    if (text.length <= ContentTranslationViewModel.MAX_CHUNK_SIZE) {
      return null;
    }

    // Find the last space before max chunk size
    const maxIndex = ContentTranslationViewModel.MAX_CHUNK_SIZE;
    const substring = text.substring(0, maxIndex);
    const lastSpaceIndex = substring.lastIndexOf(' ');

    const endIndex = lastSpaceIndex > 0 ? lastSpaceIndex : maxIndex;
    return { start: 0, end: endIndex };
  }

  private expandTranslationIfNeeded(translationId: Translation['id'], sura: number, ayah: number): void {
    this.performOnTranslationText(translationId, sura, ayah, (verse, translation, text) => {
      const cutoffChunk = this.cutoffChunkIfTruncationNeeded(text.text);
      if (!cutoffChunk) return;

      // Calculate remaining chunks
      const remainingText = text.text.substring(cutoffChunk.end);
      const remainingChunks = chunkString(remainingText, ContentTranslationViewModel.MAX_CHUNK_SIZE).map((chunk) => ({
        start: cutoffChunk.end + chunk.start,
        end: cutoffChunk.end + chunk.end,
      }));

      const allChunks = [cutoffChunk, ...remainingChunks];

      // Update expanded translations
      const verseKey = `${verse.sura.suraNumber}:${verse.ayah}`;
      const expandedTranslations = new Map(this._state.expandedTranslations);
      const verseExpanded = new Map(expandedTranslations.get(verseKey) ?? []);
      verseExpanded.set(translation.id, allChunks);
      expandedTranslations.set(verseKey, verseExpanded);

      this.setState({ expandedTranslations });
    });
  }

  private setFootnoteIfNeeded(translationId: Translation['id'], sura: number, ayah: number, footnoteIndex: number): void {
    this.performOnTranslationText(translationId, sura, ayah, (verse, translation, text) => {
      const footnote: TranslationFootnote = {
        string: text,
        footnoteIndex,
        translation,
        translationFontSize: this._state.translationFontSize,
      };
      this.setState({ footnote });
    });
  }

  private performOnTranslationText(
    translationId: Translation['id'],
    sura: number,
    ayah: number,
    body: (verse: AyahNumber, translation: Translation, text: TranslationString) => void
  ): void {
    const { verses, translations, verseTexts } = this._state;

    const quran = verses[0]?.sura?.quran;
    if (!quran) return;

    // Find the verse
    const verse = verses.find((v) => v.sura.suraNumber === sura && v.ayah === ayah);
    if (!verse) return;

    // Find the translation
    const translation = translations.find((t) => t.id === translationId);
    if (!translation) return;

    const translationIndex = translations.indexOf(translation);
    if (translationIndex < 0) return;

    // Get the verse text
    const verseKey = `${sura}:${ayah}`;
    const verseText = verseTexts.get(verseKey);
    if (!verseText) return;

    const translationText = verseText.translations[translationIndex];
    if (translationText.type !== 'string') return;

    body(verse, translation, translationText.value);
  }

  private scrollToVerseIfNeeded(): void {
    // Execute in the next tick
    setTimeout(() => {
      this.scrollToVerseIfNeededSynchronously();
    }, 0);
  }

  private scrollToVerseIfNeededSynchronously(): void {
    const ayah = this.firstScrollingVerse(this.highlightsService.highlights);
    if (!ayah) return;

    const items = this.items;
    for (const item of items) {
      const itemAyah = translationItemIdAyah(item.data.id);
      if (itemAyah && this.versesEqual(itemAyah, ayah)) {
        logger.info(`Quran Translation: scrollToVerseIfNeeded ${ayah.sura.suraNumber}:${ayah.ayah}`);
        this.setState({ scrollToItem: item.data.id });
        break;
      }
    }
  }

  private firstScrollingVerse(highlights: QuranHighlights): AyahNumber | null {
    if (highlights.readingVerses.length > 0) {
      return highlights.readingVerses[0];
    }
    if (highlights.searchVerses.length > 0) {
      return highlights.searchVerses[0];
    }
    return null;
  }
}
