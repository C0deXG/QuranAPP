/**
 * QuranBuilder.swift → quran-builder.ts
 *
 * Builder for the Quran view feature.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../app-dependencies';
import { ReadingPreferences, ReadingResourcesService } from '../../domain/reading-service';
import { quranForReading } from '../../model/quran-kit';
import {
  QuranHighlightsService,
  PageBookmarkService,
} from '../../domain/annotations-service';
import { ContentBuilder, type QuranInput } from '../quran-content-feature';
import { AyahMenuBuilder } from '../ayah-menu-feature';
import { MoreMenuBuilder } from '../more-menu-feature';
import { AudioBannerBuilder } from '../audio-banner-feature';
import { WordPointerBuilder } from '../word-pointer-feature';
import { NoteEditorBuilder } from '../note-editor-feature';
import { TranslationsListBuilder } from '../translations-feature';
import { TranslationVerseBuilder } from '../translation-verse-feature';
import { QuranInteractor, type QuranInteractorDeps } from './quran-interactor';

// ============================================================================
// QuranBuilder
// ============================================================================

/**
 * Builder for the Quran view feature.
 *
 * 1:1 translation of iOS QuranBuilder.
 */
export class QuranBuilder {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly container: AppDependencies;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(container: AppDependencies) {
    this.container = container;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Build the Quran interactor.
   *
   * @param input The input for the Quran view
   * @returns The configured QuranInteractor
   */
  build(input: QuranInput): QuranInteractor {
    const highlightsService = new QuranHighlightsService();
    const quran = quranForReading(ReadingPreferences.shared.reading);
    const pageBookmarkService = new PageBookmarkService(this.container.pageBookmarkPersistence);

    const deps: QuranInteractorDeps = {
      quran,
      analytics: this.container.analytics,
      pageBookmarkService,
      noteService: this.container.noteService(),
      highlightsService,
      ayahMenuBuilder: new AyahMenuBuilder(this.container),
      moreMenuBuilder: new MoreMenuBuilder(),
      audioBannerBuilder: new AudioBannerBuilder(this.container),
      wordPointerBuilder: new WordPointerBuilder(this.container),
      noteEditorBuilder: new NoteEditorBuilder(this.container),
      contentBuilder: new ContentBuilder(this.container, highlightsService),
      translationsSelectionBuilder: new TranslationsListBuilder(this.container),
      translationVerseBuilder: new TranslationVerseBuilder(this.container),
      resources: this.container.readingResources,
    };

    return new QuranInteractor(deps, input);
  }
}

