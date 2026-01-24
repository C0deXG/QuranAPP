/**
 * WordFrameProcessor.swift + WordFrame+Extension.swift → word-frame-processor.ts
 *
 * Processes word frames into organized collections.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { WordFrame, WordFrameLine, WordFrameCollection } from '../../model/quran-geometry';
import { createWordFrameLine, createWordFrameCollection } from '../../model/quran-geometry';

// ============================================================================
// WordFrame Extensions (from WordFrame+Extension.swift)
// ============================================================================

/**
 * Normalizes a frame ensuring minX <= maxX and minY <= maxY.
 */
function normalizeFrame(frame: WordFrame): WordFrame {
  let { minX, maxX, minY, maxY } = frame;

  if (minX > maxX) {
    [minX, maxX] = [maxX, minX];
  }
  if (minY > maxY) {
    [minY, maxY] = [maxY, minY];
  }

  return { ...frame, minX, maxX, minY, maxY };
}

/**
 * Aligns frames vertically by making them share the same minY and maxY.
 */
function alignFramesVertically(frames: WordFrame[]): WordFrame[] {
  if (frames.length === 0) return [];

  const minY = Math.min(...frames.map((f) => f.minY));
  const maxY = Math.max(...frames.map((f) => f.maxY));

  return frames.map((frame) => ({
    ...frame,
    minY,
    maxY,
  }));
}

/**
 * Unions two frames horizontally (adjusts their edges to meet).
 */
function unionFramesHorizontally(
  leftFrame: WordFrame,
  rightFrame: WordFrame
): [WordFrame, WordFrame] {
  if (leftFrame.maxX < rightFrame.minX) {
    // Gap between frames - meet in the middle
    const middleX = Math.floor((leftFrame.maxX + rightFrame.minX) / 2);
    return [
      { ...leftFrame, maxX: middleX },
      { ...rightFrame, minX: middleX },
    ];
  } else {
    // Overlap or touching - left's maxX becomes right's minX
    return [
      { ...leftFrame, maxX: rightFrame.minX },
      rightFrame,
    ];
  }
}

/**
 * Unions top and bottom frame lines vertically.
 * Only adjusts if they belong to the same sura.
 */
function unionLinesVerticallyPair(
  top: WordFrame[],
  bottom: WordFrame[]
): [WordFrame[], WordFrame[]] {
  // Early return if not continuous lines (different suras)
  const topLast = top[top.length - 1];
  const bottomFirst = bottom[0];

  if (
    !topLast ||
    !bottomFirst ||
    topLast.word.verse.sura.suraNumber !== bottomFirst.word.verse.sura.suraNumber
  ) {
    return [top, bottom];
  }

  const topMaxY = Math.max(...top.map((f) => f.maxY));
  const bottomMinY = Math.min(...bottom.map((f) => f.minY));
  const middleY = Math.floor((topMaxY + bottomMinY) / 2);

  return [
    top.map((frame) => ({ ...frame, maxY: middleY })),
    bottom.map((frame) => ({ ...frame, minY: middleY })),
  ];
}

/**
 * Unions the left edge of a list of frames (aligns minX).
 */
function unionLeftEdge(frames: WordFrame[]): WordFrame[] {
  if (frames.length === 0) return [];
  const minX = Math.min(...frames.map((f) => f.minX));
  return frames.map((frame) => ({ ...frame, minX }));
}

/**
 * Unions the right edge of a list of frames (aligns maxX).
 */
function unionRightEdge(frames: WordFrame[]): WordFrame[] {
  if (frames.length === 0) return [];
  const maxX = Math.max(...frames.map((f) => f.maxX));
  return frames.map((frame) => ({ ...frame, maxX }));
}

// ============================================================================
// WordFrameProcessor
// ============================================================================

/**
 * Processes word frames into an organized collection.
 */
export class WordFrameProcessor {
  /**
   * Processes raw word frames into an organized collection.
   */
  processWordFrames(frames: WordFrame[]): WordFrameCollection {
    if (frames.length === 0) {
      return createWordFrameCollection([]);
    }

    // Group by line
    const framesByLines = new Map<number, WordFrame[]>();
    for (const frame of frames) {
      const lineFrames = framesByLines.get(frame.line) || [];
      lineFrames.push(frame);
      framesByLines.set(frame.line, lineFrames);
    }

    // Sort by line number and convert to array
    let lines = Array.from(framesByLines.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, wordFrames]) => wordFrames);

    // Process the lines
    lines = this.normalize(lines);
    lines = this.alignFramesVerticallyInEachLine(lines);
    lines = this.unionLinesVertically(lines);
    lines = this.unionFramesHorizontallyInEachLine(lines);
    lines = this.alignLineEdges(lines);

    return createWordFrameCollection(
      lines.map((lineFrames) => createWordFrameLine(lineFrames))
    );
  }

  /**
   * Normalizes all frames.
   */
  private normalize(lines: WordFrame[][]): WordFrame[][] {
    return lines.map((line) => line.map(normalizeFrame));
  }

  /**
   * Aligns frames vertically within each line.
   */
  private alignFramesVerticallyInEachLine(lines: WordFrame[][]): WordFrame[][] {
    return lines.map(alignFramesVertically);
  }

  /**
   * Unions each line with its neighbors vertically.
   */
  private unionLinesVertically(lines: WordFrame[][]): WordFrame[][] {
    const result = [...lines.map((line) => [...line])];

    for (let i = 0; i < result.length - 1; i++) {
      const [newTop, newBottom] = unionLinesVerticallyPair(result[i], result[i + 1]);
      result[i] = newTop;
      result[i + 1] = newBottom;
    }

    return result;
  }

  /**
   * Unions frames horizontally within each line.
   */
  private unionFramesHorizontallyInEachLine(lines: WordFrame[][]): WordFrame[][] {
    return lines.map((line) => {
      // Sort frames by minX (decreasing order for RTL)
      const sorted = [...line].sort((a, b) => b.minX - a.minX);

      for (let i = 0; i < sorted.length - 1; i++) {
        const [newLeft, newRight] = unionFramesHorizontally(sorted[i + 1], sorted[i]);
        sorted[i + 1] = newLeft;
        sorted[i] = newRight;
      }

      return sorted;
    });
  }

  /**
   * Aligns the edges of all lines.
   */
  private alignLineEdges(lines: WordFrame[][]): WordFrame[][] {
    if (lines.length === 0) return lines;

    // Get rightmost frames (first in each line due to RTL sorting)
    let rightEdge = lines.map((line) => line[0]);
    // Get leftmost frames (last in each line)
    let leftEdge = lines.map((line) => line[line.length - 1]);

    rightEdge = unionRightEdge(rightEdge);
    leftEdge = unionLeftEdge(leftEdge);

    return lines.map((line, i) => {
      const result = [...line];
      result[0] = rightEdge[i];
      result[result.length - 1] = leftEdge[i];
      return result;
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a word frame processor.
 */
export function createWordFrameProcessor(): WordFrameProcessor {
  return new WordFrameProcessor();
}

