/**
 * AuthenticationClient - OAuth authentication with Quran.com
 *
 * Translated from quran-ios/Data/AuthenticationClient
 *
 * This module provides:
 * - OAuth authentication flow
 * - Secure state persistence
 * - Token refresh
 * - Request authentication
 */

export type {
  AuthenticationClient,
  AuthenticationClientConfiguration,
  OAuthStateDataEncoder,
} from './authentication-client';

export {
  AuthenticationClientImpl,
  AuthenticationClientError,
  AuthenticationState,
  JsonOAuthStateEncoder,
  createAuthenticationClient,
  createAuthenticationClientConfiguration,
} from './authentication-client';

