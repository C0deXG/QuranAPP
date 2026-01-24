/**
 * PageGeometryActions.swift → page-geometry-actions.ts
 *
 * Page geometry actions for hit testing.
 *
 * Quran.com. All rights reserved.
 */

import type { Word, AyahNumber } from '../../model/quran-kit';
import type { Point } from '../../model/quran-geometry';

// ============================================================================
// PageGeometryActions
// ============================================================================

/**
 * Actions for hit testing words and verses on a page.
 *
 * 1:1 translation of iOS PageGeometryActions.
 */
export interface PageGeometryActions {
  /** Unique identifier for this action set */
  id: string;
  /** Get the word at a point */
  word: (point: Point) => Word | null;
  /** Get the verse at a point */
  verse: (point: Point) => AyahNumber | null;
}

/**
 * Create a PageGeometryActions instance.
 */
export function createPageGeometryActions(
  id: string,
  word: (point: Point) => Word | null,
  verse: (point: Point) => AyahNumber | null
): PageGeometryActions {
  return { id, word, verse };
}

/**
 * Compare two PageGeometryActions for equality.
 * Only compares by id, not by the functions themselves.
 */
export function pageGeometryActionsEqual(
  lhs: PageGeometryActions,
  rhs: PageGeometryActions
): boolean {
  return lhs.id === rhs.id;
}

// ============================================================================
// Context for Geometry Actions
// ============================================================================

import { createContext, useContext } from 'react';

/**
 * Context for collecting geometry actions from child components.
 */
export interface GeometryActionsContextValue {
  /** Register a geometry action */
  registerActions: (actions: PageGeometryActions) => void;
  /** Unregister a geometry action */
  unregisterActions: (id: string) => void;
}

export const GeometryActionsContext = createContext<GeometryActionsContextValue | null>(null);

/**
 * Hook to use the geometry actions context.
 */
export function useGeometryActionsContext(): GeometryActionsContextValue | null {
  return useContext(GeometryActionsContext);
}

