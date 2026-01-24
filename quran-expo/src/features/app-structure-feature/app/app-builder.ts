/**
 * AppBuilder.swift → app-builder.ts
 *
 * Builder for the main app.
 *
 * Quran.com. All rights reserved.
 */

import type { AppDependencies } from '../../app-dependencies';
import type { TabBuildable } from '../common';
import { AppInteractor } from './app-interactor';
import {
  HomeTabBuilder,
  BookmarksTabBuilder,
  NotesTabBuilder,
  SearchTabBuilder,
  SettingsTabBuilder,
} from '../tabs';

// ============================================================================
// AppBuilder
// ============================================================================

/**
 * Builder for the main app.
 *
 * 1:1 translation of iOS AppBuilder.
 */
export class AppBuilder {
  private readonly container: AppDependencies;

  constructor(container: AppDependencies) {
    this.container = container;
  }

  /**
   * Build the app interactor with all tabs.
   *
   * In iOS, this returns a UIViewController.
   * In React Native, we return the interactor and let the component handle rendering.
   */
  build(): AppInteractor {
    const tabs: TabBuildable[] = [
      new HomeTabBuilder(this.container),
      new NotesTabBuilder(this.container),
      new BookmarksTabBuilder(this.container),
      new SearchTabBuilder(this.container),
      new SettingsTabBuilder(this.container),
    ];

    return new AppInteractor(
      this.container.supportsCloudKit,
      this.container.analytics,
      this.container.lastPagePersistence,
      tabs
    );
  }

  /**
   * Get all tab builders.
   */
  getTabBuilders(): TabBuildable[] {
    return [
      new HomeTabBuilder(this.container),
      new NotesTabBuilder(this.container),
      new BookmarksTabBuilder(this.container),
      new SearchTabBuilder(this.container),
      new SettingsTabBuilder(this.container),
    ];
  }
}

