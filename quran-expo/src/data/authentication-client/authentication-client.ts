/**
 * AuthenticationClient.swift → authentication-client.ts
 *
 * Handles OAuth authentication flow with Quran.com
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import { createLogger } from '../../core/logging';
import type {
  OAuthService,
  OAuthStateData,
  OAuthConfiguration,
} from '../../core/oauth-service';
import { ExpoAuthService, createOAuthService } from '../../core/oauth-service';
import type { SecurePersistence } from '../../core/secure-persistence';
import { KeychainPersistence } from '../../core/secure-persistence';

const logger = createLogger('AuthenticationClient');

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error types for authentication client.
 */
export class AuthenticationClientError extends Error {
  constructor(
    public readonly type: 'errorAuthenticating' | 'clientIsNotAuthenticated',
    public readonly cause?: Error
  ) {
    super(
      type === 'errorAuthenticating'
        ? 'Error during authentication'
        : 'Client is not authenticated'
    );
    this.name = 'AuthenticationClientError';
  }

  static errorAuthenticating(cause?: Error): AuthenticationClientError {
    return new AuthenticationClientError('errorAuthenticating', cause);
  }

  static clientIsNotAuthenticated(cause?: Error): AuthenticationClientError {
    return new AuthenticationClientError('clientIsNotAuthenticated', cause);
  }
}

// ============================================================================
// Types
// ============================================================================

/**
 * Authentication state.
 */
export enum AuthenticationState {
  /** No user is currently authenticated, or access has been revoked/expired. */
  notAuthenticated = 'notAuthenticated',
  /** User is authenticated. */
  authenticated = 'authenticated',
}

/**
 * Configuration for the authentication client.
 */
export interface AuthenticationClientConfiguration {
  /** OAuth client ID */
  readonly clientID: string;
  /** OAuth client secret */
  readonly clientSecret: string;
  /** Redirect URL for OAuth callback */
  readonly redirectURL: string;
  /** Quran.com specific scopes. Client requests offline and openid by default. */
  readonly scopes: string[];
  /** Quran.com authorization issuer URL for service discovery. */
  readonly authorizationIssuerURL: string;
}

/**
 * Creates an authentication client configuration.
 */
export function createAuthenticationClientConfiguration(params: {
  clientID: string;
  clientSecret: string;
  redirectURL: string;
  scopes: string[];
  authorizationIssuerURL: string;
}): AuthenticationClientConfiguration {
  return {
    clientID: params.clientID,
    clientSecret: params.clientSecret,
    redirectURL: params.redirectURL,
    scopes: params.scopes,
    authorizationIssuerURL: params.authorizationIssuerURL,
  };
}

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for authentication client.
 * Handles the OAuth flow to Quran.com.
 */
export interface AuthenticationClient {
  /**
   * Gets the current authentication state.
   */
  getAuthenticationState(): Promise<AuthenticationState>;

  /**
   * Gets the current state synchronously.
   */
  getState(): AuthenticationState;

  /**
   * Gets the current access token.
   */
  getAccessToken(): Promise<string | null>;

  /**
   * Performs the login flow to Quran.com.
   */
  login(): Promise<void>;

  /**
   * Restores authentication state from persisted data.
   */
  restoreState(): Promise<AuthenticationState>;

  /**
   * Authenticates a request by adding auth headers.
   */
  authenticate(request: RequestInit): Promise<RequestInit>;

  /**
   * Gets authentication headers for API calls.
   */
  getAuthenticationHeaders(): Promise<Record<string, string>>;

  /**
   * Logs out and clears persisted state.
   */
  logout(): Promise<void>;
}

// ============================================================================
// OAuth State Encoder
// ============================================================================

/**
 * Interface for encoding/decoding OAuth state data.
 */
export interface OAuthStateDataEncoder {
  encode(data: OAuthStateData): string;
  decode(encoded: string): OAuthStateData;
}

/**
 * Simple JSON encoder for OAuth state.
 */
export class JsonOAuthStateEncoder implements OAuthStateDataEncoder {
  encode(data: OAuthStateData): string {
    return JSON.stringify(data);
  }

  decode(encoded: string): OAuthStateData {
    return JSON.parse(encoded) as OAuthStateData;
  }
}

// ============================================================================
// Implementation
// ============================================================================

const PERSISTENCE_KEY = 'com.quran.oauth.state';

/**
 * Implementation of AuthenticationClient.
 */
export class AuthenticationClientImpl implements AuthenticationClient {
  private readonly oauthService: OAuthService;
  private readonly encoder: OAuthStateDataEncoder;
  private readonly persistence: SecurePersistence;
  private readonly appConfiguration: AuthenticationClientConfiguration;
  private stateData: OAuthStateData | null = null;

  constructor(params: {
    configuration: AuthenticationClientConfiguration;
    oauthService: OAuthService;
    encoder: OAuthStateDataEncoder;
    persistence: SecurePersistence;
  }) {
    this.appConfiguration = params.configuration;
    this.oauthService = params.oauthService;
    this.encoder = params.encoder;
    this.persistence = params.persistence;
  }

  /**
   * Creates an AuthenticationClientImpl with default dependencies.
   */
  static create(
    configuration: AuthenticationClientConfiguration
  ): AuthenticationClientImpl {
    const oauthConfig: OAuthConfiguration = {
      clientID: configuration.clientID,
      clientSecret: configuration.clientSecret,
      redirectURL: configuration.redirectURL,
      scopes: configuration.scopes,
      authorizationIssuerURL: configuration.authorizationIssuerURL,
    };

    return new AuthenticationClientImpl({
      configuration,
      oauthService: createOAuthService(oauthConfig),
      encoder: new JsonOAuthStateEncoder(),
      persistence: new KeychainPersistence(),
    });
  }

  async getAuthenticationState(): Promise<AuthenticationState> {
    return this.stateData?.isAuthorized
      ? AuthenticationState.authenticated
      : AuthenticationState.notAuthenticated;
  }

  getState(): AuthenticationState {
    return this.stateData?.isAuthorized
      ? AuthenticationState.authenticated
      : AuthenticationState.notAuthenticated;
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.stateData?.isAuthorized) {
      return null;
    }
    try {
      const [token] = await this.oauthService.getAccessToken(this.stateData);
      return token;
    } catch (error) {
      return null;
    }
  }

  async login(): Promise<void> {
    // Clear previous state
    try {
      await this.persistence.removeData(PERSISTENCE_KEY);
      logger.info('Cleared previous authentication state before login');
    } catch (error) {
      logger.warning('Failed to clear previous authentication state before login', { error });
    }

    try {
      const data = await this.oauthService.login();
      this.stateData = data;
      logger.info('Login succeeded', { isAuthorized: data.isAuthorized });
      await this.persist(data);
    } catch (error) {
      logger.error('Failed to login', { error });
      throw AuthenticationClientError.errorAuthenticating(
        error instanceof Error ? error : undefined
      );
    }
  }

  async restoreState(): Promise<AuthenticationState> {
    let persistedData: OAuthStateData;

    try {
      const storedData = await this.persistence.getData(PERSISTENCE_KEY);
      if (!storedData) {
        logger.info('No previous authentication state found');
        return this.getAuthenticationState();
      }
      persistedData = this.encoder.decode(storedData);
    } catch (error) {
      logger.error('Failed to read persisted authentication state', { error });
      return this.getAuthenticationState();
    }

    try {
      const newData = await this.oauthService.refreshAccessTokenIfNeeded(persistedData);
      this.stateData = newData;
      await this.persist(newData);
      return this.getAuthenticationState();
    } catch (error) {
      logger.error('Failed to refresh authentication state', { error });
      throw AuthenticationClientError.clientIsNotAuthenticated(
        error instanceof Error ? error : undefined
      );
    }
  }

  async authenticate(request: RequestInit): Promise<RequestInit> {
    const state = await this.getAuthenticationState();
    if (state !== AuthenticationState.authenticated || !this.stateData) {
      logger.error('authenticate invoked without client being authenticated');
      throw AuthenticationClientError.clientIsNotAuthenticated();
    }

    try {
      const [accessToken, newData] = await this.oauthService.getAccessToken(
        this.stateData
      );
      await this.persist(newData);

      // Add auth headers to request
      const headers = new Headers(request.headers);
      headers.set('x-auth-token', accessToken);
      headers.set('x-client-id', this.appConfiguration.clientID);

      return {
        ...request,
        headers,
      };
    } catch (error) {
      logger.error('Failed to get access token, resetting to non-authenticated state', { error });
      this.stateData = null;
      throw AuthenticationClientError.clientIsNotAuthenticated(
        error instanceof Error ? error : undefined
      );
    }
  }

  async getAuthenticationHeaders(): Promise<Record<string, string>> {
    const state = await this.getAuthenticationState();
    if (state !== AuthenticationState.authenticated || !this.stateData) {
      logger.error('getAuthenticationHeaders called without being authenticated');
      throw AuthenticationClientError.clientIsNotAuthenticated();
    }

    try {
      const [accessToken, newData] = await this.oauthService.getAccessToken(
        this.stateData
      );
      await this.persist(newData);

      return {
        'x-auth-token': accessToken,
        'x-client-id': this.appConfiguration.clientID,
      };
    } catch (error) {
      logger.error('Failed to get access token, resetting to non-authenticated state', { error });
      this.stateData = null;
      throw AuthenticationClientError.clientIsNotAuthenticated(
        error instanceof Error ? error : undefined
      );
    }
  }

  async logout(): Promise<void> {
    try {
      await this.persistence.removeData(PERSISTENCE_KEY);
      this.stateData = null;
      logger.info('Logged out and cleared authentication state');
    } catch (error) {
      logger.error('Failed to clear authentication state during logout', { error });
      throw error;
    }
  }

  // MARK: - Private

  private async persist(data: OAuthStateData): Promise<void> {
    try {
      const encoded = this.encoder.encode(data);
      await this.persistence.setData(encoded, PERSISTENCE_KEY);
    } catch (error) {
      // Keep the session usable but log the error
      logger.error('Failed to persist authentication state', { error });
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an authentication client.
 */
export function createAuthenticationClient(
  configuration: AuthenticationClientConfiguration
): AuthenticationClient {
  return AuthenticationClientImpl.create(configuration);
}

