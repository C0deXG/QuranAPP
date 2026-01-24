/**
 * DiagnosticsView.swift → DiagnosticsScreen.tsx
 *
 * Diagnostics screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { l } from '../../../core/localization';
import { useTheme } from '../../../ui/theme';
import {
  DiagnosticsViewModel,
  type DiagnosticsViewState,
} from './diagnostics-view-model';

// ============================================================================
// Types
// ============================================================================

export interface DiagnosticsScreenProps {
  viewModel: DiagnosticsViewModel;
}

// ============================================================================
// DiagnosticsScreen Component
// ============================================================================

export function DiagnosticsScreen({ viewModel }: DiagnosticsScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<DiagnosticsViewState>(viewModel.state);

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

  // Handle toggle
  const handleToggle = useCallback(
    (value: boolean) => {
      viewModel.setEnableDebugLogging(value);
    },
    [viewModel]
  );

  // Handle share logs
  const handleShareLogs = useCallback(() => {
    viewModel.shareLogs();
  }, [viewModel]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}
      contentContainerStyle={styles.content}
    >
      {/* Description */}
      <View style={styles.section}>
        <Text style={[styles.description, { color: theme.colors.secondaryLabel }]}>
          {l('diagnostics.details')}
        </Text>
      </View>

      {/* Debug Logging Toggle */}
      <View
        style={[
          styles.section,
          styles.card,
          { backgroundColor: theme.colors.secondarySystemBackground },
        ]}
      >
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.colors.label }]}>
            {l('diagnostics.enable_debug_logs')}
          </Text>
          <Switch
            value={state.enableDebugLogging}
            onValueChange={handleToggle}
            trackColor={{ false: theme.colors.systemGray3, true: theme.colors.tint }}
          />
        </View>
        <Text style={[styles.toggleFooter, { color: theme.colors.secondaryLabel }]}>
          {l('diagnostics.enable_debug_logs.details')}
        </Text>
      </View>

      {/* Share Logs Button */}
      <View
        style={[
          styles.section,
          styles.card,
          { backgroundColor: theme.colors.secondarySystemBackground },
        ]}
      >
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareLogs}
          disabled={state.isSharing}
        >
          {state.isSharing ? (
            <ActivityIndicator size="small" color={theme.colors.tint} />
          ) : (
            <Text style={[styles.shareButtonText, { color: theme.colors.tint }]}>
              {l('diagnostics.share_app_logs')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 10,
    padding: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 17,
    flex: 1,
    marginRight: 12,
  },
  toggleFooter: {
    fontSize: 13,
    lineHeight: 18,
  },
  shareButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 17,
  },
});

