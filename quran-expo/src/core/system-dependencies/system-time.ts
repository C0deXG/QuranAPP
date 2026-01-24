/**
 * SystemTime.swift → system-time.ts
 *
 * System time abstraction translated from quran-ios Core/SystemDependencies
 * Created by Mohamed Afifi on 2023-05-07.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Interface for system time access.
 * Allows mocking time in tests.
 *
 * Equivalent to Swift's SystemTime protocol.
 */
export interface SystemTime {
  /**
   * Gets the current date/time.
   */
  readonly now: Date;
}

/**
 * Default implementation using the system clock.
 * Equivalent to Swift's DefaultSystemTime.
 */
export class DefaultSystemTime implements SystemTime {
  get now(): Date {
    return new Date();
  }
}

/**
 * Mock system time for testing.
 * Allows setting a fixed or advancing time.
 */
export class MockSystemTime implements SystemTime {
  private _now: Date;

  constructor(initialTime: Date = new Date()) {
    this._now = initialTime;
  }

  get now(): Date {
    return new Date(this._now);
  }

  /**
   * Sets the current time.
   */
  set now(date: Date) {
    this._now = new Date(date);
  }

  /**
   * Advances time by the specified milliseconds.
   */
  advance(milliseconds: number): void {
    this._now = new Date(this._now.getTime() + milliseconds);
  }

  /**
   * Advances time by the specified seconds.
   */
  advanceSeconds(seconds: number): void {
    this.advance(seconds * 1000);
  }

  /**
   * Advances time by the specified minutes.
   */
  advanceMinutes(minutes: number): void {
    this.advance(minutes * 60 * 1000);
  }

  /**
   * Advances time by the specified hours.
   */
  advanceHours(hours: number): void {
    this.advance(hours * 60 * 60 * 1000);
  }

  /**
   * Advances time by the specified days.
   */
  advanceDays(days: number): void {
    this.advance(days * 24 * 60 * 60 * 1000);
  }
}

/**
 * Shared default system time instance.
 */
export const systemTime: SystemTime = new DefaultSystemTime();

