/**
 * OAuthServiceAppAuthImpl.swift → oauth-service-impl.ts
 *
 * OAuth service implementation translated from quran-ios Core/OAuthServiceAppAuthImpl
 * Created by Mohannad Hassan on 08/01/2025.
 *
 * Uses expo-auth-session for OAuth flows.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { logger } from '../logging';
import {
  OAuthService,
  OAuthStateData,
  OAuthStateDataEncoder,
  OAuthServiceError,
} from './oauth-service';

// Ensure web browser redirect is handled
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth configuration for the app.
 * Equivalent to Swift's AppAuthConfiguration.
 */
export interface OAuthConfiguration {
  /**
   * OAuth client ID.
   */
  clientId?: string;
  /** Alias for clientId */
  clientID?: string;
  /** Alias for redirectUri */
  redirectURL?: string;
  /** Alias for issuerUrl */
  authorizationIssuerURL?: string;

  /**
   * OAuth client secret (optional for PKCE flows).
   */
  clientSecret?: string;

  /**
   * Redirect URL for OAuth callback.
   */
  redirectUri: string;

  /**
   * OAuth scopes to request.
   */
  scopes: string[];

  /**
   * Authorization server issuer URL.
   */
  issuerUrl: string;

  /**
   * Discovery document URL (optional, derived from issuerUrl if not provided).
   */
  discoveryUrl?: string;
}

/**
 * OAuth state data for expo-auth-session.
 */
export interface ExpoAuthStateData extends OAuthStateData {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType?: string;
  expiresAt?: number;
  scope?: string;
}

/**
 * Creates ExpoAuthStateData from tokens.
 */
export function createExpoAuthStateData(
  accessToken: string,
  options?: {
    refreshToken?: string;
    idToken?: string;
    tokenType?: string;
    expiresIn?: number;
    scope?: string;
  }
): ExpoAuthStateData {
  return {
    accessToken,
    refreshToken: options?.refreshToken,
    idToken: options?.idToken,
    tokenType: options?.tokenType,
    expiresAt: options?.expiresIn ? Date.now() + options.expiresIn * 1000 : undefined,
    scope: options?.scope,
    isAuthorized: true,
  };
}

/**
 * Encoder for ExpoAuthStateData.
 */
export class ExpoAuthStateDataEncoder implements OAuthStateDataEncoder {
  encode(data: OAuthStateData): string {
    return JSON.stringify(data);
  }

  decode(data: string): ExpoAuthStateData {
    try {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        isAuthorized: Boolean(parsed.accessToken),
      };
    } catch (error) {
      throw OAuthServiceError.stateDataDecodingError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

/**
 * OAuth service implementation using expo-auth-session.
 * Equivalent to Swift's OAuthServiceAppAuthImpl.
 */
export class ExpoAuthService implements OAuthService {
  private readonly config: OAuthConfiguration;
  private discovery: AuthSession.DiscoveryDocument | null = null;

  constructor(config: OAuthConfiguration) {
    this.config = config;
  }

  /**
   * Discovers the OAuth configuration.
   */
  private async discoverConfiguration(): Promise<AuthSession.DiscoveryDocument> {
    if (this.discovery) {
      return this.discovery;
    }

    logger.info('Discovering configuration for OAuth');

    try {
      const discovery = await AuthSession.fetchDiscoveryAsync(this.config.issuerUrl);
      this.discovery = discovery;
      logger.info('OAuth configuration fetched successfully');
      return discovery;
    } catch (error) {
      logger.error(`Error fetching OAuth configuration: ${error}`);
      throw OAuthServiceError.failedToDiscoverService(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async login(): Promise<OAuthStateData> {
    const discovery = await this.discoverConfiguration();

    logger.info('Starting OAuth flow');

    const request = new AuthSession.AuthRequest({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      scopes: ['openid', 'profile', ...this.config.scopes],
      redirectUri: this.config.redirectUri,
      usePKCE: true,
    });

    try {
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // Exchange code for tokens
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            code: result.params.code,
            redirectUri: this.config.redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier ?? '',
            },
          },
          discovery
        );

        logger.info('OAuth flow completed successfully');

        return createExpoAuthStateData(tokenResponse.accessToken, {
          refreshToken: tokenResponse.refreshToken ?? undefined,
          idToken: tokenResponse.idToken ?? undefined,
          tokenType: tokenResponse.tokenType,
          expiresIn: tokenResponse.expiresIn ?? undefined,
          scope: tokenResponse.scope ?? undefined,
        });
      } else if (result.type === 'cancel') {
        throw OAuthServiceError.failedToAuthenticate(new Error('User cancelled authentication'));
      } else {
        throw OAuthServiceError.failedToAuthenticate(
          new Error(result.type === 'error' ? result.error?.message : 'Authentication failed')
        );
      }
    } catch (error) {
      if (error instanceof OAuthServiceError) {
        throw error;
      }
      logger.error(`Error authenticating: ${error}`);
      throw OAuthServiceError.failedToAuthenticate(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getAccessToken(data: OAuthStateData): Promise<[string, OAuthStateData]> {
    const authData = data as ExpoAuthStateData;

    if (!authData.accessToken) {
      throw OAuthServiceError.failedToRefreshTokens(new Error('No access token available'));
    }

    // Check if token is expired
    if (authData.expiresAt && authData.expiresAt < Date.now()) {
      // Token expired, try to refresh
      const refreshedData = await this.refreshAccessTokenIfNeeded(data);
      return [(refreshedData as ExpoAuthStateData).accessToken, refreshedData];
    }

    return [authData.accessToken, data];
  }

  async refreshAccessTokenIfNeeded(data: OAuthStateData): Promise<OAuthStateData> {
    const authData = data as ExpoAuthStateData;

    // If token is not expired, return as is
    if (authData.expiresAt && authData.expiresAt > Date.now()) {
      return data;
    }

    // If no refresh token, can't refresh
    if (!authData.refreshToken) {
      logger.warning('No refresh token available, returning current state');
      return data;
    }

    const discovery = await this.discoverConfiguration();

    logger.info('Refreshing access token');

    try {
      const tokenResponse = await AuthSession.refreshAsync(
        {
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
          refreshToken: authData.refreshToken,
        },
        discovery
      );

      logger.info('Access token refreshed successfully');

      return createExpoAuthStateData(tokenResponse.accessToken, {
        refreshToken: tokenResponse.refreshToken ?? authData.refreshToken,
        idToken: tokenResponse.idToken ?? authData.idToken,
        tokenType: tokenResponse.tokenType,
        expiresIn: tokenResponse.expiresIn ?? undefined,
        scope: tokenResponse.scope ?? authData.scope,
      });
    } catch (error) {
      logger.error(`Failed to refresh tokens: ${error}`);
      throw OAuthServiceError.failedToRefreshTokens(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async logout(_data: OAuthStateData): Promise<void> {
    // Clear the discovery cache
    this.discovery = null;

    // Note: expo-auth-session doesn't have a built-in logout.
    // The calling code should clear the stored state data.
    logger.info('OAuth logout completed');
  }
}

/**
 * Creates an OAuth service with the given configuration.
 */
export function createOAuthService(config: OAuthConfiguration): OAuthService {
  return new ExpoAuthService(config);
}

