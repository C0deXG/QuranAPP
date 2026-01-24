/**
 * Timer.swift → timer.ts
 *
 * Timer utilities translated from quran-ios Core/Timing
 * Created by Mohamed Afifi on 5/2/16.
 *
 * Uses JavaScript's setTimeout/setInterval with pause/resume support.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { Protected } from '../utilities/locking';

/**
 * Timer state for pause/resume functionality.
 */
enum TimerState {
  Paused = 'paused',
  Resumed = 'resumed',
}

/**
 * A timer with pause/resume support.
 * Equivalent to Swift's Timer class from Core/Timing.
 *
 * @example
 * // One-shot timer (fires after 5 seconds)
 * const timer = new Timer({
 *   interval: 5000,
 *   handler: () => console.log('Timer fired!'),
 * });
 *
 * // Repeating timer (fires every second, starts immediately)
 * const repeating = new Timer({
 *   interval: 1000,
 *   repeated: true,
 *   startNow: true,
 *   handler: () => console.log('Tick'),
 * });
 *
 * // Control the timer
 * repeating.pause();
 * repeating.resume();
 * repeating.cancel();
 */
export class Timer {
  private readonly repeated: boolean;
  private readonly interval: number;
  private readonly eventHandler: () => void;

  private timerId: ReturnType<typeof setTimeout> | null = null;
  private cancelled = new Protected(false);
  private state = new Protected(TimerState.Resumed);
  private remainingTime: number = 0;
  private lastStartTime: number = 0;

  /**
   * Creates a new timer.
   *
   * @param options - Timer configuration
   * @param options.interval - Interval in milliseconds
   * @param options.repeated - Whether to repeat (default: false)
   * @param options.startNow - Whether to fire immediately (default: false)
   * @param options.handler - Callback when timer fires
   */
  constructor(options: {
    interval: number;
    repeated?: boolean;
    startNow?: boolean;
    handler: () => void;
  }) {
    const { interval, repeated = false, startNow = false, handler } = options;

    this.interval = interval;
    this.repeated = repeated;
    this.eventHandler = handler;

    // Schedule the timer
    if (startNow) {
      // Fire immediately, then schedule next if repeated
      this.fired();
      if (repeated && !this.cancelled.value) {
        this.scheduleNext();
      }
    } else {
      this.scheduleNext();
    }
  }

  /**
   * Whether the timer has been cancelled.
   */
  get isCancelled(): boolean {
    return this.cancelled.value;
  }

  /**
   * Cancels the timer.
   */
  cancel(): void {
    this.cancelled.value = true;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Pauses the timer.
   * Can be resumed later with remaining time preserved.
   */
  pause(): void {
    this.state.sync((state) => {
      if (state !== TimerState.Resumed) {
        return;
      }

      this.state.value = TimerState.Paused;

      if (this.timerId !== null) {
        // Calculate remaining time
        const elapsed = Date.now() - this.lastStartTime;
        this.remainingTime = Math.max(0, this.interval - elapsed);

        clearTimeout(this.timerId);
        this.timerId = null;
      }
    });
  }

  /**
   * Resumes a paused timer.
   */
  resume(): void {
    this.state.sync((state) => {
      if (state !== TimerState.Paused) {
        return;
      }

      this.state.value = TimerState.Resumed;

      if (!this.cancelled.value) {
        // Resume with remaining time
        this.lastStartTime = Date.now();
        this.timerId = setTimeout(() => this.fired(), this.remainingTime);
      }
    });
  }

  /**
   * Schedules the next timer fire.
   */
  private scheduleNext(): void {
    if (this.cancelled.value) {
      return;
    }

    this.lastStartTime = Date.now();
    this.remainingTime = this.interval;

    this.timerId = setTimeout(() => {
      this.fired();
    }, this.interval);
  }

  /**
   * Called when the timer fires.
   */
  private fired(): void {
    if (this.cancelled.value) {
      return;
    }

    // Execute handler
    this.eventHandler();

    // Schedule next if repeated
    if (this.repeated && !this.cancelled.value) {
      this.scheduleNext();
    } else {
      // Auto-cancel one-shot timers
      this.cancel();
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Creates a one-shot timer that fires after the specified delay.
 *
 * @param delayMs - Delay in milliseconds
 * @param handler - Callback when timer fires
 * @returns The timer instance
 */
export function setTimeout_(delayMs: number, handler: () => void): Timer {
  return new Timer({
    interval: delayMs,
    repeated: false,
    handler,
  });
}

/**
 * Creates a repeating timer that fires at the specified interval.
 *
 * @param intervalMs - Interval in milliseconds
 * @param handler - Callback when timer fires
 * @param startNow - Whether to fire immediately
 * @returns The timer instance
 */
export function setInterval_(
  intervalMs: number,
  handler: () => void,
  startNow: boolean = false
): Timer {
  return new Timer({
    interval: intervalMs,
    repeated: true,
    startNow,
    handler,
  });
}

/**
 * Creates a timer that fires after a delay, with automatic cleanup.
 * Returns a promise that resolves when the timer fires.
 *
 * @param delayMs - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function delay(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    new Timer({
      interval: delayMs,
      handler: resolve,
    });
  });
}

/**
 * Creates a cancellable delay.
 *
 * @param delayMs - Delay in milliseconds
 * @returns Object with promise and cancel function
 */
export function cancellableDelay(delayMs: number): {
  promise: Promise<void>;
  cancel: () => void;
} {
  let timer: Timer;
  const promise = new Promise<void>((resolve) => {
    timer = new Timer({
      interval: delayMs,
      handler: resolve,
    });
  });

  return {
    promise,
    cancel: () => timer.cancel(),
  };
}

/**
 * Debounces a function call.
 *
 * @param fn - Function to debounce
 * @param delayMs - Debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number
): T {
  let timer: Timer | null = null;

  return ((...args: unknown[]) => {
    if (timer) {
      timer.cancel();
    }

    timer = new Timer({
      interval: delayMs,
      handler: () => {
        timer = null;
        fn(...args);
      },
    });
  }) as T;
}

/**
 * Throttles a function call.
 *
 * @param fn - Function to throttle
 * @param intervalMs - Throttle interval in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  intervalMs: number
): T {
  let lastCall = 0;
  let timer: Timer | null = null;

  return ((...args: unknown[]) => {
    const now = Date.now();
    const remaining = intervalMs - (now - lastCall);

    if (remaining <= 0) {
      if (timer) {
        timer.cancel();
        timer = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timer) {
      timer = new Timer({
        interval: remaining,
        handler: () => {
          timer = null;
          lastCall = Date.now();
          fn(...args);
        },
      });
    }
  }) as T;
}

