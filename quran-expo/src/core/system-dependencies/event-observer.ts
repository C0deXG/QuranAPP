/**
 * EventObserver.swift → event-observer.ts
 *
 * Event observer protocol translated from quran-ios Core/SystemDependencies
 * Created by Mohamed Afifi on 2023-11-05.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { createDeferred, Deferred } from '../utilities/multicast-continuation';

/**
 * Interface for async event notification and waiting.
 * Equivalent to Swift's EventObserver protocol.
 */
export interface EventObserver {
  /**
   * Notifies all waiters that an event has occurred.
   */
  notify(): Promise<void>;

  /**
   * Waits for the next event to occur.
   */
  waitForNextEvent(): Promise<void>;
}

/**
 * Simple implementation of EventObserver using deferred promises.
 */
export class SimpleEventObserver implements EventObserver {
  private waiters: Deferred<void>[] = [];

  async notify(): Promise<void> {
    const currentWaiters = this.waiters;
    this.waiters = [];
    for (const waiter of currentWaiters) {
      waiter.resolve();
    }
  }

  async waitForNextEvent(): Promise<void> {
    const deferred = createDeferred<void>();
    this.waiters.push(deferred);
    return deferred.promise;
  }
}

/**
 * Event observer backed by an async channel.
 * Supports multiple notifications being queued.
 */
export class ChannelEventObserver implements EventObserver {
  private queue: Deferred<void>[] = [];
  private pendingNotifications = 0;

  async notify(): Promise<void> {
    if (this.queue.length > 0) {
      const waiter = this.queue.shift();
      waiter?.resolve();
    } else {
      this.pendingNotifications++;
    }
  }

  async waitForNextEvent(): Promise<void> {
    if (this.pendingNotifications > 0) {
      this.pendingNotifications--;
      return;
    }

    const deferred = createDeferred<void>();
    this.queue.push(deferred);
    return deferred.promise;
  }
}

/**
 * Creates a callable event observer (mimics Swift's callAsFunction).
 *
 * @param observer - The event observer
 * @returns A function that calls notify() when invoked
 */
export function createCallableObserver(observer: EventObserver): () => Promise<void> {
  return () => observer.notify();
}

