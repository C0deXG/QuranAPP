/**
 * Core Preferences
 *
 * Translated from quran-ios/Core/Preferences
 * This module provides persistent key-value storage with reactive updates.
 */

// Preference key
export {
  PreferenceKey,
  preferenceKey,
  optionalPreferenceKey,
  nullablePreferenceKey,
} from './preference-key';

// Preference transformer
export {
  type PreferenceTransformer,
  createTransformer,
  rawRepresentableTransformer,
  numericEnumTransformer,
  stringEnumTransformer,
  optionalTransformer,
  nullableTransformer,
  booleanToNumberTransformer,
  dateToStringTransformer,
  dateToTimestampTransformer,
  jsonTransformer,
  arrayTransformer,
} from './preference-transformer';

// Preferences store
export {
  Preferences,
  getPreference,
  setPreference,
  removePreference,
  createInMemoryStorage,
  setDefaultStorageAdapter,
} from './preferences';

// React hooks
export {
  usePreference,
  useTransformedPreference,
  usePreferenceValue,
  useDerivedPreference,
  useBooleanPreference,
  usePreferenceNullable,
} from './use-preference';

