/**
 * Crasher.swift → crasher.ts
 *
 * Crash reporting utilities translated from quran-ios Core/Crashing
 * Created by Mohamed Afifi on 4/28/17.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Protected } from '../utilities/locking';

/**
 * Base class for crasher keys.
 * Used for type erasure when storing keys.
 */
export class CrasherKeyBase {
  readonly key: string;

  constructor(key: string) {
    this.key = key;
  }
}

/**
 * Typed key for crash info values.
 * Equivalent to Swift's CrasherKey<Type>.
 *
 * @example
 * const userIdKey = new CrasherKey<string>('userId');
 * const pageKey = new CrasherKey<number>('currentPage');
 */
export class CrasherKey<T> extends CrasherKeyBase {
  // Type parameter is used for type safety, not at runtime
  private readonly _typeMarker?: T;

  constructor(key: string) {
    super(key);
  }
}

/**
 * Interface for crash info handlers.
 * Implement this to integrate with crash reporting services like Sentry, Crashlytics, etc.
 */
export interface CrashInfoHandler {
  /**
   * Sets a value for a crash info key.
   * These values are attached to crash reports.
   */
  setValue<T>(value: T | null | undefined, forKey: CrasherKey<T>): void;

  /**
   * Records a non-fatal error.
   *
   * @param error - The error to record
   * @param reason - Human-readable reason for the error
   * @param file - Source file where the error occurred
   * @param line - Line number where the error occurred
   */
  recordError(error: Error, reason: string, file?: string, line?: number): void;
}

/**
 * No-op crash handler for development/testing.
 * Logs to console instead of reporting to a crash service.
 */
class NoOpCrashInfoHandler implements CrashInfoHandler {
  setValue<T>(value: T | null | undefined, forKey: CrasherKey<T>): void {
    if (__DEV__) {
      console.log(`[NoOpCrashInfoHandler] setValue called for key: ${forKey.key}`, value);
    }
  }

  recordError(error: Error, reason: string, file?: string, line?: number): void {
    if (__DEV__) {
      console.error(`[NoOpCrashInfoHandler] recordError called:`, {
        reason,
        error: error.message,
        stack: error.stack,
        file,
        line,
      });
    }
  }
}

/**
 * Crash info system for bootstrapping crash reporting.
 * Equivalent to Swift's CrashInfoSystem enum.
 *
 * @example
 * // At app startup, bootstrap with your crash handler:
 * CrashInfoSystem.bootstrap(() => new SentryCrashHandler());
 */
export class CrashInfoSystem {
  private static factory: () => CrashInfoHandler = () => new NoOpCrashInfoHandler();
  private static initialized = new Protected(false);

  /**
   * Bootstraps the crash info system with a handler factory.
   * Can only be called once.
   *
   * @param factory - Factory function that creates a CrashInfoHandler
   * @throws If called more than once
   */
  static bootstrap(factory: () => CrashInfoHandler): void {
    this.initialized.sync((isInitialized) => {
      if (isInitialized) {
        throw new Error('CrashInfoSystem can only be initialized once.');
      }
      this.factory = factory;
      this.initialized.value = true;
    });
  }

  /**
   * Creates a new crash info handler using the registered factory.
   * @internal
   */
  static createHandler(): CrashInfoHandler {
    return this.factory();
  }

  /**
   * Resets the system (for testing only).
   * @internal
   */
  static _reset(): void {
    this.initialized.value = false;
    this.factory = () => new NoOpCrashInfoHandler();
  }
}

/**
 * Crasher for recording errors and crash info.
 * Equivalent to Swift's Crasher struct.
 *
 * @example
 * const crasher = new Crasher();
 *
 * // Set user context
 * crasher.setValue('user123', userIdKey);
 *
 * // Record an error
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   crasher.recordError(error, 'Failed during risky operation');
 * }
 */
export class Crasher {
  readonly handler: CrashInfoHandler;

  constructor() {
    this.handler = CrashInfoSystem.createHandler();
  }

  /**
   * Records a non-fatal error.
   *
   * @param error - The error to record
   * @param reason - Human-readable reason
   * @param file - Optional source file
   * @param line - Optional line number
   */
  recordError(error: Error | unknown, reason: string, file?: string, line?: number): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.handler.recordError(normalizedError, reason, file, line);
  }

  /**
   * Sets a value for crash context.
   *
   * @param value - The value to set (null/undefined to remove)
   * @param forKey - The key to set
   */
  setValue<T>(value: T | null | undefined, forKey: CrasherKey<T>): void {
    this.handler.setValue(value, forKey);
  }

  /**
   * Executes an async operation and records any errors.
   * Re-throws the error after recording.
   *
   * @param message - Context message for the error
   * @param body - Async operation to execute
   * @returns The result of the operation
   * @throws The original error after recording
   */
  async recordErrorAsync<T>(message: string, body: () => Promise<T>): Promise<T> {
    try {
      return await body();
    } catch (error) {
      this.recordError(error, message);
      throw error;
    }
  }

  /**
   * Executes a sync operation and records any errors.
   * Re-throws the error after recording.
   *
   * @param message - Context message for the error
   * @param body - Operation to execute
   * @returns The result of the operation
   * @throws The original error after recording
   */
  recordErrorSync<T>(message: string, body: () => T): T {
    try {
      return body();
    } catch (error) {
      this.recordError(error, message);
      throw error;
    }
  }
}

// ============================================================================
// Global Crasher Instance (from Global.swift)
// ============================================================================

/**
 * Global crasher instance.
 * Equivalent to: public let crasher = Crasher()
 */
export const crasher = new Crasher();

// ============================================================================
// Common Crasher Keys
// ============================================================================

/**
 * Creates a new crasher key.
 *
 * @param key - The key string
 * @returns A typed CrasherKey
 */
export function crasherKey<T>(key: string): CrasherKey<T> {
  return new CrasherKey<T>(key);
}

