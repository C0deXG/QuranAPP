/**
 * SystemBundle.swift → system-bundle.ts
 *
 * Bundle resource access translated from quran-ios Core/SystemDependencies
 * Created by Mohamed Afifi on 2023-05-07.
 *
 * In React Native/Expo, we use expo-asset and require() for bundled resources.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import Constants from 'expo-constants';

/**
 * Interface for accessing bundled resources.
 * Equivalent to Swift's SystemBundle protocol.
 */
export interface SystemBundle {
  /**
   * Reads an array from a bundled plist/json resource.
   *
   * @param resource - Resource name (without extension)
   * @param withExtension - File extension
   * @returns The array contents
   */
  readArray<T>(resource: string, withExtension: string): T[];

  /**
   * Gets a value from the app's info/config.
   *
   * @param key - The info dictionary key
   * @returns The value, or undefined
   */
  infoValue<T>(forKey: string): T | undefined;

  /**
   * Gets the URI for a bundled resource.
   *
   * @param name - Resource name
   * @param ext - File extension
   * @returns The resource URI, or undefined
   */
  url(forResource: string | undefined, withExtension: string | undefined): string | undefined;
}

/**
 * Registry for bundled resources.
 * Resources must be registered at app startup for access.
 */
const resourceRegistry: Map<string, unknown> = new Map();

/**
 * Registers a bundled resource for later access.
 *
 * @param name - Resource name with extension (e.g., "reciters.plist")
 * @param content - The resource content
 */
export function registerResource(name: string, content: unknown): void {
  resourceRegistry.set(name, content);
}

/**
 * Default implementation of SystemBundle for Expo.
 */
export class DefaultSystemBundle implements SystemBundle {
  readArray<T>(resource: string, withExtension: string): T[] {
    const key = `${resource}.${withExtension}`;
    const content = resourceRegistry.get(key);

    if (Array.isArray(content)) {
      return content as T[];
    }

    console.warn(`Resource not found or not an array: ${key}`);
    return [];
  }

  infoValue<T>(forKey: string): T | undefined {
    // Access Expo Constants for app configuration
    const manifest = Constants.expoConfig;

    if (!manifest) {
      return undefined;
    }

    // Common mappings from iOS info.plist keys
    switch (forKey) {
      case 'CFBundleShortVersionString':
        return manifest.version as T | undefined;
      case 'CFBundleVersion':
        return (manifest.ios?.buildNumber ?? manifest.android?.versionCode?.toString()) as T | undefined;
      case 'CFBundleIdentifier':
        return (manifest.ios?.bundleIdentifier ?? manifest.android?.package) as T | undefined;
      case 'CFBundleName':
        return manifest.name as T | undefined;
      case 'CFBundleDisplayName':
        return manifest.name as T | undefined;
      default:
        // Check extra config
        return manifest.extra?.[forKey] as T | undefined;
    }
  }

  url(forResource: string | undefined, withExtension: string | undefined): string | undefined {
    if (!forResource) {
      return undefined;
    }

    const key = withExtension ? `${forResource}.${withExtension}` : forResource;

    // In Expo, bundled resources are typically accessed via require()
    // and registered at startup. Return the registered URI if available.
    if (resourceRegistry.has(key)) {
      // Return a pseudo-URI that can be resolved
      return `bundle://${key}`;
    }

    return undefined;
  }
}

/**
 * Mock bundle for testing.
 */
export class MockSystemBundle implements SystemBundle {
  private arrays: Map<string, unknown[]> = new Map();
  private infoValues: Map<string, unknown> = new Map();
  private urls: Map<string, string> = new Map();

  setArray<T>(resource: string, ext: string, content: T[]): void {
    this.arrays.set(`${resource}.${ext}`, content);
  }

  setInfoValue<T>(key: string, value: T): void {
    this.infoValues.set(key, value);
  }

  setUrl(resource: string, ext: string, url: string): void {
    this.urls.set(`${resource}.${ext}`, url);
  }

  readArray<T>(resource: string, withExtension: string): T[] {
    return (this.arrays.get(`${resource}.${withExtension}`) ?? []) as T[];
  }

  infoValue<T>(forKey: string): T | undefined {
    return this.infoValues.get(forKey) as T | undefined;
  }

  url(forResource: string | undefined, withExtension: string | undefined): string | undefined {
    if (!forResource) return undefined;
    const key = withExtension ? `${forResource}.${withExtension}` : forResource;
    return this.urls.get(key);
  }
}

/**
 * Shared default bundle instance.
 */
export const systemBundle: SystemBundle = new DefaultSystemBundle();

