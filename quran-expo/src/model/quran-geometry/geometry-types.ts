/**
 * Geometry types for React Native
 *
 * Provides equivalents for CoreGraphics types (CGRect, CGPoint, CGSize).
 */

/**
 * Represents a 2D point.
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Creates a Point.
 */
export function createPoint(x: number, y: number): Point {
  return { x, y };
}

/**
 * Zero point.
 */
export const POINT_ZERO: Point = { x: 0, y: 0 };

/**
 * Represents a 2D size.
 */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Creates a Size.
 */
export function createSize(width: number, height: number): Size {
  return { width, height };
}

/**
 * Zero size.
 */
export const SIZE_ZERO: Size = { width: 0, height: 0 };

/**
 * Checks if a size is zero.
 */
export function isSizeZero(size: Size): boolean {
  return size.width === 0 || size.height === 0;
}

/**
 * Represents a rectangle.
 */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Creates a Rect.
 */
export function createRect(
  x: number,
  y: number,
  width: number,
  height: number
): Rect {
  return { x, y, width, height };
}

/**
 * Creates a Rect from min/max coordinates.
 */
export function createRectFromMinMax(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): Rect {
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Zero rect.
 */
export const RECT_ZERO: Rect = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Gets the minimum X coordinate.
 */
export function rectMinX(rect: Rect): number {
  return rect.x;
}

/**
 * Gets the maximum X coordinate.
 */
export function rectMaxX(rect: Rect): number {
  return rect.x + rect.width;
}

/**
 * Gets the minimum Y coordinate.
 */
export function rectMinY(rect: Rect): number {
  return rect.y;
}

/**
 * Gets the maximum Y coordinate.
 */
export function rectMaxY(rect: Rect): number {
  return rect.y + rect.height;
}

/**
 * Gets the center point of a rect.
 */
export function rectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Checks if a point is inside a rect.
 */
export function rectContainsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Checks if two rects are equal.
 */
export function rectsEqual(a: Rect, b: Rect): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

