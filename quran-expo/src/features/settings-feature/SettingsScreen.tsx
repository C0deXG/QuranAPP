/**
 * SettingsRootView.swift → SettingsScreen.tsx
 *
 * Settings screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l, lAndroid } from '../../core/localization';
import { useTheme, type AppearanceMode } from '../../ui/theme';
import { NoorListItem, DisclosureIndicator } from '../../ui/components';
import { getAudioEndLocalizedName } from '../../domain/quran-audio-kit';
import { AppearanceModeSelector } from './AppearanceModeSelector';
import {
  SettingsViewModel,
  type SettingsViewState,
} from './settings-view-model';

// ============================================================================
// Types
// ============================================================================

export interface SettingsScreenProps {
  viewModel: SettingsViewModel;
}

// ============================================================================
// SettingsScreen Component
// ============================================================================

export function SettingsScreen({ viewModel }: SettingsScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<SettingsViewState>(viewModel.state);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);

    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Show error alert
  useEffect(() => {
    if (state.error) {
      Alert.alert(
        l('error'),
        state.error.message,
        [{ text: l('ok'), onPress: () => viewModel.clearError() }]
      );
    }
  }, [state.error, viewModel]);

  // Handle appearance mode change
  const handleAppearanceModeChange = useCallback(
    (mode: AppearanceMode) => {
      viewModel.setAppearanceMode(mode);
    },
    [viewModel]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.systemGroupedBackground }]}
      contentContainerStyle={styles.content}
    >
      {/* Appearance Mode */}
      <View style={[styles.section, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
        <AppearanceModeSelector
          selectedMode={state.appearanceMode}
          onSelectMode={handleAppearanceModeChange}
        />
      </View>

      {/* Reading Selector */}
      <View style={[styles.section, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
        <SettingsListItem
          icon="book-outline"
          title={l('reading.selector.title')}
          onPress={() => viewModel.navigateToReadingSelector()}
        />
      </View>

      {/* Audio Settings */}
      <View style={[styles.section, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
        <SettingsListItem
          icon="musical-notes-outline"
          title={l('audio.download-play-amount')}
          subtitle={getAudioEndLocalizedName(state.audioEnd)}
          onPress={() => viewModel.navigateToAudioEndSelector()}
        />
        <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
        <SettingsListItem
          icon="download-outline"
          title={lAndroid('audio_manager')}
          onPress={() => viewModel.navigateToAudioManager()}
        />
      </View>

      {/* Translations */}
      <View style={[styles.section, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
        <SettingsListItem
          icon="language-outline"
          title={lAndroid('prefs_translations')}
          onPress={() => viewModel.navigateToTranslationsList()}
        />
      </View>

      {/* Support */}
      <View style={[styles.section, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
        <SettingsListItem
          icon="share-outline"
          title={l('setting.share_app')}
          onPress={() => viewModel.shareApp()}
        />
        <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
        <SettingsListItem
          icon="star-outline"
          title={l('setting.write_review')}
          onPress={() => viewModel.writeReview()}
        />
        <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
        <SettingsListItem
          icon="mail-outline"
          title={l('setting.contact_us')}
          onPress={() => viewModel.contactUs()}
        />
      </View>

      {/* Diagnostics */}
      <View style={[styles.section, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
        <SettingsListItem
          icon="bug-outline"
          title={l('diagnostics.title')}
          onPress={() => viewModel.navigateToDiagnostics()}
        />
      </View>

      {/* Login (if enabled) */}
      {/* Note: QURAN_SYNC feature flag - hidden for now */}
      {false && (
        <View style={[styles.section, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => viewModel.loginToQuranCom()}
            disabled={state.isLoggingIn}
          >
            {state.isLoggingIn ? (
              <ActivityIndicator size="small" color={theme.colors.tint} />
            ) : (
              <Text style={[styles.loginButtonText, { color: theme.colors.tint }]}>
                {l('Login with Quran.com')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ============================================================================
// SettingsListItem Component
// ============================================================================

interface SettingsListItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

function SettingsListItem({ icon, title, subtitle, onPress }: SettingsListItemProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <Ionicons
        name={icon as any}
        size={22}
        color={theme.colors.tint}
        style={styles.listItemIcon}
      />
      <View style={styles.listItemContent}>
        <Text style={[styles.listItemTitle, { color: theme.colors.label }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.listItemSubtitle, { color: theme.colors.secondaryLabel }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <DisclosureIndicator />
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  listItemIcon: {
    width: 28,
    marginRight: 10,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 17,
  },
  listItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  loginButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 17,
  },
});

