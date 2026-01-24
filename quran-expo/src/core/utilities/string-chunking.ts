/**
 * String+Chunking.swift → string-chunking.ts
 *
 * String chunking utilities translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-12-31.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * Represents a range in a string (start and end indices)
 */
export interface ChunkRange {
  start: number;
  end: number;
}

/**
 * Chunking strategy determines how text is split
 */
type ChunkingStrategy = 'paragraph' | 'sentence' | 'word';

/**
 * Gets the next finer chunking strategy
 */
function nextStrategy(strategy: ChunkingStrategy): ChunkingStrategy | null {
  switch (strategy) {
    case 'paragraph':
      return 'sentence';
    case 'sentence':
      return 'word';
    case 'word':
      return null;
  }
}

/**
 * Gets the regex pattern for splitting text by strategy
 */
function getSplitPattern(strategy: ChunkingStrategy): RegExp {
  switch (strategy) {
    case 'paragraph':
      // Split by paragraph breaks (one or more newlines)
      return /\n\n+/;
    case 'sentence':
      // Split by sentence endings (. ! ?)
      return /[.!?]+\s*/;
    case 'word':
      // Split by whitespace
      return /\s+/;
  }
}

/**
 * Splits text in a range based on the strategy
 */
function splitText(
  text: string,
  range: ChunkRange,
  strategy: ChunkingStrategy
): ChunkRange[] {
  const substring = text.slice(range.start, range.end);
  const pattern = getSplitPattern(strategy);
  const subranges: ChunkRange[] = [];

  // Split the string and track positions
  let currentPos = range.start;
  const parts = substring.split(pattern);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.length === 0) continue;

    // Find where this part actually starts in the original string
    const partStart = text.indexOf(part, currentPos);
    if (partStart === -1) continue;

    // For all but the last part, extend to the next part's start
    let partEnd: number;
    if (i < parts.length - 1) {
      const nextPart = parts.slice(i + 1).find((p) => p.length > 0);
      if (nextPart) {
        const nextStart = text.indexOf(nextPart, partStart + part.length);
        partEnd = nextStart !== -1 ? nextStart : partStart + part.length;
      } else {
        partEnd = range.end;
      }
    } else {
      partEnd = range.end;
    }

    subranges.push({ start: partStart, end: partEnd });
    currentPos = partEnd;
  }

  // If no subranges were created, return the original range
  if (subranges.length === 0) {
    return [range];
  }

  // Ensure the first range starts at the original start
  if (subranges.length > 0 && subranges[0].start > range.start) {
    subranges[0] = { start: range.start, end: subranges[0].end };
  }

  // Ensure the last range ends at the original end
  if (subranges.length > 0) {
    const lastIdx = subranges.length - 1;
    subranges[lastIdx] = { start: subranges[lastIdx].start, end: range.end };
  }

  return subranges;
}

/**
 * Internal function to chunk text recursively
 */
function chunkTextInternal(
  text: string,
  range: ChunkRange,
  maxChunkSize: number,
  strategy: ChunkingStrategy,
  chunks: ChunkRange[]
): void {
  const blocks = splitText(text, range, strategy);

  let accumulatedChunkStart = range.start;
  let accumulatedBlocks = 0;

  function addAccumulatedChunk(upperBound: number, next: number): void {
    if (accumulatedBlocks > 0 && accumulatedChunkStart < range.end) {
      chunks.push({ start: accumulatedChunkStart, end: upperBound });
      accumulatedBlocks = 0;
    }
    accumulatedChunkStart = next;
  }

  for (const block of blocks) {
    const blockLength = block.end - block.start;

    if (blockLength > maxChunkSize) {
      // Add accumulated chunks
      addAccumulatedChunk(block.start, block.end);

      const next = nextStrategy(strategy);
      if (next) {
        // Try a finer strategy
        chunkTextInternal(text, block, maxChunkSize, next, chunks);
      } else {
        // No finer strategy, add the long block as a separate chunk
        chunks.push(block);
      }
    } else {
      // Try to extend current chunk
      const extendedLength = block.end - accumulatedChunkStart;

      if (extendedLength > maxChunkSize) {
        // Add the current chunk and start a new one
        addAccumulatedChunk(block.start, block.start);
        accumulatedBlocks = 1;
      } else {
        // Continue accumulating blocks
        accumulatedBlocks += 1;
      }
    }
  }

  if (accumulatedChunkStart < range.end) {
    addAccumulatedChunk(range.end, range.end);
  }
}

/**
 * Chunks a string into pieces of at most maxChunkSize characters.
 * Tries to break at natural boundaries (paragraphs, sentences, words).
 *
 * @param text - The text to chunk
 * @param maxChunkSize - Maximum size of each chunk
 * @returns Array of substring chunks
 *
 * @example
 * chunk("Hello world. This is a test.", 15)
 * // ["Hello world. ", "This is a test."]
 */
export function chunk(text: string, maxChunkSize: number): string[] {
  const ranges = chunkRanges(text, maxChunkSize);
  return ranges.map((range) => text.slice(range.start, range.end));
}

/**
 * Gets the ranges for chunking a string.
 *
 * @param text - The text to chunk
 * @param maxChunkSize - Maximum size of each chunk
 * @returns Array of ranges representing chunk boundaries
 */
export function chunkRanges(text: string, maxChunkSize: number): ChunkRange[] {
  return chunkRangesInRange(text, { start: 0, end: text.length }, maxChunkSize);
}

/**
 * Gets the ranges for chunking a substring of a string.
 *
 * @param text - The full text
 * @param range - The range within the text to chunk
 * @param maxChunkSize - Maximum size of each chunk
 * @returns Array of ranges representing chunk boundaries
 */
export function chunkRangesInRange(
  text: string,
  range: ChunkRange,
  maxChunkSize: number
): ChunkRange[] {
  const chunks: ChunkRange[] = [];
  chunkTextInternal(text, range, maxChunkSize, 'paragraph', chunks);
  return chunks;
}

/**
 * Alias for chunk function for backward compatibility.
 */
export const chunkString = chunk;

