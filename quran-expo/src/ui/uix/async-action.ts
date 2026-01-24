/**
 * AsyncAction.swift → async-action.ts
 *
 * Type definitions for async actions.
 *
 * Quran.com. All rights reserved.
 */

/**
 * An async action that takes no arguments.
 */
export type AsyncAction = () => Promise<void>;

/**
 * An action that takes an item as argument.
 */
export type ItemAction<Item> = (item: Item) => void;

/**
 * An async action that takes an item as argument.
 */
export type AsyncItemAction<Item> = (item: Item) => Promise<void>;

