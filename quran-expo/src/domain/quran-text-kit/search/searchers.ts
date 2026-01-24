/**
 * Searcher.swift, NumberSearcher.swift, PersistenceSearcher.swift,
 * SuraSearcher.swift, TranslationSearcher.swift → searchers.ts
 *
 * Search implementations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { IQuran } from '../../../model/quran-kit/types';
import type { SearchResults, SearchResult, Translation, SearchResultSource } from '../../../model/quran-text';
import { createSearchResults, createSearchResult, searchSourceQuran, searchSourceTranslation } from '../../../model/quran-text';
import type { VerseTextPersistence, SearchableTextPersistence, TranslationVerseTextPersistence } from '../../../data/verse-text-persistence';
import type { LocalTranslationsRetriever } from '../../translation-service';
import type { SearchTerm } from './search-term';
import {
  buildAutocompletions,
  buildSearchResults,
  getPersistenceQueryReplacingArabicSimilarity,
} from './search-term';
import {
  getLocalizedSuraName,
  getLocalizedPageName,
  getLocalizedJuzName,
  getLocalizedHizbName,
} from '../localization/quran-kit-localization';
import type { Language } from '../../../core/localization';

// ============================================================================
// Searcher Interface
// ============================================================================

/**
 * Interface for search implementations.
 */
export interface Searcher {
  autocomplete(term: SearchTerm, quran: IQuran): Promise<string[]>;
  search(term: SearchTerm, quran: IQuran): Promise<SearchResults[]>;
}

// ============================================================================
// NumberSearcher
// ============================================================================

/**
 * Searches for numeric patterns (sura:ayah, page, juz, etc.).
 */
export class NumberSearcher implements Searcher {
  private readonly quranVerseTextPersistence: VerseTextPersistence;

  constructor(quranVerseTextPersistence: VerseTextPersistence) {
    this.quranVerseTextPersistence = quranVerseTextPersistence;
  }

  async autocomplete(term: SearchTerm, quran: IQuran): Promise<string[]> {
    if (/^\d+$/.test(term.compactQuery)) {
      return buildAutocompletions(term, [term.compactQuery]);
    }
    return [];
  }

  async search(term: SearchTerm, quran: IQuran): Promise<SearchResults[]> {
    const items = await this.doSearch(term, quran);
    return [createSearchResults({ source: searchSourceQuran(), items })];
  }

  private async doSearch(term: SearchTerm, quran: IQuran): Promise<SearchResult[]> {
    const components = this.parseIntArray(term.compactQuery);
    if (components.length === 0) {
      return [];
    }

    if (components.length === 2) {
      const result = await this.parseVerseResult(components[0], components[1], quran);
      return result ? [result] : [];
    } else {
      const results = [
        this.parseSuraResult(components[0], quran),
        this.parseJuzResult(components[0], quran),
        this.parseHizbResult(components[0], quran),
        this.parsePageResult(components[0], quran),
      ];
      return results.filter((r): r is SearchResult => r !== null);
    }
  }

  private async parseVerseResult(sura: number, verse: number, quran: IQuran): Promise<SearchResult | null> {
    const ayah = quran.verses.find((v) => v.sura.suraNumber === sura && v.ayah === verse);
    if (!ayah) return null;

    const ayahText = await this.quranVerseTextPersistence.textForVerse(ayah);
    return createSearchResult({ text: ayahText, ranges: [], ayah });
  }

  private parseSuraResult(sura: number, quran: IQuran): SearchResult | null {
    const suraObj = quran.suras.find((s) => s.suraNumber === sura);
    if (!suraObj) return null;

    return createSearchResult({
      text: getLocalizedSuraName(suraObj, { withPrefix: true }),
      ranges: [],
      ayah: suraObj.firstVerse,
    });
  }

  private parsePageResult(page: number, quran: IQuran): SearchResult | null {
    const pageObj = quran.pages.find((p) => p.pageNumber === page);
    if (!pageObj) return null;

    return createSearchResult({
      text: getLocalizedPageName(pageObj),
      ranges: [],
      ayah: pageObj.firstVerse,
    });
  }

  private parseJuzResult(juz: number, quran: IQuran): SearchResult | null {
    const juzObj = quran.juzs.find((j) => j.juzNumber === juz);
    if (!juzObj) return null;

    return createSearchResult({
      text: getLocalizedJuzName(juzObj),
      ranges: [],
      ayah: juzObj.firstVerse,
    });
  }

  private parseHizbResult(hizb: number, quran: IQuran): SearchResult | null {
    const hizbObj = quran.hizbs.find((h) => h.hizbNumber === hizb);
    if (!hizbObj) return null;

    return createSearchResult({
      text: getLocalizedHizbName(hizbObj),
      ranges: [],
      ayah: hizbObj.firstVerse,
    });
  }

  private parseIntArray(term: string): number[] {
    const components = term.split(':');
    if (components.length === 0 || components.length > 2) {
      return [];
    }

    const result = components.map((c) => parseInt(c, 10)).filter((n) => !isNaN(n));
    return result.length === components.length ? result : [];
  }
}

// ============================================================================
// PersistenceSearcher
// ============================================================================

/**
 * Searches using a persistence layer.
 */
export class PersistenceSearcher implements Searcher {
  private readonly versePersistence: SearchableTextPersistence;
  private readonly source: SearchResultSource;

  constructor(versePersistence: SearchableTextPersistence, source: SearchResultSource) {
    this.versePersistence = versePersistence;
    this.source = source;
  }

  async autocomplete(term: SearchTerm, quran: IQuran): Promise<string[]> {
    const matches = await this.versePersistence.autocomplete(term.persistenceQuery);
    return buildAutocompletions(term, matches);
  }

  async search(term: SearchTerm, quran: IQuran): Promise<SearchResults[]> {
    const persistenceSearchTerm = getPersistenceQueryReplacingArabicSimilarity(term);
    if (!persistenceSearchTerm) {
      return [];
    }

    const matches = await this.versePersistence.search(persistenceSearchTerm, quran);
    const items = buildSearchResults(term, matches);
    return [createSearchResults({ source: this.source, items })];
  }
}

// ============================================================================
// SuraSearcher
// ============================================================================

/**
 * Searches for sura names.
 */
export class SuraSearcher implements Searcher {
  async autocomplete(term: SearchTerm, quran: IQuran): Promise<string[]> {
    const defaultSuraNames = quran.suras.map((s) => getLocalizedSuraName(s, { withPrefix: true }));
    const arabicSuraNames = quran.suras.map((s) =>
      getLocalizedSuraName(s, { withPrefix: true, language: 'ar' })
    );

    const suraNames = new Set([...defaultSuraNames, ...arabicSuraNames]);
    return buildAutocompletions(term, Array.from(suraNames));
  }

  async search(term: SearchTerm, quran: IQuran): Promise<SearchResults[]> {
    const items: SearchResult[] = [];

    for (const sura of quran.suras) {
      const defaultName = getLocalizedSuraName(sura, { withPrefix: true });
      const arabicName = getLocalizedSuraName(sura, { withPrefix: true, language: 'ar' });
      const suraNames = new Set([defaultName, arabicName]);

      for (const suraName of suraNames) {
        const results = buildSearchResults(term, [{ verse: sura.firstVerse, text: suraName }]);
        items.push(...results);
      }
    }

    return [createSearchResults({ source: searchSourceQuran(), items })];
  }
}

// ============================================================================
// TranslationSearcher
// ============================================================================

/**
 * Searches across downloaded translations.
 */
export class TranslationSearcher implements Searcher {
  private readonly localTranslationRetriever: LocalTranslationsRetriever;
  private readonly versePersistenceBuilder: (translation: Translation) => SearchableTextPersistence;

  constructor(
    localTranslationRetriever: LocalTranslationsRetriever,
    versePersistenceBuilder: (translation: Translation) => SearchableTextPersistence
  ) {
    this.localTranslationRetriever = localTranslationRetriever;
    this.versePersistenceBuilder = versePersistenceBuilder;
  }

  async autocomplete(term: SearchTerm, quran: IQuran): Promise<string[]> {
    const translations = await this.getDownloadedTranslations();

    for (const translation of translations) {
      const persistence = this.versePersistenceBuilder(translation);
      const searcher = new PersistenceSearcher(persistence, searchSourceTranslation(translation));
      const results = await searcher.autocomplete(term, quran);
      if (results.length > 0) {
        return results;
      }
    }

    return [];
  }

  async search(term: SearchTerm, quran: IQuran): Promise<SearchResults[]> {
    const translations = await this.getDownloadedTranslations();

    const results = await Promise.all(
      translations.map(async (translation) => {
        const persistence = this.versePersistenceBuilder(translation);
        const searcher = new PersistenceSearcher(persistence, searchSourceTranslation(translation));
        return searcher.search(term, quran);
      })
    );

    return results.flat();
  }

  private async getDownloadedTranslations(): Promise<Translation[]> {
    const translations = await this.localTranslationRetriever.getLocalTranslations();
    return translations.filter((t) => t.installedVersion !== undefined);
  }
}

