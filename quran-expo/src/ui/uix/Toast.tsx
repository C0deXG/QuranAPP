/**
 * Toast.swift → Toast.tsx
 *
 * Toast notification system with queue, animations, and swipe to dismiss.
 *
 * Quran.com. All rights reserved.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { CORNER_RADIUS } from '../dimensions';

// ============================================================================
// Types
// ============================================================================

/**
 * Toast action button.
 */
export interface ToastAction {
  title: string;
  handler: () => void;
}

/**
 * Toast configuration.
 */
export interface Toast {
  /** Message to display */
  message: string;
  /** Optional action button */
  action?: ToastAction;
  /** Duration in milliseconds (default: 4000) */
  duration?: number;
  /** Bottom offset from safe area (default: 40) */
  bottomOffset?: number;
}

interface ToastWithId extends Toast {
  id: string;
}

// ============================================================================
// Context
// ============================================================================

interface ToastContextValue {
  showToast: (toast: Toast) => void;
  dismissCurrentToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to show toast notifications.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// Toast View
// ============================================================================

interface ToastViewProps {
  message: string;
  action?: ToastAction;
  onDismiss: () => void;
}

function ToastView({ message, action, onDismiss }: ToastViewProps) {
  const theme = useTheme();
  
  return (
    <View style={[styles.toast, { backgroundColor: theme.colors.label + 'CC' }]}>
      <Text style={[styles.toastMessage, { color: theme.colors.systemBackground }]}>
        {message}
      </Text>
      <View style={styles.spacer} />
      {action && (
        <TouchableOpacity
          onPress={() => {
            action.handler();
            onDismiss();
          }}
        >
          <Text style={[styles.toastAction, { color: theme.colors.systemBackground }]}>
            {action.title}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Toast Container
// ============================================================================

interface ToastContainerProps {
  toast: ToastWithId;
  onDismiss: () => void;
}

function ToastContainer({ toast, onDismiss }: ToastContainerProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = toast.bottomOffset ?? 40;
  
  const translateY = useRef(new Animated.Value(200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  const dismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }
    
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, translateY, opacity]);
  
  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > bottomOffset) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;
  
  // Show animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto dismiss
    const duration = toast.duration ?? 4000;
    dismissTimeoutRef.current = setTimeout(() => {
      dismiss();
    }, duration);
    
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          bottom: insets.bottom + bottomOffset,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <ToastView
        message={toast.message}
        action={toast.action}
        onDismiss={dismiss}
      />
    </Animated.View>
  );
}

// ============================================================================
// Toast Provider
// ============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that enables toast notifications.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [queue, setQueue] = useState<ToastWithId[]>([]);
  const [currentToast, setCurrentToast] = useState<ToastWithId | null>(null);
  const isShowingRef = useRef(false);
  
  const displayNextToast = useCallback(() => {
    if (isShowingRef.current) return;
    
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return prevQueue;
      
      isShowingRef.current = true;
      setCurrentToast(prevQueue[0]);
      return prevQueue.slice(1);
    });
  }, []);
  
  const handleDismiss = useCallback(() => {
    isShowingRef.current = false;
    setCurrentToast(null);
    // Use setTimeout to ensure state updates have propagated
    setTimeout(displayNextToast, 100);
  }, [displayNextToast]);
  
  const showToast = useCallback((toast: Toast) => {
    const toastWithId: ToastWithId = {
      ...toast,
      id: `${Date.now()}-${Math.random()}`,
    };
    
    setQueue((prev) => [...prev, toastWithId]);
  }, []);
  
  const dismissCurrentToast = useCallback(() => {
    // Force dismiss - will be handled by ToastContainer
  }, []);
  
  // Trigger display when queue changes and nothing is showing
  useEffect(() => {
    if (!isShowingRef.current && queue.length > 0) {
      displayNextToast();
    }
  }, [queue, displayNextToast]);
  
  const contextValue: ToastContextValue = {
    showToast,
    dismissCurrentToast,
  };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {currentToast && (
        <ToastContainer toast={currentToast} onDismiss={handleDismiss} />
      )}
    </ToastContext.Provider>
  );
}

// ============================================================================
// ToastPresenter
// ============================================================================

/**
 * Static toast presenter for use outside of React components.
 */
export class ToastPresenter {
  private static contextRef: ToastContextValue | null = null;

  static setContext(context: ToastContextValue): void {
    ToastPresenter.contextRef = context;
  }

  static show(toast: Toast): void {
    ToastPresenter.contextRef?.showToast(toast);
  }

  static dismiss(): void {
    ToastPresenter.contextRef?.dismissCurrentToast();
  }
}

// ============================================================================
// Styles
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: CORNER_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  toastMessage: {
    fontSize: 15,
    flex: 1,
  },
  spacer: {
    width: 8,
  },
  toastAction: {
    fontSize: 15,
    fontWeight: '600',
  },
});

