/**
 * ContactUsService.swift → contact-us-service.ts
 *
 * Service for contact us functionality.
 *
 * Quran.com. All rights reserved.
 */

import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// ============================================================================
// ContactUsService
// ============================================================================

/**
 * Service for opening the contact us form.
 *
 * 1:1 translation of iOS ContactUsService.
 */
export class ContactUsService {
  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Open the contact us form in a web browser.
   */
  async openContactUs(): Promise<void> {
    const url = this.getContactUsUrl();
    await WebBrowser.openBrowserAsync(url);
  }

  /**
   * Get the contact us URL with device info.
   */
  getContactUsUrl(): string {
    const appVersion = Constants.expoConfig?.version ?? 'Unknown';
    const device = Device.modelName ?? 'Unknown';
    const osVersion = Device.osVersion ?? 'Unknown';
    const platformName = Platform.OS;

    const appDetails = `${appVersion}|${device}|${platformName}${osVersion}`;
    const encodedAppDetails = encodeURIComponent(appDetails);

    const baseUrl =
      'https://docs.google.com/forms/d/e/1FAIpQLSduPT6DFmx2KGOS0I7khpww4FuvLGEDBlzKBhdw6dgIPU_6sg/viewform';

    return `${baseUrl}?entry.1440014003=${encodedAppDetails}`;
  }
}

