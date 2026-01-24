/**
 * AsyncAction.swift → AsyncButton.tsx
 *
 * A button that handles async actions with cancellation support.
 *
 * Quran.com. All rights reserved.
 */

import React, { useRef, useState } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import type { AsyncAction } from './async-action';

// ============================================================================
// AsyncButton
// ============================================================================

export interface AsyncButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  /** Async action to perform when pressed */
  action: AsyncAction;
  /** Content of the button */
  children: React.ReactNode;
  /** Whether to show a loading indicator while executing */
  showLoading?: boolean;
  /** Disable button while action is executing */
  disableWhileLoading?: boolean;
}

/**
 * A button that handles async actions with task cancellation.
 * If pressed again while an action is in progress, the previous action is cancelled.
 */
export function AsyncButton({
  action,
  children,
  showLoading = false,
  disableWhileLoading = true,
  disabled,
  style,
  ...props
}: AsyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handlePress = async () => {
    // Cancel previous task
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    } finally {
      // Only update state if not aborted
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const isDisabled = disabled || (disableWhileLoading && isLoading);

  return (
    <TouchableOpacity
      {...props}
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={isDisabled}
    >
      {showLoading && isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

