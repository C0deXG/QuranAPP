/**
 * Settings Tab Screen
 *
 * Settings screen matching iOS SettingsRootView.
 * 1:1 translation of iOS SettingsRootView.swift.
 *
 * Quran.com. All rights reserved.
 */

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import { useTheme, ThemeService, AppearanceMode } from '@/src/ui/theme';
import { l } from '@/src/core/localization';

/**
 * Appearance mode type for UI
 */
type AppearanceModeType = 'light' | 'dark' | 'auto';

/**
 * Settings section component
 */
function SettingsSection({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.colors.secondarySystemBackground }]}>
      {children}
    </View>
  );
}

/**
 * Settings item component (like iOS NoorListItem)
 */
function SettingsItem({ 
  icon, 
  title, 
  subtitle,
  onPress,
  showChevron = true,
}: { 
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
}) {
  const theme = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.item, { borderBottomColor: theme.colors.separator }]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons name={icon} size={22} color={theme.colors.tint} style={styles.icon} />
      )}
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.colors.label }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.itemSubtitle, { color: theme.colors.secondaryLabel }]}>{subtitle}</Text>
        )}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.tertiaryLabel} />
      )}
    </TouchableOpacity>
  );
}

/**
 * Appearance mode selector (like iOS AppearanceModeSelector)
 */
function AppearanceModeSelector({ 
  mode, 
  onModeChange 
}: { 
  mode: AppearanceModeType;
  onModeChange: (mode: AppearanceModeType) => void;
}) {
  const theme = useTheme();
  
  const modes: { key: AppearanceModeType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'light', label: l('theme.light'), icon: 'sunny' },
    { key: 'dark', label: l('theme.dark'), icon: 'moon' },
    { key: 'auto', label: l('theme.auto'), icon: 'phone-portrait' },
  ];

  return (
    <View style={styles.appearanceSelector}>
      {modes.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.appearanceOption,
            { backgroundColor: theme.colors.systemBackground },
            mode === item.key && { borderColor: theme.colors.tint, borderWidth: 2 },
          ]}
          onPress={() => onModeChange(item.key)}
        >
          <Ionicons 
            name={item.icon} 
            size={28} 
            color={mode === item.key ? theme.colors.tint : theme.colors.secondaryLabel} 
          />
          <Text style={[
            styles.appearanceLabel,
            { color: mode === item.key ? theme.colors.tint : theme.colors.label },
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/**
 * Settings tab component.
 * 1:1 translation of iOS SettingsRootView.
 */
export default function SettingsTab() {
  const router = useRouter();
  const theme = useTheme();
  
  // Appearance mode state
  const [appearanceMode, setAppearanceMode] = useState<AppearanceModeType>(() => {
    const currentMode = ThemeService.shared.appearanceMode;
    if (currentMode === AppearanceMode.Light) return 'light';
    if (currentMode === AppearanceMode.Dark) return 'dark';
    return 'auto';
  });

  // Handle appearance mode change
  const handleAppearanceModeChange = useCallback((mode: AppearanceModeType) => {
    setAppearanceMode(mode);
    // Set the appearance mode using the correct API
    switch (mode) {
      case 'light': 
        ThemeService.shared.appearanceMode = AppearanceMode.Light;
        break;
      case 'dark': 
        ThemeService.shared.appearanceMode = AppearanceMode.Dark;
        break;
      default: 
        ThemeService.shared.appearanceMode = AppearanceMode.Auto;
        break;
    }
  }, []);

  // Handle share app
  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({
        message: 'Check out Quran for iOS - https://apps.apple.com/app/quran-by-quran-com/id1118663303',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, []);

  // Handle write review
  const handleWriteReview = useCallback(async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch (error) {
      console.error('Review failed:', error);
    }
  }, []);

  // Handle contact us
  const handleContactUs = useCallback(async () => {
    const email = 'support@quran.com';
    const subject = 'Quran App Feedback';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open email client');
    }
  }, []);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.systemGroupedBackground || theme.colors.secondarySystemBackground }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Appearance Mode Selector */}
      <SettingsSection>
        <View style={styles.sectionContent}>
          <AppearanceModeSelector 
            mode={appearanceMode} 
            onModeChange={handleAppearanceModeChange} 
          />
        </View>
      </SettingsSection>

      {/* Mushaf Selector */}
      <SettingsSection>
        <SettingsItem
          icon="library-outline"
          title={l('reading.selector.title')}
          onPress={() => router.push('/reading-selector' as any)}
        />
      </SettingsSection>

      {/* Audio Settings */}
      <SettingsSection>
        <SettingsItem
          icon="musical-notes-outline"
          title={l('audio.download-play-amount')}
          subtitle="End of Page"
          onPress={() => router.push('/advanced-audio' as any)}
        />
        <SettingsItem
          icon="download-outline"
          title={l('audio_manager')}
          onPress={() => router.push('/audio-downloads' as any)}
        />
      </SettingsSection>

      {/* Translations */}
      <SettingsSection>
        <SettingsItem
          icon="language-outline"
          title={l('prefs_translations')}
          onPress={() => router.push('/translations' as any)}
        />
      </SettingsSection>

      {/* App Actions */}
      <SettingsSection>
        <SettingsItem
          icon="share-outline"
          title={l('setting.share_app')}
          onPress={handleShareApp}
        />
        <SettingsItem
          icon="star-outline"
          title={l('setting.write_review')}
          onPress={handleWriteReview}
        />
        <SettingsItem
          icon="mail-outline"
          title={l('setting.contact_us')}
          onPress={handleContactUs}
        />
      </SettingsSection>

      {/* Diagnostics */}
      <SettingsSection>
        <SettingsItem
          icon="bug-outline"
          title={l('diagnostics.title')}
          onPress={() => router.push('/diagnostics' as any)}
        />
      </SettingsSection>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.colors.tertiaryLabel }]}>
          {l('setting.app_version')}: 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionContent: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginRight: 12,
    width: 28,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
  },
  itemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  appearanceSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  appearanceOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  appearanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 13,
  },
});
