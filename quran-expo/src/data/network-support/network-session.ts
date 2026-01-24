/**
 * NetworkSession.swift → network-session.ts
 *
 * Network session abstraction for HTTP requests.
 * Uses the native fetch API in React Native.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { NetworkError } from './network-error';

// ============================================================================
// Types
// ============================================================================

/**
 * Request configuration options.
 */
export interface RequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: string | FormData | ArrayBuffer;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Response from a network request.
 */
export interface NetworkResponse {
  /** Response data */
  data: ArrayBuffer;
  /** HTTP status code */
  status: number;
  /** Status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Final URL after redirects */
  url: string;
}

/**
 * Download progress callback.
 */
export type DownloadProgressCallback = (
  bytesWritten: number,
  totalBytesWritten: number,
  totalBytesExpectedToWrite: number
) => void;

/**
 * Download task handle.
 */
export interface DownloadTask {
  /** Unique task identifier */
  readonly taskId: string;
  /** The URL being downloaded */
  readonly url: string;
  /** Promise that resolves when download completes */
  readonly promise: Promise<string>;
  /** Cancel the download */
  cancel(): void;
  /** Resume a paused download (if supported) */
  resume(): void;
}

// ============================================================================
// Network Session Interface
// ============================================================================

/**
 * Network session interface for making HTTP requests.
 */
export interface NetworkSession {
  /**
   * Performs a data request.
   */
  data(url: string, options?: RequestOptions): Promise<NetworkResponse>;

  /**
   * Performs a JSON request and parses the response.
   */
  json<T>(url: string, options?: RequestOptions): Promise<T>;

  /**
   * Performs a text request.
   */
  text(url: string, options?: RequestOptions): Promise<string>;
}

// ============================================================================
// Default Network Session Implementation
// ============================================================================

/**
 * Default network session using fetch API.
 */
export class DefaultNetworkSession implements NetworkSession {
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(options?: {
    defaultHeaders?: Record<string, string>;
    defaultTimeout?: number;
  }) {
    this.defaultHeaders = options?.defaultHeaders ?? {};
    this.defaultTimeout = options?.defaultTimeout ?? 30000; // 30 seconds
  }

  /**
   * Performs a data request.
   */
  async data(url: string, options?: RequestOptions): Promise<NetworkResponse> {
    const controller = new AbortController();
    const signal = options?.signal ?? controller.signal;

    // Set up timeout
    const timeout = options?.timeout ?? this.defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options?.method ?? 'GET',
        headers: {
          ...this.defaultHeaders,
          ...options?.headers,
        },
        body: options?.body,
        signal,
      });

      clearTimeout(timeoutId);

      // Check for error status
      if (!response.ok) {
        const body = await response.text().catch(() => undefined);
        throw NetworkError.fromResponse(response, body);
      }

      // Parse headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Get response data
      const data = await response.arrayBuffer();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
        url: response.url,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NetworkError) {
        throw error;
      }

      throw NetworkError.fromError(error);
    }
  }

  /**
   * Performs a JSON request and parses the response.
   */
  async json<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.data(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    const text = new TextDecoder().decode(response.data);

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw NetworkError.serverError('Invalid JSON response');
    }
  }

  /**
   * Performs a text request.
   */
  async text(url: string, options?: RequestOptions): Promise<string> {
    const response = await this.data(url, options);
    return new TextDecoder().decode(response.data);
  }
}

// ============================================================================
// Shared Instance
// ============================================================================

/** Shared default network session instance */
let sharedSession: NetworkSession | null = null;

/**
 * Gets the shared network session instance.
 */
export function getSharedNetworkSession(): NetworkSession {
  if (!sharedSession) {
    sharedSession = new DefaultNetworkSession();
  }
  return sharedSession;
}

/**
 * Sets the shared network session instance.
 * Useful for testing or custom configurations.
 */
export function setSharedNetworkSession(session: NetworkSession): void {
  sharedSession = session;
}

// ============================================================================
// Request Builder
// ============================================================================

/**
 * Builds a URL with query parameters.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  parameters?: Array<[string, string]>
): string {
  // Combine base URL and path
  let url = baseUrl;
  if (!url.endsWith('/') && !path.startsWith('/')) {
    url += '/';
  } else if (url.endsWith('/') && path.startsWith('/')) {
    path = path.substring(1);
  }
  url += path;

  // Add query parameters
  if (parameters && parameters.length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of parameters) {
      searchParams.append(key, value);
    }
    url += '?' + searchParams.toString();
  }

  return url;
}

/**
 * Creates an AbortController with automatic timeout.
 */
export function createTimeoutController(
  timeoutMs: number
): {
  controller: AbortController;
  clear: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    clear: () => clearTimeout(timeoutId),
  };
}

