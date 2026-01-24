/**
 * OAuthServiceFake.swift → oauth-service-fake.ts
 *
 * Mock OAuth service for testing translated from quran-ios Core/OAuthServiceFake
 * Created by Mohannad Hassan on 22/01/2025.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import {
  OAuthService,
  OAuthStateData,
  OAuthStateDataEncoder,
  OAuthServiceError,
} from './oauth-service';

/**
 * Fake OAuth state data for testing.
 */
export interface FakeOAuthStateData extends OAuthStateData {
  accessToken?: string;
}

/**
 * Creates fake OAuth state data.
 */
export function createFakeOAuthStateData(accessToken?: string): FakeOAuthStateData {
  return {
    accessToken,
    isAuthorized: accessToken !== undefined,
  };
}

/**
 * Encoder for FakeOAuthStateData.
 */
export class FakeOAuthStateDataEncoder implements OAuthStateDataEncoder {
  encode(data: OAuthStateData): string {
    return JSON.stringify(data);
  }

  decode(data: string): FakeOAuthStateData {
    const parsed = JSON.parse(data);
    return {
      accessToken: parsed.accessToken,
      isAuthorized: Boolean(parsed.accessToken),
    };
  }
}

/**
 * Access token behavior for testing.
 */
export type AccessTokenBehavior =
  | { type: 'success'; token: string }
  | { type: 'successWithNewData'; token: string; data: OAuthStateData }
  | { type: 'failure'; error: Error };

/**
 * Creates access token behaviors.
 */
export const AccessTokenBehaviors = {
  success: (token: string): AccessTokenBehavior => ({ type: 'success', token }),
  successWithNewData: (token: string, data: OAuthStateData): AccessTokenBehavior => ({
    type: 'successWithNewData',
    token,
    data,
  }),
  failure: (error: Error): AccessTokenBehavior => ({ type: 'failure', error }),
};

/**
 * Mock OAuth service for testing.
 * Equivalent to Swift's OAuthServiceFake.
 */
export class FakeOAuthService implements OAuthService {
  /**
   * Result to return from login().
   */
  loginResult?: { success: true; data: OAuthStateData } | { success: false; error: Error };

  /**
   * Behavior for getAccessToken().
   */
  accessTokenBehavior?: AccessTokenBehavior;

  /**
   * Track method calls for testing.
   */
  loginCalled = false;
  getAccessTokenCalled = false;
  refreshCalled = false;
  logoutCalled = false;

  async login(): Promise<OAuthStateData> {
    this.loginCalled = true;

    if (!this.loginResult) {
      throw new Error('FakeOAuthService: loginResult not set');
    }

    if (this.loginResult.success) {
      return this.loginResult.data;
    } else {
      throw (this.loginResult as { success: false; error: Error }).error;
    }
  }

  async getAccessToken(data: OAuthStateData): Promise<[string, OAuthStateData]> {
    this.getAccessTokenCalled = true;

    if (!this.accessTokenBehavior) {
      throw new Error('FakeOAuthService: accessTokenBehavior not set');
    }

    switch (this.accessTokenBehavior.type) {
      case 'success':
        return [this.accessTokenBehavior.token, data];
      case 'successWithNewData':
        return [this.accessTokenBehavior.token, this.accessTokenBehavior.data];
      case 'failure':
        throw this.accessTokenBehavior.error;
    }
  }

  async refreshAccessTokenIfNeeded(data: OAuthStateData): Promise<OAuthStateData> {
    this.refreshCalled = true;
    const [, updatedData] = await this.getAccessToken(data);
    return updatedData;
  }

  async logout(_data: OAuthStateData): Promise<void> {
    this.logoutCalled = true;
  }

  // ============================================================================
  // Test Helpers
  // ============================================================================

  /**
   * Sets up a successful login result.
   */
  setLoginSuccess(data: OAuthStateData): void {
    this.loginResult = { success: true, data };
  }

  /**
   * Sets up a failed login result.
   */
  setLoginFailure(error: Error): void {
    this.loginResult = { success: false, error };
  }

  /**
   * Sets up successful token retrieval.
   */
  setTokenSuccess(token: string, newData?: OAuthStateData): void {
    if (newData) {
      this.accessTokenBehavior = AccessTokenBehaviors.successWithNewData(token, newData);
    } else {
      this.accessTokenBehavior = AccessTokenBehaviors.success(token);
    }
  }

  /**
   * Sets up failed token retrieval.
   */
  setTokenFailure(error: Error): void {
    this.accessTokenBehavior = AccessTokenBehaviors.failure(error);
  }

  /**
   * Resets all tracking flags.
   */
  reset(): void {
    this.loginCalled = false;
    this.getAccessTokenCalled = false;
    this.refreshCalled = false;
    this.logoutCalled = false;
    this.loginResult = undefined;
    this.accessTokenBehavior = undefined;
  }
}

/**
 * Creates a fake OAuth service for testing.
 */
export function createFakeOAuthService(): FakeOAuthService {
  return new FakeOAuthService();
}

