/**
 * Core Utilities
 *
 * Translated from quran-ios/Core/Utilities
 * This module provides common utility functions used throughout the app.
 */

// Array utilities
export {
  removingNeighboringDuplicates,
  sortedAs,
  binarySearchFirst,
} from './array';

// String utilities
export {
  // Path utilities
  lastPathComponent,
  pathExtension,
  stringByDeletingLastPathComponent,
  stringByDeletingPathExtension,
  pathComponents,
  stringByAppendingPath,
  stringByAppendingExtension,
  // Regex utilities
  ranges,
  replacingOccurrences,
  replaceMatches,
  replacingSortedRanges,
  // Byte utilities
  byteOffsetToStringIndex,
  // Types
  type StringRange,
} from './string';

// String chunking utilities
export {
  chunk,
  chunkString,
  chunkRanges,
  chunkRangesInRange,
  type ChunkRange,
} from './string-chunking';

// URL utilities
export {
  validURL,
  isReachable,
  isReachableSync,
  isParent,
  joinPath,
  filename,
  directory,
} from './url';

// Number utilities
export {
  as3DigitString,
  asNDigitString,
  fixedDigitString,
} from './number';

// Sequence utilities
export {
  flatGroup,
  flatGroupToObject,
  orderedUnique,
  asyncMap,
  asyncFilter,
  asyncMapParallel,
  asyncFilterParallel,
} from './sequence';

// Error utilities
export {
  isCancelled,
  CancellationError,
  createCancellationError,
  ignoreIfCancelled,
  ignoreCancellation,
} from './error';

// Result utilities
export {
  type Result,
  success,
  failure,
  isSuccess,
  isFailure,
  resultFromAsync,
  resultFromSync,
  mapResult,
  mapError,
  flatMapResult,
  getOrThrow,
  getOrDefault,
  getOrElse,
} from './result';

// File manager utilities
export {
  Directories,
  removeDirectoryContents,
  exists,
  getInfo,
  createDirectory,
  deleteItem,
  copyItem,
  moveItem,
  listDirectory,
  readFile,
  writeFile,
  getFileSize,
  getDirectorySize,
} from './file-manager';

// Task utilities
export {
  CancellableTask,
  CancellableTaskSet,
  TaskCancelledError,
  collect,
  runWithTask,
  delay,
  createCleanupBag,
} from './task';

// Attempt/retry utilities
export {
  attempt,
  attemptAsync,
  attemptWithOptions,
  type RetryOptions,
} from './attempt';

// Pair utilities
export {
  type Pair,
  type ReadonlyPair,
  createPair,
  createReadonlyPair,
  pairsEqual,
  pairsEqualWith,
  mapPair,
  swapPair,
  pairToTuple,
  tupleTopair,
} from './pair';

// Relative file path utilities
export {
  RelativeFilePath,
  RelativePaths,
} from './relative-file-path';

// Locking utilities
export {
  ManagedCriticalState,
  Protected,
  AsyncMutex,
  AsyncReadWriteLock,
  AsyncSemaphore,
} from './locking';

// Address/debug utilities
export {
  addressOf,
  nameAndAddress,
  getTypeName,
  debugDescription,
  isSameInstance,
  uniqueId,
} from './address';

// Async initialization utilities
export {
  AsyncInitializer,
  AsyncValueInitializer,
  lazyAsync,
  lazy,
} from './async-initializer';

// Async publisher utilities
export {
  AsyncPublisher,
  type BufferingPolicy,
  fromEventCallback,
  interval,
  after,
  fromArray,
  fromPromise,
  merge,
  createAsyncPublisher,
} from './async-publisher';

// Async throwing publisher utilities
export {
  AsyncThrowingPublisher,
  fromThrowingEventCallback,
  fromThrowingPromise,
  fromSingleThrowingPromise,
  mapThrowing,
  filterThrowing,
} from './async-throwing-publisher';

// Multicast continuation utilities
export {
  MulticastContinuation,
  SimpleMulticastContinuation,
  createDeferred,
  createOneShotEvent,
  type Deferred,
  type OneShotEvent,
} from './multicast-continuation';

// Multi-predicate comparer utilities
export {
  MultiPredicateComparer,
  type ComparePredicate,
  ascending,
  descending,
  comparerFromKeys,
  sortByPredicates,
  sortByKeys,
  predicateToComparator,
} from './multi-predicate-comparer';
