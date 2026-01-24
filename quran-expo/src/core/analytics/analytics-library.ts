/**
 * AnalyticsLibrary.swift → analytics-library.ts
 *
 * Analytics interface translated from quran-ios Core/Analytics
 * Created by Mohamed Afifi on 2023-06-12.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Interface for analytics libraries.
 * Implement this to integrate with analytics services (Firebase, Amplitude, etc.).
 *
 * Equivalent to Swift's AnalyticsLibrary protocol.
 */
export interface AnalyticsLibrary {
  /**
   * Logs an event with a name and value.
   *
   * @param name - Event name
   * @param value - Event value
   */
  logEvent(name: string, value: string): void;
}

/**
 * No-op analytics implementation for development/testing.
 */
export class NoOpAnalyticsLibrary implements AnalyticsLibrary {
  logEvent(name: string, value: string): void {
    if (__DEV__) {
      console.log(`[Analytics] ${name}: ${value}`);
    }
  }
}

/**
 * Console analytics implementation that logs all events.
 */
export class ConsoleAnalyticsLibrary implements AnalyticsLibrary {
  logEvent(name: string, value: string): void {
    console.log(`[Analytics] ${name}: ${value}`);
  }
}

/**
 * Composite analytics library that forwards events to multiple libraries.
 */
export class CompositeAnalyticsLibrary implements AnalyticsLibrary {
  private readonly libraries: AnalyticsLibrary[];

  constructor(libraries: AnalyticsLibrary[]) {
    this.libraries = libraries;
  }

  logEvent(name: string, value: string): void {
    for (const library of this.libraries) {
      library.logEvent(name, value);
    }
  }

  /**
   * Adds an analytics library.
   */
  add(library: AnalyticsLibrary): void {
    this.libraries.push(library);
  }
}

// ============================================================================
// Global Analytics Instance
// ============================================================================

/**
 * Global analytics instance.
 * Should be configured at app startup.
 */
let analyticsInstance: AnalyticsLibrary = new NoOpAnalyticsLibrary();

/**
 * Sets the global analytics library.
 *
 * @example
 * setAnalyticsLibrary(new FirebaseAnalyticsLibrary());
 */
export function setAnalyticsLibrary(library: AnalyticsLibrary): void {
  analyticsInstance = library;
}

/**
 * Gets the global analytics library.
 */
export function getAnalyticsLibrary(): AnalyticsLibrary {
  return analyticsInstance;
}

/**
 * Logs an analytics event using the global library.
 */
export function logAnalyticsEvent(name: string, value: string): void {
  analyticsInstance.logEvent(name, value);
}

// ============================================================================
// Event Helpers
// ============================================================================

/**
 * Creates a typed event logger for a specific event name.
 *
 * @example
 * const logScreenView = createEventLogger('screen_view');
 * logScreenView('HomeScreen');
 */
export function createEventLogger(eventName: string): (value: string) => void {
  return (value: string) => logAnalyticsEvent(eventName, value);
}

/**
 * Creates a typed event logger with structured values.
 *
 * @example
 * const logSearch = createStructuredEventLogger<{ query: string; results: number }>('search');
 * logSearch({ query: 'surah', results: 114 });
 */
export function createStructuredEventLogger<T extends Record<string, unknown>>(
  eventName: string
): (value: T) => void {
  return (value: T) => logAnalyticsEvent(eventName, JSON.stringify(value));
}

