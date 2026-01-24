/**
 * WrappingHStack.swift → WrappingHStack.tsx
 *
 * A horizontal stack that wraps items to the next line when they overflow.
 *
 * Quran.com. All rights reserved.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent, ViewStyle } from 'react-native';

// ============================================================================
// Types
// ============================================================================

export type HorizontalAlignment = 'leading' | 'center' | 'trailing';
export type VerticalAlignment = 'top' | 'center' | 'bottom';

export interface WrappingHStackProps {
  /** Child elements to arrange */
  children: React.ReactNode;
  /** Horizontal spacing between items (default: 8) */
  horizontalSpacing?: number;
  /** Vertical spacing between rows (default: 8) */
  verticalSpacing?: number;
  /** Horizontal alignment of items within rows (default: 'leading') */
  horizontalAlignment?: HorizontalAlignment;
  /** Vertical alignment of items within rows (default: 'center') */
  verticalAlignment?: VerticalAlignment;
  /** Additional style for the container */
  style?: ViewStyle;
}

// ============================================================================
// WrappingHStack
// ============================================================================

/**
 * A view that arranges its children in horizontal lines and wraps them
 * to the next line when they exceed the available width.
 */
export function WrappingHStack({
  children,
  horizontalSpacing = 8,
  verticalSpacing = 8,
  horizontalAlignment = 'leading',
  verticalAlignment = 'center',
  style,
}: WrappingHStackProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [childSizes, setChildSizes] = useState<Map<number, { width: number; height: number }>>(
    new Map()
  );

  const childrenArray = React.Children.toArray(children);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  const handleChildLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setChildSizes((prev) => {
      const next = new Map(prev);
      next.set(index, { width, height });
      return next;
    });
  }, []);

  // Calculate rows once we have all sizes
  const rows: { indices: number[]; rowWidth: number; rowHeight: number }[] = [];

  if (containerWidth > 0 && childSizes.size === childrenArray.length) {
    let currentRow: number[] = [];
    let currentX = 0;
    let currentRowHeight = 0;

    childrenArray.forEach((_, index) => {
      const size = childSizes.get(index);
      if (!size) return;

      const spacing = currentRow.length > 0 ? horizontalSpacing : 0;
      const neededWidth = currentX + spacing + size.width;

      if (neededWidth > containerWidth && currentRow.length > 0) {
        // Start new row
        rows.push({
          indices: currentRow,
          rowWidth: currentX,
          rowHeight: currentRowHeight,
        });
        currentRow = [index];
        currentX = size.width;
        currentRowHeight = size.height;
      } else {
        currentRow.push(index);
        currentX = neededWidth;
        currentRowHeight = Math.max(currentRowHeight, size.height);
      }
    });

    if (currentRow.length > 0) {
      rows.push({
        indices: currentRow,
        rowWidth: currentX,
        rowHeight: currentRowHeight,
      });
    }
  }

  // Render measurement layer (hidden) to get child sizes
  const measurementLayer = (
    <View style={styles.measurementLayer} pointerEvents="none">
      {childrenArray.map((child, index) => (
        <View
          key={`measure-${index}`}
          onLayout={(e) => handleChildLayout(index, e)}
          style={styles.measureChild}
        >
          {child}
        </View>
      ))}
    </View>
  );

  // Render actual layout
  const getRowJustifyContent = (): ViewStyle['justifyContent'] => {
    switch (horizontalAlignment) {
      case 'center':
        return 'center';
      case 'trailing':
        return 'flex-end';
      default:
        return 'flex-start';
    }
  };

  const getItemAlignSelf = (): ViewStyle['alignSelf'] => {
    switch (verticalAlignment) {
      case 'top':
        return 'flex-start';
      case 'bottom':
        return 'flex-end';
      default:
        return 'center';
    }
  };

  return (
    <View style={[styles.container, style]} onLayout={handleContainerLayout}>
      {measurementLayer}
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[
            styles.row,
            {
              justifyContent: getRowJustifyContent(),
              marginTop: rowIndex > 0 ? verticalSpacing : 0,
            },
          ]}
        >
          {row.indices.map((childIndex, positionInRow) => (
            <View
              key={`item-${childIndex}`}
              style={[
                {
                  alignSelf: getItemAlignSelf(),
                  marginLeft: positionInRow > 0 ? horizontalSpacing : 0,
                },
              ]}
            >
              {childrenArray[childIndex]}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  measurementLayer: {
    position: 'absolute',
    opacity: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  measureChild: {
    position: 'absolute',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
});

