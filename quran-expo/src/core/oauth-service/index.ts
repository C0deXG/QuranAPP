/**
 * Core OAuthService
 *
 * Translated from quran-ios/Core/OAuthService, OAuthServiceAppAuthImpl, OAuthServiceFake
 * Provides OAuth authentication using expo-auth-session.
 */

// Core interface and types
export {
  OAuthServiceErrorType,
  OAuthServiceError,
  type OAuthStateData,
  type OAuthService,
  type OAuthStateDataEncoder,
} from './oauth-service';

// Implementation using expo-auth-session
export {
  type OAuthConfiguration,
  type ExpoAuthStateData,
  ExpoAuthService,
  ExpoAuthStateDataEncoder,
  createExpoAuthStateData,
  createOAuthService,
} from './oauth-service-impl';

// Fake implementation for testing
export {
  type FakeOAuthStateData,
  type AccessTokenBehavior,
  FakeOAuthService,
  FakeOAuthStateDataEncoder,
  AccessTokenBehaviors,
  createFakeOAuthStateData,
  createFakeOAuthService,
} from './oauth-service-fake';

