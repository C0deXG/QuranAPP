/**
 * NetworkSupport - Network utilities and error handling
 *
 * Translated from quran-ios/Data/NetworkSupport
 *
 * This module provides:
 * - Network error types and classification
 * - Network session abstraction
 * - High-level network manager for API requests
 */

// Network errors
export {
  NetworkError,
  NetworkErrorType,
  isNetworkError,
  isOfflineError,
} from './network-error';

// Network session
export {
  DefaultNetworkSession,
  getSharedNetworkSession,
  setSharedNetworkSession,
  buildUrl,
  createTimeoutController,
} from './network-session';
export type {
  NetworkSession,
  RequestOptions,
  NetworkResponse,
  DownloadProgressCallback,
  DownloadTask,
} from './network-session';

// Network manager
export {
  NetworkManager,
  createQuranApiManager,
  createQuranAudioManager,
  createNetworkManager,
} from './network-manager';
export type { NetworkManagerConfig } from './network-manager';

