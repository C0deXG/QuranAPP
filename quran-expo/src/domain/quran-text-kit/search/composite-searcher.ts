/**
 * CompositeSearcher.swift → composite-searcher.ts
 *
 * Composite search that combines multiple search strategies.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Directories } from '../../../core/utilities/file-manager';
import type { IQuran } from '../../../model/quran-kit/types';
import type { SearchResults, Translation, SearchResultSource } from '../../../model/quran-text';
import { searchSourceQuran } from '../../../model/quran-text';
import type { VerseTextPersistence, TranslationVerseTextPersistence } from '../../../data/verse-text-persistence';
import { SQLiteQuranVerseTextPersistence, SQLiteTranslationVerseTextPersistence } from '../../../data/verse-text-persistence';
import { LocalTranslationsRetriever } from '../../translation-service';
import type { Searcher } from './searchers';
import { NumberSearcher, PersistenceSearcher, SuraSearcher, TranslationSearcher } from './searchers';
import { createSearchTerm, containsArabic, containsOnlyNumbers } from './search-term';
import { createLogger } from '../../../core/logging';
import { orderedUnique } from '../../../core/utilities/sequence';

const logger = createLogger('CompositeSearcher');

// ============================================================================
// CompositeSearcher
// ============================================================================

/**
 * Combines multiple search strategies for comprehensive search.
 */
export class CompositeSearcher {
  private readonly simpleSearchers: Searcher[];
  private readonly translationsSearcher: Searcher;

  constructor(
    quranVerseTextPersistence: VerseTextPersistence,
    localTranslationRetriever: LocalTranslationsRetriever,
    versePersistenceBuilder: (translation: Translation) => TranslationVerseTextPersistence
  ) {
    const numberSearcher = new NumberSearcher(quranVerseTextPersistence);
    const quranSearcher = new PersistenceSearcher(quranVerseTextPersistence, searchSourceQuran());
    const suraSearcher = new SuraSearcher();
    const translationSearcher = new TranslationSearcher(
      localTranslationRetriever,
      versePersistenceBuilder
    );

    this.simpleSearchers = [numberSearcher, suraSearcher, quranSearcher];
    this.translationsSearcher = translationSearcher;
  }

  /**
   * Creates a CompositeSearcher with default persistence.
   */
  static create(databasesPath: string, quranFilePath: string): CompositeSearcher {
    const persistence = SQLiteQuranVerseTextPersistence.fromPath(quranFilePath);
    const localTranslationRetriever = new LocalTranslationsRetriever(databasesPath);

    return new CompositeSearcher(
      persistence,
      localTranslationRetriever,
      (translation) => {
        const localPath = `${Directories.documents}translations/${translation.fileName.replace(/\.zip$/, '.db')}`;
        return SQLiteTranslationVerseTextPersistence.fromPath(localPath);
      }
    );
  }

  /**
   * Autocompletes a search term.
   */
  async autocomplete(termString: string, quran: IQuran): Promise<string[]> {
    const term = createSearchTerm(termString);
    if (!term) {
      return [];
    }

    logger.info(`Autocompleting term: ${term.compactQuery}`);

    // Run simple searches in parallel
    const autocompletions = await Promise.all(
      this.simpleSearchers.map(async (searcher) => {
        try {
          return await searcher.autocomplete(term, quran);
        } catch {
          return [];
        }
      })
    );

    let results = autocompletions.flat();

    // Add translation search if needed
    if (this.shouldPerformTranslationSearch(results, term.compactQuery)) {
      try {
        const translationResults = await this.translationsSearcher.autocomplete(term, quran);
        results = results.concat(translationResults);
      } catch {
        // Ignore translation search errors
      }
    }

    // Ensure original term is included
    if (!results.includes(term.compactQuery)) {
      results.unshift(term.compactQuery);
    }

    return orderedUnique(results);
  }

  /**
   * Searches for a term.
   */
  async search(termString: string, quran: IQuran): Promise<SearchResults[]> {
    const term = createSearchTerm(termString);
    if (!term) {
      return [];
    }

    logger.info(`Search for: ${term.compactQuery}`);

    // Run simple searches in parallel
    const searchResults = await Promise.all(
      this.simpleSearchers.map((searcher) => searcher.search(term, quran))
    );

    let results = searchResults.flat().filter((r) => r.items.length > 0);

    // Add translation search if needed
    if (this.shouldPerformTranslationSearch(results, term.compactQuery)) {
      try {
        const translationResults = await this.translationsSearcher.search(term, quran);
        results = results.concat(translationResults.filter((r) => r.items.length > 0));
      } catch {
        // Ignore translation search errors
      }
    }

    return this.groupedResults(results);
  }

  /**
   * Groups results by source.
   */
  private groupedResults(results: SearchResults[]): SearchResults[] {
    const resultsPerSource = new Map<string, SearchResults>();

    for (const result of results) {
      const sourceKey = this.sourceKey(result.source);
      const existing = resultsPerSource.get(sourceKey);

      if (existing) {
        existing.items.push(...result.items);
      } else {
        resultsPerSource.set(sourceKey, {
          source: result.source,
          items: [...result.items],
        });
      }
    }

    return Array.from(resultsPerSource.values()).sort((a, b) => {
      return this.sourceOrder(a.source) - this.sourceOrder(b.source);
    });
  }

  /**
   * Gets a unique key for a source.
   */
  private sourceKey(source: SearchResultSource): string {
    if (source.type === 'quran') {
      return 'quran';
    }
    return `translation:${source.translation.id}`;
  }

  /**
   * Gets the sort order for a source.
   */
  private sourceOrder(source: SearchResultSource): number {
    if (source.type === 'quran') {
      return 0;
    }
    return 1;
  }

  /**
   * Determines if translation search should be performed.
   */
  private shouldPerformTranslationSearch(simpleResults: unknown[], term: string): boolean {
    return simpleResults.length === 0 || (!containsArabic(term) && !containsOnlyNumbers(term));
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a composite searcher.
 */
export function createCompositeSearcher(
  databasesPath?: string,
  quranFilePath?: string
): CompositeSearcher {
  const dbPath = databasesPath ?? `${Directories.documents}translations/`;
  const quranPath = quranFilePath ?? `${Directories.documents}quran.ar.db`;
  return CompositeSearcher.create(dbPath, quranPath);
}

