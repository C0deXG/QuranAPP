/**
 * NetworkError.swift → network-error.ts
 *
 * Error types for network operations.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { l } from '../../core/localization';

/**
 * Types of network errors.
 */
export enum NetworkErrorType {
  /** Unknown or not supported error */
  Unknown = 'unknown',
  /** Not connected to the internet */
  NotConnectedToInternet = 'notConnectedToInternet',
  /** International data roaming turned off */
  InternationalRoamingOff = 'internationalRoamingOff',
  /** Connection is lost */
  ConnectionLost = 'connectionLost',
  /** Cannot reach the server */
  ServerNotReachable = 'serverNotReachable',
  /** Server returned an error */
  ServerError = 'serverError',
  /** Request was aborted */
  Aborted = 'aborted',
  /** Request timed out */
  Timeout = 'timeout',
}

/**
 * Error class for network operations.
 */
export class NetworkError extends Error {
  readonly type: NetworkErrorType;
  readonly underlyingError?: Error;
  readonly serverMessage?: string;
  readonly statusCode?: number;

  private constructor(
    type: NetworkErrorType,
    message: string,
    underlyingError?: Error,
    serverMessage?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
    this.type = type;
    this.underlyingError = underlyingError;
    this.serverMessage = serverMessage;
    this.statusCode = statusCode;
  }

  /**
   * Creates an unknown error.
   */
  static unknown(error?: Error): NetworkError {
    return new NetworkError(
      NetworkErrorType.Unknown,
      error?.message ?? 'Unknown network error',
      error
    );
  }

  /**
   * Creates a not connected to internet error.
   */
  static notConnectedToInternet(error?: Error): NetworkError {
    return new NetworkError(
      NetworkErrorType.NotConnectedToInternet,
      'Not connected to the internet',
      error
    );
  }

  /**
   * Creates an international roaming off error.
   */
  static internationalRoamingOff(error?: Error): NetworkError {
    return new NetworkError(
      NetworkErrorType.InternationalRoamingOff,
      'International roaming is turned off',
      error
    );
  }

  /**
   * Creates a connection lost error.
   */
  static connectionLost(error?: Error): NetworkError {
    return new NetworkError(
      NetworkErrorType.ConnectionLost,
      'Connection was lost',
      error
    );
  }

  /**
   * Creates a server not reachable error.
   */
  static serverNotReachable(error?: Error): NetworkError {
    return new NetworkError(
      NetworkErrorType.ServerNotReachable,
      'Server is not reachable',
      error
    );
  }

  /**
   * Creates a server error.
   */
  static serverError(message: string, statusCode?: number): NetworkError {
    return new NetworkError(
      NetworkErrorType.ServerError,
      `Server error: ${message}`,
      undefined,
      message,
      statusCode
    );
  }

  /**
   * Creates an aborted error.
   */
  static aborted(error?: Error): NetworkError {
    return new NetworkError(
      NetworkErrorType.Aborted,
      'Request was aborted',
      error
    );
  }

  /**
   * Creates a timeout error.
   */
  static timeout(error?: Error): NetworkError {
    return new NetworkError(
      NetworkErrorType.Timeout,
      'Request timed out',
      error
    );
  }

  /**
   * Creates a NetworkError from an unknown error.
   * Attempts to classify the error based on its properties.
   */
  static fromError(error: unknown): NetworkError {
    // Already a NetworkError
    if (error instanceof NetworkError) {
      return error;
    }

    // TypeError - usually network failures in fetch
    if (error instanceof TypeError) {
      // Common fetch error messages
      const message = error.message.toLowerCase();
      if (
        message.includes('network request failed') ||
        message.includes('failed to fetch') ||
        message.includes('network error')
      ) {
        return NetworkError.notConnectedToInternet(error);
      }
      return NetworkError.unknown(error);
    }

    // DOMException for aborted requests
    if (error instanceof DOMException) {
      if (error.name === 'AbortError') {
        return NetworkError.aborted(error);
      }
      if (error.name === 'TimeoutError') {
        return NetworkError.timeout(error);
      }
    }

    // Standard Error
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Check for timeout
      if (message.includes('timeout') || message.includes('timed out')) {
        return NetworkError.timeout(error);
      }

      // Check for connection issues
      if (
        message.includes('network') ||
        message.includes('internet') ||
        message.includes('offline')
      ) {
        return NetworkError.notConnectedToInternet(error);
      }

      // Check for host/server issues
      if (
        message.includes('host') ||
        message.includes('server') ||
        message.includes('dns')
      ) {
        return NetworkError.serverNotReachable(error);
      }

      // Check for connection lost
      if (message.includes('connection') && message.includes('lost')) {
        return NetworkError.connectionLost(error);
      }

      return NetworkError.unknown(error);
    }

    // Unknown error type
    return NetworkError.unknown(new Error(String(error)));
  }

  /**
   * Creates a NetworkError from a fetch Response with error status.
   */
  static fromResponse(response: Response, body?: string): NetworkError {
    const statusCode = response.status;

    // Server errors (5xx)
    if (statusCode >= 500) {
      return NetworkError.serverError(
        body ?? response.statusText ?? 'Internal server error',
        statusCode
      );
    }

    // Client errors (4xx)
    if (statusCode >= 400) {
      return NetworkError.serverError(
        body ?? response.statusText ?? 'Request failed',
        statusCode
      );
    }

    return NetworkError.unknown();
  }

  /**
   * Gets a localized error description.
   */
  get localizedDescription(): string {
    switch (this.type) {
      case NetworkErrorType.NotConnectedToInternet:
        return l('error.message.not_connected_to_internet');
      case NetworkErrorType.InternationalRoamingOff:
        return l('error.message.international_roaming_off');
      case NetworkErrorType.ConnectionLost:
        return l('error.message.connection_lost');
      case NetworkErrorType.Unknown:
      case NetworkErrorType.ServerError:
      case NetworkErrorType.ServerNotReachable:
      case NetworkErrorType.Aborted:
      case NetworkErrorType.Timeout:
      default:
        return l('error.message.general');
    }
  }

  /**
   * Checks if this is a connectivity error.
   */
  get isConnectivityError(): boolean {
    return (
      this.type === NetworkErrorType.NotConnectedToInternet ||
      this.type === NetworkErrorType.ConnectionLost ||
      this.type === NetworkErrorType.ServerNotReachable
    );
  }

  /**
   * Checks if this error is retryable.
   */
  get isRetryable(): boolean {
    return (
      this.type === NetworkErrorType.ConnectionLost ||
      this.type === NetworkErrorType.Timeout ||
      this.type === NetworkErrorType.ServerNotReachable ||
      (this.type === NetworkErrorType.ServerError &&
        this.statusCode !== undefined &&
        this.statusCode >= 500)
    );
  }
}

/**
 * Type guard to check if an error is a NetworkError.
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Checks if an error indicates no internet connection.
 */
export function isOfflineError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return error.type === NetworkErrorType.NotConnectedToInternet;
  }
  return false;
}

