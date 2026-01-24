/**
 * QuranHighlightsService.swift → quran-highlights-service.ts
 *
 * Service for managing Quran highlights state.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { QuranHighlights } from '../../model/quran-annotations';
import { createQuranHighlights, needsScrolling } from '../../model/quran-annotations';
import { createLogger } from '../../core/logging';
import { createAsyncPublisher } from '../../core/utilities/async-publisher';

const logger = createLogger('QuranHighlightsService');

// ============================================================================
// QuranHighlightsService
// ============================================================================

/**
 * Service for managing Quran highlights state.
 */
export class QuranHighlightsService {
  private _highlights: QuranHighlights = createQuranHighlights();
  private listeners: Set<(highlights: QuranHighlights) => void> = new Set();
  private scrollListeners: Set<() => void> = new Set();

  /**
   * Gets the current highlights.
   */
  get highlights(): QuranHighlights {
    return this._highlights;
  }

  /**
   * Sets the highlights.
   */
  set highlights(value: QuranHighlights) {
    const oldValue = this._highlights;
    this._highlights = value;
    
    logger.info('Highlights updated');
    
    // Notify listeners
    this.listeners.forEach((listener) => listener(value));
    
    // Check if scrolling is needed
    if (needsScrolling(value, oldValue)) {
      this.scrollListeners.forEach((listener) => listener());
    }
  }

  /**
   * Subscribes to highlights changes.
   */
  subscribe(listener: (highlights: QuranHighlights) => void): () => void {
    this.listeners.add(listener);
    // Emit current value
    listener(this._highlights);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Adds an event listener.
   * Supports 'highlights' and 'scrolling' events.
   */
  addListener(event: string, listener: (data?: QuranHighlights) => void): () => void {
    if (event === 'highlights') {
      return this.subscribe((highlights: QuranHighlights) => listener(highlights));
    } else if (event === 'scrolling') {
      this.scrollListeners.add(listener as () => void);
      return () => {
        this.scrollListeners.delete(listener as () => void);
      };
    }
    return () => {};
  }

  /**
   * Gets an async iterable of highlights.
   */
  highlightsStream(): AsyncIterable<QuranHighlights> {
    const self = this;
    return createAsyncPublisher<QuranHighlights>((emit) => {
      const unsubscribe = self.subscribe((highlights) => {
        emit(highlights);
      });
      return unsubscribe;
    });
  }

  /**
   * Gets an async iterable of scroll events.
   */
  scrollingStream(): AsyncIterable<void> {
    const self = this;
    return createAsyncPublisher<void>((emit) => {
      const listener = () => emit(undefined);
      self.scrollListeners.add(listener);
      
      return () => {
        self.scrollListeners.delete(listener);
      };
    });
  }

  /**
   * Resets highlights to empty state.
   */
  reset(): void {
    this.highlights = createQuranHighlights();
  }
}

// ============================================================================
// Singleton
// ============================================================================

let _sharedInstance: QuranHighlightsService | null = null;

/**
 * Gets the shared QuranHighlightsService instance.
 */
export function getQuranHighlightsService(): QuranHighlightsService {
  if (!_sharedInstance) {
    _sharedInstance = new QuranHighlightsService();
  }
  return _sharedInstance;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a new QuranHighlightsService.
 */
export function createQuranHighlightsService(): QuranHighlightsService {
  return new QuranHighlightsService();
}

