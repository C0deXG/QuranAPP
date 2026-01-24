/**
 * QuranProfileService.swift → quran-profile-service.ts
 *
 * Service for managing Quran.com user profile and authentication.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import type { AuthenticationClient } from '../../data/authentication-client';

// ============================================================================
// QuranProfileService
// ============================================================================

/**
 * Service for managing Quran.com user profile and authentication.
 */
export class QuranProfileService {
  private readonly authenticationClient: AuthenticationClient | null;

  constructor(authenticationClient: AuthenticationClient | null) {
    this.authenticationClient = authenticationClient;
  }

  /**
   * Performs the login flow to Quran.com.
   *
   * In React Native, this triggers the OAuth flow which may open
   * a browser or in-app authentication view.
   *
   * @returns Nothing is returned for now. The client may return
   *          the profile information in the future.
   */
  async login(): Promise<void> {
    await this.authenticationClient?.login();
  }

  /**
   * Checks if the user is currently logged in.
   *
   * @returns True if the user is authenticated.
   */
  async isLoggedIn(): Promise<boolean> {
    if (!this.authenticationClient) {
      return false;
    }
    
    const state = await this.authenticationClient.getState();
    return state !== null;
  }

  /**
   * Logs out the current user.
   */
  async logout(): Promise<void> {
    await this.authenticationClient?.logout();
  }

  /**
   * Gets the current access token if available.
   *
   * @returns The access token or null if not authenticated.
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.authenticationClient) {
      return null;
    }
    return this.authenticationClient.getAccessToken();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a QuranProfileService.
 */
export function createQuranProfileService(
  authenticationClient: AuthenticationClient | null
): QuranProfileService {
  return new QuranProfileService(authenticationClient);
}

