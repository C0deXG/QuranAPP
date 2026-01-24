/**
 * OAuthService.swift → oauth-service.ts
 *
 * OAuth service interface translated from quran-ios Core/OAuthService
 * Created by Mohannad Hassan on 08/01/2025.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

/**
 * OAuth service error types.
 * Equivalent to Swift's OAuthServiceError enum.
 */
export enum OAuthServiceErrorType {
  FailedToRefreshTokens = 'failedToRefreshTokens',
  StateDataDecodingError = 'stateDataDecodingError',
  FailedToDiscoverService = 'failedToDiscoverService',
  FailedToAuthenticate = 'failedToAuthenticate',
}

/**
 * OAuth service error.
 */
export class OAuthServiceError extends Error {
  readonly type: OAuthServiceErrorType;
  readonly underlyingError?: Error;

  constructor(type: OAuthServiceErrorType, underlyingError?: Error) {
    super(underlyingError?.message ?? type);
    this.name = 'OAuthServiceError';
    this.type = type;
    this.underlyingError = underlyingError;
  }

  static failedToRefreshTokens(error?: Error): OAuthServiceError {
    return new OAuthServiceError(OAuthServiceErrorType.FailedToRefreshTokens, error);
  }

  static stateDataDecodingError(error?: Error): OAuthServiceError {
    return new OAuthServiceError(OAuthServiceErrorType.StateDataDecodingError, error);
  }

  static failedToDiscoverService(error?: Error): OAuthServiceError {
    return new OAuthServiceError(OAuthServiceErrorType.FailedToDiscoverService, error);
  }

  static failedToAuthenticate(error?: Error): OAuthServiceError {
    return new OAuthServiceError(OAuthServiceErrorType.FailedToAuthenticate, error);
  }
}

/**
 * Encapsulates the OAuth state data.
 * Equivalent to Swift's OAuthStateData protocol.
 */
export interface OAuthStateData {
  /**
   * Whether the user is currently authorized.
   */
  readonly isAuthorized: boolean;
}

/**
 * OAuth service interface.
 * Equivalent to Swift's OAuthService protocol.
 *
 * The service is stateless - clients are responsible for holding and persisting state data.
 */
export interface OAuthService {
  /**
   * Initiates the login flow.
   * In React Native, this opens the browser for authentication.
   *
   * @returns The OAuth state data after successful login
   * @throws OAuthServiceError if authentication fails
   */
  login(): Promise<OAuthStateData>;

  /**
   * Gets the current access token, refreshing if needed.
   *
   * @param data - Current OAuth state data
   * @returns Tuple of [accessToken, updatedStateData]
   * @throws OAuthServiceError if token retrieval fails
   */
  getAccessToken(data: OAuthStateData): Promise<[string, OAuthStateData]>;

  /**
   * Refreshes the access token if needed.
   *
   * @param data - Current OAuth state data
   * @returns Updated OAuth state data
   * @throws OAuthServiceError if refresh fails
   */
  refreshAccessTokenIfNeeded(data: OAuthStateData): Promise<OAuthStateData>;

  /**
   * Logs out the user and clears tokens.
   *
   * @param data - Current OAuth state data
   */
  logout(data: OAuthStateData): Promise<void>;
}

/**
 * Encodes and decodes OAuth state data for persistence.
 * Equivalent to Swift's OAuthStateDataEncoder protocol.
 */
export interface OAuthStateDataEncoder {
  /**
   * Encodes state data to a string.
   */
  encode(data: OAuthStateData): string;

  /**
   * Decodes state data from a string.
   */
  decode(data: string): OAuthStateData;
}

