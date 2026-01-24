/**
 * NetworkManager.swift → network-manager.ts
 *
 * High-level network manager for API requests.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import {
  NetworkSession,
  DefaultNetworkSession,
  RequestOptions,
  buildUrl,
} from './network-session';
import { NetworkError } from './network-error';

/**
 * Configuration for NetworkManager.
 */
export interface NetworkManagerConfig {
  /** Base URL for all requests */
  baseURL: string;
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Custom network session (for testing) */
  session?: NetworkSession;
}

/**
 * High-level network manager for making API requests.
 */
export class NetworkManager {
  private readonly session: NetworkSession;
  private readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;

  /**
   * Creates a new NetworkManager.
   */
  constructor(config: NetworkManagerConfig) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.timeout = config.timeout ?? 30000;
    this.session = config.session ?? new DefaultNetworkSession({
      defaultHeaders: this.defaultHeaders,
      defaultTimeout: this.timeout,
    });
  }

  /**
   * Makes a GET request and returns raw data.
   */
  async request(
    path: string,
    parameters?: Array<[string, string]>
  ): Promise<ArrayBuffer> {
    try {
      const url = buildUrl(this.baseURL, path, parameters);
      const response = await this.session.data(url, {
        method: 'GET',
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw NetworkError.fromError(error);
    }
  }

  /**
   * Makes a GET request and returns text.
   */
  async requestText(
    path: string,
    parameters?: Array<[string, string]>
  ): Promise<string> {
    const data = await this.request(path, parameters);
    return new TextDecoder().decode(data);
  }

  /**
   * Makes a GET request and returns parsed JSON.
   */
  async requestJSON<T>(
    path: string,
    parameters?: Array<[string, string]>
  ): Promise<T> {
    const text = await this.requestText(path, parameters);
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw NetworkError.serverError('Invalid JSON response');
    }
  }

  /**
   * Makes a POST request with JSON body.
   */
  async post<T>(
    path: string,
    body: unknown,
    options?: {
      parameters?: Array<[string, string]>;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      const url = buildUrl(this.baseURL, path, options?.parameters);
      const response = await this.session.data(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(body),
        timeout: this.timeout,
      });

      const text = new TextDecoder().decode(response.data);
      if (!text) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as T;
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw NetworkError.fromError(error);
    }
  }

  /**
   * Makes a PUT request with JSON body.
   */
  async put<T>(
    path: string,
    body: unknown,
    options?: {
      parameters?: Array<[string, string]>;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      const url = buildUrl(this.baseURL, path, options?.parameters);
      const response = await this.session.data(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(body),
        timeout: this.timeout,
      });

      const text = new TextDecoder().decode(response.data);
      if (!text) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as T;
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw NetworkError.fromError(error);
    }
  }

  /**
   * Makes a DELETE request.
   */
  async delete<T>(
    path: string,
    options?: {
      parameters?: Array<[string, string]>;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      const url = buildUrl(this.baseURL, path, options?.parameters);
      const response = await this.session.data(url, {
        method: 'DELETE',
        headers: options?.headers,
        timeout: this.timeout,
      });

      const text = new TextDecoder().decode(response.data);
      if (!text) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as T;
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw NetworkError.fromError(error);
    }
  }

  /**
   * Makes a request with full options control.
   */
  async customRequest<T>(
    path: string,
    options: RequestOptions & {
      parameters?: Array<[string, string]>;
    }
  ): Promise<T> {
    try {
      const url = buildUrl(this.baseURL, path, options.parameters);
      const response = await this.session.data(url, {
        ...options,
        timeout: options.timeout ?? this.timeout,
      });

      const text = new TextDecoder().decode(response.data);
      if (!text) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as T;
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw NetworkError.fromError(error);
    }
  }

  /**
   * Builds a full URL for the given path and parameters.
   * Useful for generating URLs for downloads.
   */
  buildFullUrl(
    path: string,
    parameters?: Array<[string, string]>
  ): string {
    return buildUrl(this.baseURL, path, parameters);
  }

  /**
   * Gets the base URL.
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a NetworkManager for the Quran.com API.
 */
export function createQuranApiManager(): NetworkManager {
  return new NetworkManager({
    baseURL: 'https://api.quran.com/api/v4',
    defaultHeaders: {
      Accept: 'application/json',
    },
  });
}

/**
 * Creates a NetworkManager for the Quran.com audio CDN.
 */
export function createQuranAudioManager(): NetworkManager {
  return new NetworkManager({
    baseURL: 'https://audio.qurancdn.com',
  });
}

/**
 * Creates a NetworkManager for a custom base URL.
 */
export function createNetworkManager(
  baseURL: string,
  options?: {
    defaultHeaders?: Record<string, string>;
    timeout?: number;
  }
): NetworkManager {
  return new NetworkManager({
    baseURL,
    ...options,
  });
}

