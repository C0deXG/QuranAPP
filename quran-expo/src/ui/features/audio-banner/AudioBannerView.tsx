/**
 * AudioBannerView.tsx → Mini Player (Pinned Strip)
 *
 * Collapsed mini player - 60px height, flush to bottom, no floating.
 * Matches iOS goal UI 1:1.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { l } from '../../../core/localization';
import type { AudioBannerState, AudioBannerActions } from './AudioBannerState';
import { SPEED_VALUES, formatSpeed } from './AudioBannerState';
import { NoorSystemImage, getIoniconName } from '../../images';

// ============================================================================
// AudioBannerView - Mini Player
// ============================================================================

export interface AudioBannerViewProps {
  state: AudioBannerState;
  actions: AudioBannerActions;
}

export function AudioBannerView({ state, actions }: AudioBannerViewProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {state.type === 'playing' && (
        <AudioPlayingView paused={state.paused} actions={actions} />
      )}
      {state.type === 'readyToPlay' && (
        <ReadyToPlayView reciter={state.reciter} actions={actions} />
      )}
      {state.type === 'downloading' && (
        <DownloadingView progress={state.progress} actions={actions} />
      )}
    </View>
  );
}

// ============================================================================
// AudioPlayingView - Playing State
// ============================================================================

interface AudioPlayingViewProps {
  paused: boolean;
  actions: AudioBannerActions;
}

function AudioPlayingView({ paused, actions }: AudioPlayingViewProps) {
  const theme = useTheme();
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const iconColor = theme.colors.tint;

  return (
    <>
      <View style={styles.contentRow}>
        {/* Stop button */}
        <IconButton
          icon={NoorSystemImage.Stop}
          onPress={actions.stop}
          color={iconColor}
          size={24}
        />

        {/* Speed selector */}
        <TouchableOpacity
          onPress={() => setShowSpeedMenu(true)}
          style={[
            styles.speedButton,
            { backgroundColor: theme.isDark ? '#2C2C2E' : '#E5E5E5' }
          ]}
        >
          <Text style={[styles.speedText, { color: theme.colors.label }]}>
            {formatSpeed(actions.currentRate)}
          </Text>
        </TouchableOpacity>

        {/* Backward */}
        <IconButton
          icon={NoorSystemImage.Backward}
          onPress={actions.backward}
          color={iconColor}
          size={24}
        />

        {/* Play/Pause */}
        {paused ? (
          <IconButton
            icon={NoorSystemImage.Play}
            onPress={actions.resume}
            color={iconColor}
            size={26}
          />
        ) : (
          <IconButton
            icon={NoorSystemImage.Pause}
            onPress={actions.pause}
            color={iconColor}
            size={26}
          />
        )}

        {/* Forward */}
        <IconButton
          icon={NoorSystemImage.Forward}
          onPress={actions.forward}
          color={iconColor}
          size={24}
        />

        <View style={styles.spacer} />

        {/* More button */}
        <IconButton
          icon={NoorSystemImage.More}
          onPress={actions.more}
          color={iconColor}
          size={22}
        />
      </View>

      {/* Speed Menu */}
      <SpeedMenu
        visible={showSpeedMenu}
        currentRate={actions.currentRate}
        onSelect={(rate) => {
          actions.setPlaybackRate(rate);
          setShowSpeedMenu(false);
        }}
        onClose={() => setShowSpeedMenu(false)}
      />
    </>
  );
}

// ============================================================================
// ReadyToPlayView - Default State
// ============================================================================

interface ReadyToPlayViewProps {
  reciter: string;
  actions: AudioBannerActions;
}

function ReadyToPlayView({ reciter, actions }: ReadyToPlayViewProps) {
  const theme = useTheme();
  const iconColor = theme.colors.tint;
  const textColor = theme.colors.label;

  return (
    <View style={styles.contentRow}>
      {/* Play button */}
      <IconButton
        icon={NoorSystemImage.Play}
        onPress={actions.play}
        color={iconColor}
        size={26}
      />

      <View style={styles.spacer} />

      {/* Reciter name - tappable to open list */}
      <Pressable onPress={actions.reciters} style={styles.reciterButton}>
        <Text
          style={[styles.reciterName, { color: textColor }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {reciter}
        </Text>
      </Pressable>

      <View style={styles.spacer} />

      {/* More button */}
      <IconButton
        icon={NoorSystemImage.More}
        onPress={actions.more}
        color={iconColor}
        size={22}
      />
    </View>
  );
}

// ============================================================================
// DownloadingView - Download State
// ============================================================================

interface DownloadingViewProps {
  progress: number;
  actions: AudioBannerActions;
}

function DownloadingView({ progress, actions }: DownloadingViewProps) {
  const theme = useTheme();
  const [isCancelling, setIsCancelling] = useState(false);
  const iconColor = theme.colors.tint;
  const textColor = theme.colors.label;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await actions.cancelDownloading();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <View style={styles.contentRow}>
      {/* Cancel button */}
      <TouchableOpacity
        onPress={handleCancel}
        disabled={isCancelling}
        style={styles.iconButtonContainer}
      >
        <Ionicons
          name={getIoniconName(NoorSystemImage.Cancel) as keyof typeof Ionicons.glyphMap}
          size={24}
          color={isCancelling ? theme.colors.tertiaryLabel : iconColor}
        />
      </TouchableOpacity>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[
          styles.progressBar,
          { backgroundColor: theme.isDark ? '#3A3A3C' : '#E5E5E5' }
        ]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: theme.colors.tint,
              }
            ]}
          />
        </View>
        <Text style={[styles.downloadingText, { color: textColor }]}>
          {l('downloading_title')}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// IconButton
// ============================================================================

interface IconButtonProps {
  icon: NoorSystemImage;
  onPress: () => void;
  color: string;
  size: number;
}

function IconButton({ icon, onPress, color, size }: IconButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iconButtonContainer}>
      <Ionicons
        name={getIoniconName(icon) as keyof typeof Ionicons.glyphMap}
        size={size}
        color={color}
      />
    </TouchableOpacity>
  );
}

// ============================================================================
// SpeedMenu
// ============================================================================

interface SpeedMenuProps {
  visible: boolean;
  currentRate: number;
  onSelect: (rate: number) => void;
  onClose: () => void;
}

function SpeedMenu({ visible, currentRate, onSelect, onClose }: SpeedMenuProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={[
          styles.menuContent,
          { backgroundColor: theme.colors.secondarySystemBackground }
        ]}>
          <FlatList
            data={SPEED_VALUES}
            keyExtractor={(item) => String(item)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  item === currentRate && { backgroundColor: theme.colors.tint + '20' },
                ]}
                onPress={() => onSelect(item)}
              >
                <Text style={[styles.menuItemText, { color: theme.colors.label }]}>
                  {formatSpeed(item)}
                </Text>
                {item === currentRate && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.tint} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.menuSeparator, { backgroundColor: theme.colors.separator }]} />
            )}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    height: 64,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
  },
  iconButtonContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  speedText: {
    fontSize: 13,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  reciterButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  reciterName: {
    fontSize: 17,
    fontWeight: '500',
  },
  progressContainer: {
    flex: 1,
    marginLeft: 16,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  downloadingText: {
    fontSize: 14,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContent: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
  },
});
