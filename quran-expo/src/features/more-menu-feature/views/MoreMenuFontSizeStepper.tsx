/**
 * FontSizeStepper.swift → MoreMenuFontSizeStepper.tsx
 *
 * Font size stepper component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { l } from '../../../core/localization';
import { useTheme } from '../../../ui/theme';
import { CORNER_RADIUS } from '../../../ui/dimensions';
import { FontSize, allFontSizes } from '../../../model/quran-text';

// ============================================================================
// Types
// ============================================================================

interface MoreMenuFontSizeStepperProps {
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

// ============================================================================
// Constants
// ============================================================================

// Font sizes from largest to smallest for display
const FONT_SIZE_RANGE: FontSize[] = [...allFontSizes].reverse();

// ============================================================================
// MoreMenuFontSizeStepper Component
// ============================================================================

export function MoreMenuFontSizeStepper({
  fontSize,
  onFontSizeChange,
}: MoreMenuFontSizeStepperProps) {
  const theme = useTheme();
  const [showDots, setShowDots] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentIndex = FONT_SIZE_RANGE.indexOf(fontSize);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const showDotsTemporarily = () => {
    setShowDots(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowDots(false);
      hideTimerRef.current = null;
    }, 2000);
  };

  const handleDecrease = () => {
    if (currentIndex > 0) {
      onFontSizeChange(FONT_SIZE_RANGE[currentIndex - 1]);
      showDotsTemporarily();
    }
  };

  const handleIncrease = () => {
    if (currentIndex < FONT_SIZE_RANGE.length - 1) {
      onFontSizeChange(FONT_SIZE_RANGE[currentIndex + 1]);
      showDotsTemporarily();
    }
  };

  const canDecrease = currentIndex > 0;
  const canIncrease = currentIndex < FONT_SIZE_RANGE.length - 1;

  return (
    <View style={styles.container}>
      <View style={[styles.stepperContainer, { backgroundColor: theme.colors.systemGray5 }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleDecrease}
          disabled={!canDecrease}
        >
          <Text
            style={[
              styles.buttonText,
              styles.smallText,
              { color: canDecrease ? theme.colors.label : theme.colors.systemGray3 },
            ]}
          >
            {l('menu.fontSizeLetter')}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />

        <TouchableOpacity
          style={styles.button}
          onPress={handleIncrease}
          disabled={!canIncrease}
        >
          <Text
            style={[
              styles.buttonText,
              styles.largeText,
              { color: canIncrease ? theme.colors.label : theme.colors.systemGray3 },
            ]}
          >
            {l('menu.fontSizeLetter')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dots indicator */}
      {showDots && (
        <View style={styles.dotsContainer}>
          {FONT_SIZE_RANGE.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index <= currentIndex ? theme.colors.label : theme.colors.systemGray5,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    borderRadius: CORNER_RADIUS,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '500',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 20,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

