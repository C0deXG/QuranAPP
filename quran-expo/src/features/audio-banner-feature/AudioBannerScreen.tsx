/**
 * AudioBannerView.swift → AudioBannerScreen.tsx
 *
 * Audio banner screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../ui/theme';
import { AudioBannerView, type AudioBannerActions } from '../../ui/features/audio-banner';
import { Toast, ToastPresenter } from '../../ui/uix';
import {
  AudioBannerViewModel,
  type AudioBannerViewState,
} from './audio-banner-view-model';

// ============================================================================
// Types
// ============================================================================

export interface AudioBannerScreenProps {
  viewModel: AudioBannerViewModel;
}

// ============================================================================
// AudioBannerScreen Component
// ============================================================================

export function AudioBannerScreen({ viewModel }: AudioBannerScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<AudioBannerViewState>(viewModel.state);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    viewModel.start();

    return () => {
      viewModel.removeListener(setState);
      viewModel.dispose();
    };
  }, [viewModel]);

  // Show error alert
  useEffect(() => {
    if (state.error) {
      Alert.alert(
        'Error',
        state.error.message,
        [{ text: 'OK', onPress: () => viewModel.clearError() }]
      );
    }
  }, [state.error, viewModel]);

  // Show toast
  useEffect(() => {
    if (state.toast) {
      ToastPresenter.show({
        message: state.toast.message,
        action: state.toast.action ?? undefined,
        bottomOffset: 100,
      });
      viewModel.clearToast();
    }
  }, [state.toast, viewModel]);

  // Build actions
  const actions: AudioBannerActions = {
    play: () => viewModel.playFromBanner(),
    pause: () => viewModel.pauseFromBanner(),
    resume: () => viewModel.resumeFromBanner(),
    stop: () => viewModel.stopFromBanner(),
    backward: () => viewModel.backwardFromBanner(),
    forward: () => viewModel.forwardFromBanner(),
    cancelDownloading: async () => viewModel.cancelDownload(),
    reciters: () => viewModel.presentReciterList(),
    more: () => viewModel.showAdvancedAudioOptions(),
    currentRate: state.playbackRate,
    setPlaybackRate: (rate) => viewModel.updatePlaybackRate(rate),
  };

  return (
    <View style={styles.container}>
      <AudioBannerView state={state.audioBannerState} actions={actions} />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    // Container is transparent to allow parent to control background
  },
});

