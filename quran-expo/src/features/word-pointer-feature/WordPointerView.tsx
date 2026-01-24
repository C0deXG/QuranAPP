/**
 * WordPointerViewController.swift → WordPointerView.tsx
 *
 * Word pointer overlay view.
 *
 * Quran.com. All rights reserved.
 */

import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Text,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../ui/theme';
import { logger } from '../../core/logging';
import type { Point } from '../../model/quran-geometry';
import { WordPointerViewModel, type PanResult } from './word-pointer-view-model';

// ============================================================================
// Types
// ============================================================================

/**
 * Gesture state.
 */
type GestureState =
  | { type: 'began' }
  | { type: 'changed'; translation: Point }
  | { type: 'ended'; velocity: Point };

/**
 * Handle for controlling the word pointer from parent.
 */
export interface WordPointerHandle {
  show(): void;
  hide(completion: () => void): void;
}

// ============================================================================
// Props
// ============================================================================

export interface WordPointerViewProps {
  viewModel: WordPointerViewModel;
  referenceViewRef?: React.RefObject<View>;
}

// ============================================================================
// Constants
// ============================================================================

const POINTER_SIZE = 44;
const ARROW_OFFSET_X = 15;
const ARROW_OFFSET_Y = 15;
const POPOVER_OFFSET_Y = 70;
const MAGNIFYING_GLASS_OFFSET_Y = 40;
const MAGNIFYING_GLASS_SIZE = 100;

// ============================================================================
// WordPointerView Component
// ============================================================================

/**
 * Word pointer overlay view.
 *
 * 1:1 translation of iOS WordPointerViewController.
 */
export const WordPointerView = forwardRef<WordPointerHandle, WordPointerViewProps>(
  ({ viewModel, referenceViewRef }, ref) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    // State
    const [isVisible, setIsVisible] = useState(false);
    const [showMagnifyingGlass, setShowMagnifyingGlass] = useState(false);
    const [popoverText, setPopoverText] = useState<string | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<Point>({ x: 0, y: 0 });
    const [isPopoverUpward, setIsPopoverUpward] = useState(false);
    const [magnifyingGlassPosition, setMagnifyingGlassPosition] = useState<Point>({ x: 0, y: 0 });

    // Animation values
    const pointerPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const panStartPosition = useRef<Point>({ x: 0, y: 0 });
    const currentPointerPosition = useRef<Point>({ x: 0, y: 0 });

    // Task ref for cancellation
    const panningTaskRef = useRef<AbortController | null>(null);

    // Safe area insets for bounds
    const minX = insets.left;
    const maxX = screenWidth - insets.right;

    // Check if looking upward (popover should appear below)
    const lookingUpward = useCallback((point: Point): boolean => {
      return point.y < 130;
    }, []);

    // Move magnifying glass
    const moveMagnifyingGlass = useCallback((point: Point) => {
      const upward = lookingUpward(point);
      setMagnifyingGlassPosition({
        x: point.x,
        y: point.y + (upward ? MAGNIFYING_GLASS_OFFSET_Y : -MAGNIFYING_GLASS_OFFSET_Y),
      });
    }, [lookingUpward]);

    // Show word popover
    const showWordPopover = useCallback((text: string, point: Point) => {
      const upward = lookingUpward(point);
      setPopoverText(text);
      setPopoverPosition({
        x: point.x,
        y: point.y + (upward ? POPOVER_OFFSET_Y : -POPOVER_OFFSET_Y),
      });
      setIsPopoverUpward(upward);
    }, [lookingUpward]);

    // Hide word popover
    const hideWordPopover = useCallback(() => {
      setPopoverText(null);
    }, []);

    // Handle pan gesture
    const handlePan = useCallback(async (state: GestureState) => {
      switch (state.type) {
        case 'began':
          logger.debug('Started pointer dragging');
          viewModel.viewPanBegan();
          panStartPosition.current = { ...currentPointerPosition.current };
          break;

        case 'changed': {
          const newX = panStartPosition.current.x + state.translation.x;
          const newY = panStartPosition.current.y + state.translation.y;

          currentPointerPosition.current = { x: newX, y: newY };
          pointerPosition.setValue({ x: newX, y: newY });

          const arrowPoint: Point = {
            x: newX + POINTER_SIZE - ARROW_OFFSET_X,
            y: newY + ARROW_OFFSET_Y,
          };

          setShowMagnifyingGlass(true);
          moveMagnifyingGlass(arrowPoint);

          // Get word at global point
          const status = await viewModel.viewPanned(arrowPoint);

          switch (status.type) {
            case 'none':
              break;
            case 'hidePopover':
              hideWordPopover();
              break;
            case 'showPopover':
              showWordPopover(status.text, arrowPoint);
              break;
          }
          break;
        }

        case 'ended': {
          logger.debug('Ended pointer dragging');
          setShowMagnifyingGlass(false);
          hideWordPopover();
          viewModel.unhighlightWord();

          const currentX = currentPointerPosition.current.x;
          const currentY = currentPointerPosition.current.y;

          // Determine if going left or right
          const goLeft: boolean =
            Math.abs(state.velocity.x) > 100
              ? state.velocity.x < 0
              : currentX + POINTER_SIZE / 2 < screenWidth / 2;

          // Calculate final position
          const finalY = Math.max(
            10,
            Math.min(screenHeight - POINTER_SIZE, state.velocity.y * 0.3 + currentY)
          );
          const finalX = goLeft ? minX : maxX - POINTER_SIZE;

          // Calculate spring velocity
          const deltaX = finalX - currentX;
          const deltaY = finalY - currentY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const springVelocity = distance > 0 ? Math.abs(state.velocity.x) / distance : 0;

          currentPointerPosition.current = { x: finalX, y: finalY };

          // Animate to final position
          Animated.spring(pointerPosition, {
            toValue: { x: finalX, y: finalY },
            velocity: springVelocity,
            damping: 0.7,
            stiffness: 100,
            useNativeDriver: false,
          }).start();
          break;
        }
      }
    }, [viewModel, pointerPosition, moveMagnifyingGlass, showWordPopover, hideWordPopover, minX, maxX, screenWidth, screenHeight]);

    // Pan responder
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          panningTaskRef.current?.abort();
          panningTaskRef.current = new AbortController();
          handlePan({ type: 'began' });
        },
        onPanResponderMove: (_, gestureState) => {
          handlePan({
            type: 'changed',
            translation: { x: gestureState.dx, y: gestureState.dy },
          });
        },
        onPanResponderRelease: (_, gestureState) => {
          handlePan({
            type: 'ended',
            velocity: { x: gestureState.vx * 1000, y: gestureState.vy * 1000 },
          });
        },
        onPanResponderTerminate: (_, gestureState) => {
          handlePan({
            type: 'ended',
            velocity: { x: gestureState.vx * 1000, y: gestureState.vy * 1000 },
          });
        },
      })
    ).current;

    // Animate in
    const animateIn = useCallback(() => {
      setIsVisible(true);

      // Initial position (bottom center)
      const initialX = screenWidth / 2;
      const initialY = screenHeight;
      currentPointerPosition.current = { x: initialX, y: initialY };
      pointerPosition.setValue({ x: initialX, y: initialY });

      // Final position (top left)
      const finalX = minX;
      const finalY = screenHeight / 4;
      currentPointerPosition.current = { x: finalX, y: finalY };

      Animated.spring(pointerPosition, {
        toValue: { x: finalX, y: finalY },
        damping: 0.7,
        stiffness: 100,
        useNativeDriver: false,
      }).start();
    }, [pointerPosition, screenWidth, screenHeight, minX]);

    // Animate out
    const animateOut = useCallback((completion: () => void) => {
      const finalX = screenWidth / 2;
      const finalY = screenHeight + 200;

      Animated.spring(pointerPosition, {
        toValue: { x: finalX, y: finalY },
        damping: 0.7,
        stiffness: 100,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setIsVisible(false);
          completion();
        }
      });
    }, [pointerPosition, screenWidth, screenHeight]);

    // Expose handle to parent
    useImperativeHandle(ref, () => ({
      show: animateIn,
      hide: animateOut,
    }), [animateIn, animateOut]);

    if (!isVisible) {
      return null;
    }

    return (
      <View style={styles.container} pointerEvents="box-none">
        {/* Pointer */}
        <Animated.View
          style={[
            styles.pointer,
            {
              transform: [
                { translateX: pointerPosition.x },
                { translateY: pointerPosition.y },
              ],
              opacity: showMagnifyingGlass ? 0 : 1,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.pointerIcon, { backgroundColor: theme.colors.tint }]}>
            <Text style={styles.pointerArrow}>↗</Text>
          </View>
        </Animated.View>

        {/* Magnifying Glass */}
        {showMagnifyingGlass && (
          <View
            style={[
              styles.magnifyingGlass,
              {
                left: magnifyingGlassPosition.x - MAGNIFYING_GLASS_SIZE / 2,
                top: magnifyingGlassPosition.y - MAGNIFYING_GLASS_SIZE / 2,
                borderColor: theme.colors.separator,
              },
            ]}
          >
            <View style={styles.magnifyingGlassContent}>
              {/* In iOS, this shows a magnified view. For RN, we'll show a simple indicator */}
              <Text style={[styles.magnifyingGlassText, { color: theme.colors.label }]}>🔍</Text>
            </View>
          </View>
        )}

        {/* Word Popover */}
        {popoverText && (
          <View
            style={[
              styles.popover,
              {
                left: popoverPosition.x - 75,
                top: isPopoverUpward ? popoverPosition.y : popoverPosition.y - 50,
                backgroundColor: theme.colors.secondarySystemBackground,
              },
            ]}
          >
            <Text style={[styles.popoverText, { color: theme.colors.label }]}>
              {popoverText}
            </Text>
            {/* Arrow */}
            <View
              style={[
                styles.popoverArrow,
                isPopoverUpward ? styles.popoverArrowUp : styles.popoverArrowDown,
                { borderBottomColor: isPopoverUpward ? theme.colors.secondarySystemBackground : 'transparent' },
                { borderTopColor: !isPopoverUpward ? theme.colors.secondarySystemBackground : 'transparent' },
              ]}
            />
          </View>
        )}
      </View>
    );
  }
);

WordPointerView.displayName = 'WordPointerView';

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  pointer: {
    position: 'absolute',
    width: POINTER_SIZE,
    height: POINTER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#666',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.6,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pointerArrow: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  magnifyingGlass: {
    position: 'absolute',
    width: MAGNIFYING_GLASS_SIZE,
    height: MAGNIFYING_GLASS_SIZE,
    borderRadius: MAGNIFYING_GLASS_SIZE / 2,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  magnifyingGlassContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  magnifyingGlassText: {
    fontSize: 40,
  },
  popover: {
    position: 'absolute',
    minWidth: 150,
    maxWidth: 250,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  popoverText: {
    fontSize: 16,
    textAlign: 'center',
  },
  popoverArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
  },
  popoverArrowUp: {
    bottom: -10,
    borderTopWidth: 10,
  },
  popoverArrowDown: {
    top: -10,
    borderBottomWidth: 10,
  },
});

