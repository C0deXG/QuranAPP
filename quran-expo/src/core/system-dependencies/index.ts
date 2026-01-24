/**
 * Core SystemDependencies
 *
 * Translated from quran-ios/Core/SystemDependencies
 * Provides abstractions for system-level dependencies.
 */

// Event observer
export {
  type EventObserver,
  SimpleEventObserver,
  ChannelEventObserver,
  createCallableObserver,
} from './event-observer';

// System time
export {
  type SystemTime,
  DefaultSystemTime,
  MockSystemTime,
  systemTime,
} from './system-time';

// System bundle
export {
  type SystemBundle,
  DefaultSystemBundle,
  MockSystemBundle,
  systemBundle,
  registerResource,
} from './system-bundle';

// File system
export {
  type ResourceValues,
  type FileSystem,
  DefaultFileSystem,
  MockFileSystem,
} from './file-system';

// Keychain access
export {
  KeychainStatus,
  type KeychainAccess,
  DefaultKeychainAccess,
  MockKeychainAccess,
  keychainAccess,
} from './keychain-access';

// Persistent history
export {
  PersistentHistoryChangeType,
  type PersistentHistoryChange,
  type PersistentHistoryTransaction,
  type PersistentHistoryTracker,
  createChange,
  createTransaction,
  InMemoryPersistentHistoryTracker,
} from './persistent-history';

// Zipper
export {
  type Zipper,
  DefaultZipper,
  MockZipper,
  zipper,
} from './zipper';

// Convenience: Create a shared file system instance
export const fileSystem: FileSystem = new DefaultFileSystem();

// Convenience functions
export async function fileExistsAtPath(path: string): Promise<boolean> {
  return fileSystem.fileExists(path);
}

export async function removeItemAtPath(path: string): Promise<void> {
  return fileSystem.removeItem(path);
}

export async function createDirectoryAtPath(path: string, withIntermediates = true): Promise<void> {
  return fileSystem.createDirectory(path, withIntermediates);
}

export async function contentsOfDirectoryAtPath(path: string): Promise<string[]> {
  return fileSystem.contentsOfDirectory(path);
}

export async function moveItemToPath(from: string, to: string): Promise<void> {
  return fileSystem.moveItem(from, to);
}

// Import FileSystem type for the convenience export
import { type FileSystem, DefaultFileSystem } from './file-system';
