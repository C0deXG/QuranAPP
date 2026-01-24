/**
 * MD5Calculator.swift → md5-calculator.ts
 *
 * MD5 hash calculation for files.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import * as Crypto from 'expo-crypto';
import * as LegacyFS from 'expo-file-system/legacy';

// ============================================================================
// MD5Calculator
// ============================================================================

/**
 * Calculates MD5 hashes for files.
 */
export class MD5Calculator {
  /**
   * Calculates the MD5 hash string for a file.
   *
   * Note: In React Native, we read the file content and hash it.
   * For large files, this may need chunked reading.
   */
  async stringMD5(fileUri: string): Promise<string> {
    try {
      // Read file content as base64
      const content = await LegacyFS.readAsStringAsync(fileUri, {
        encoding: LegacyFS.EncodingType.Base64,
      });

      // Calculate MD5 hash
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.MD5,
        content,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      return hash.toLowerCase();
    } catch (error) {
      throw new Error(`Failed to calculate MD5 for file: ${fileUri}. Error: ${error}`);
    }
  }

  /**
   * Calculates the MD5 hash as bytes for a file.
   */
  async dataMD5(fileUri: string): Promise<Uint8Array> {
    const hexString = await this.stringMD5(fileUri);
    return this.hexToBytes(hexString);
  }

  /**
   * Converts hex string to byte array.
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an MD5Calculator.
 */
export function createMD5Calculator(): MD5Calculator {
  return new MD5Calculator();
}

