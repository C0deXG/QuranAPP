/**
 * AudioDownloadsView.swift + AudioDownloadsViewController.swift → AudioDownloadsScreen.tsx
 *
 * Audio downloads screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l, lAndroid } from '../../core/localization';
import { useTheme } from '../../ui/theme';
import { Dimensions, CORNER_RADIUS } from '../../ui/dimensions';
import { NoorSystemImage } from '../../ui/images';
import type { Reciter } from '../../model/quran-audio';
import {
  AudioDownloadsViewModel,
  type AudioDownloadsViewState,
  type EditMode,
} from './audio-downloads-view-model';
import {
  type AudioDownloadItem,
  isDownloaded,
  canDelete,
  formatDownloadedSize,
} from './audio-download-item';

// ============================================================================
// Types
// ============================================================================

export interface AudioDownloadsScreenProps {
  viewModel: AudioDownloadsViewModel;
}

// ============================================================================
// AudioDownloadsScreen Component
// ============================================================================

export function AudioDownloadsScreen({ viewModel }: AudioDownloadsScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<AudioDownloadsViewState>(viewModel.state);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    viewModel.start();

    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Show error alert
  useEffect(() => {
    if (state.error) {
      Alert.alert(l('error'), state.error.message, [
        { text: l('ok'), onPress: () => viewModel.clearError() },
      ]);
    }
  }, [state.error, viewModel]);

  const downloadedItems = state.items.filter(canDelete);
  const notDownloadedItems = state.items.filter((item) => !canDelete(item));

  const handleDownload = useCallback(
    async (item: AudioDownloadItem) => {
      await viewModel.startDownloading(item.reciter);
    },
    [viewModel]
  );

  const handleCancel = useCallback(
    async (item: AudioDownloadItem) => {
      await viewModel.cancelDownloading(item.reciter);
    },
    [viewModel]
  );

  const handleDelete = useCallback(
    async (item: AudioDownloadItem) => {
      Alert.alert(
        l('audio.delete.title'),
        l('audio.delete.message'),
        [
          { text: lAndroid('cancel'), style: 'cancel' },
          {
            text: l('delete'),
            style: 'destructive',
            onPress: async () => {
              await viewModel.deleteReciterFiles(item.reciter);
            },
          },
        ]
      );
    },
    [viewModel]
  );

  if (state.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.systemGroupedBackground }]}>
        <ActivityIndicator size="large" color={theme.colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemGroupedBackground }]}>
      <FlatList
        data={[
          { type: 'section', title: l('reciters.downloaded'), items: downloadedItems },
          { type: 'section', title: l('reciters.all'), items: notDownloadedItems },
        ]}
        keyExtractor={(item, index) => `section-${index}`}
        renderItem={({ item }) => (
          <AudioDownloadsSection
            title={item.title}
            items={item.items}
            editMode={state.editMode}
            onDownload={handleDownload}
            onCancel={handleCancel}
            onDelete={handleDelete}
            showSubtitle={item.title === l('reciters.downloaded')}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ============================================================================
// AudioDownloadsSection Component
// ============================================================================

interface AudioDownloadsSectionProps {
  title: string;
  items: AudioDownloadItem[];
  editMode: EditMode;
  onDownload: (item: AudioDownloadItem) => Promise<void>;
  onCancel: (item: AudioDownloadItem) => Promise<void>;
  onDelete: (item: AudioDownloadItem) => Promise<void>;
  showSubtitle: boolean;
}

function AudioDownloadsSection({
  title,
  items,
  editMode,
  onDownload,
  onCancel,
  onDelete,
  showSubtitle,
}: AudioDownloadsSectionProps) {
  const theme = useTheme();

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.secondaryLabel }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
        {items.map((item, index) => (
          <React.Fragment key={item.reciter.id}>
            <AudioDownloadRow
              item={item}
              editMode={editMode}
              onDownload={onDownload}
              onCancel={onCancel}
              onDelete={onDelete}
              showSubtitle={showSubtitle}
            />
            {index < items.length - 1 && (
              <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// AudioDownloadRow Component
// ============================================================================

interface AudioDownloadRowProps {
  item: AudioDownloadItem;
  editMode: EditMode;
  onDownload: (item: AudioDownloadItem) => Promise<void>;
  onCancel: (item: AudioDownloadItem) => Promise<void>;
  onDelete: (item: AudioDownloadItem) => Promise<void>;
  showSubtitle: boolean;
}

function AudioDownloadRow({
  item,
  editMode,
  onDownload,
  onCancel,
  onDelete,
  showSubtitle,
}: AudioDownloadRowProps) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (item.progress.type === 'downloading') {
        await onCancel(item);
      } else if (!isDownloaded(item)) {
        await onDownload(item);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(item);
  };

  const renderAccessory = () => {
    if (editMode === 'active') {
      return null;
    }

    if (item.progress.type === 'downloading') {
      const progress = item.progress.progress;
      return (
        <TouchableOpacity onPress={handlePress} style={styles.accessoryButton}>
          <DownloadProgressIndicator progress={progress} />
        </TouchableOpacity>
      );
    }

    if (!isDownloaded(item)) {
      return (
        <TouchableOpacity onPress={handlePress} style={styles.accessoryButton}>
          <Ionicons
            name={NoorSystemImage.Download}
            size={22}
            color={theme.colors.tint}
          />
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={styles.row}>
      {editMode === 'active' && canDelete(item) && (
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="remove-circle" size={24} color={theme.colors.systemRed} />
        </TouchableOpacity>
      )}
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: theme.colors.label }]}>
          {item.reciter.localizedName}
        </Text>
        {showSubtitle && (
          <Text style={[styles.rowSubtitle, { color: theme.colors.secondaryLabel }]}>
            {formatDownloadedSize(item.size)}
          </Text>
        )}
      </View>
      {renderAccessory()}
    </View>
  );
}

// ============================================================================
// DownloadProgressIndicator Component
// ============================================================================

interface DownloadProgressIndicatorProps {
  progress: number;
}

function DownloadProgressIndicator({ progress }: DownloadProgressIndicatorProps) {
  const theme = useTheme();
  const size = 24;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  if (progress < 0.001) {
    // Pending state
    return (
      <View style={[styles.progressContainer, { width: size, height: size }]}>
        <ActivityIndicator size="small" color={theme.colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.progressContainer, { width: size, height: size }]}>
      <View style={styles.progressCircle}>
        {/* Background circle */}
        <View
          style={[
            styles.progressBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: theme.colors.separator,
            },
          ]}
        />
        {/* Progress circle (simplified - using opacity for progress) */}
        <View
          style={[
            styles.progressForeground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: theme.colors.tint,
              opacity: progress,
            },
          ]}
        />
        {/* Stop icon */}
        <Ionicons
          name="stop"
          size={12}
          color={theme.colors.tint}
          style={styles.stopIcon}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    marginHorizontal: 16,
    borderRadius: CORNER_RADIUS,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  deleteButton: {
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
  },
  rowSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  accessoryButton: {
    padding: 8,
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBackground: {
    position: 'absolute',
  },
  progressForeground: {
    position: 'absolute',
  },
  stopIcon: {
    position: 'absolute',
  },
});

