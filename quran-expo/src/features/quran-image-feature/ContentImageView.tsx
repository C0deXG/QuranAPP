/**
 * ContentImageView.swift → ContentImageView.tsx
 *
 * Component for displaying Quran page images.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../../ui/theme';
import { QuranPageHeader, QuranPageFooter, QuranThemedImage } from '../../ui/features/quran';
import type { AyahNumber, Word, Page } from '../../model/quran-kit';
import type { Rect, WordFrameScale, Point } from '../../model/quran-geometry';
import {
  ContentImageViewModel,
  type ContentImageViewState,
  type ImageDecorations,
} from './content-image-view-model';
import type { PageGeometryActions } from '../quran-content-feature';

// ============================================================================
// Types
// ============================================================================

export interface ContentImageViewProps {
  viewModel: ContentImageViewModel;
}

// ============================================================================
// ContentImageView Component
// ============================================================================

/**
 * Component for displaying Quran page images.
 *
 * 1:1 translation of iOS ContentImageView.
 */
export function ContentImageView({ viewModel }: ContentImageViewProps) {
  const theme = useTheme();
  const [state, setState] = useState<ContentImageViewState>(viewModel.state);
  const scrollViewRef = useRef<ScrollView>(null);
  const imageRef = useRef<View>(null);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Load image page on mount
  useEffect(() => {
    viewModel.loadImagePage();
  }, [viewModel]);

  // Scroll to verse when needed
  useEffect(() => {
    if (state.scrollToVerse && state.imagePage?.wordFrames) {
      const lineFrame = state.imagePage.wordFrames.lineFramesForVerse?.(state.scrollToVerse)?.[0];
      if (lineFrame && scrollViewRef.current) {
        // Calculate scroll position based on the line frame
        const scrollY = lineFrame.minY * state.scale.scaleY + state.scale.yOffset;
        scrollViewRef.current.scrollTo({ y: scrollY, animated: true });
      }
    }
  }, [state.scrollToVerse, state.imagePage, state.scale]);

  // Handle image layout change
  const handleImageLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;

      // Measure global position
      imageRef.current?.measureInWindow((windowX, windowY, windowWidth, windowHeight) => {
        const frame: Rect = {
          x: windowX,
          y: windowY,
          width: windowWidth,
          height: windowHeight,
        };
        viewModel.setImageFrame(frame);

        // Calculate scale based on image dimensions
        if (state.imagePage?.image) {
          const imageWidth = state.imagePage.image.width;
          const imageHeight = state.imagePage.image.height;

          const scale: WordFrameScale = {
            scaleX: width / imageWidth,
            scaleY: height / imageHeight,
            xOffset: x,
            yOffset: y,
          };
          viewModel.setScale(scale);
        }
      });
    },
    [viewModel, state.imagePage]
  );

  // Get decorations
  const decorations = viewModel.decorations;

  // Get page info
  const page = viewModel.page;
  const quarterName = page.quarter?.localizedName ?? '';
  const suraNames = page.suraNames?.() ?? '';
  const pageNumber = String(page.pageNumber);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <QuranPageHeader quarterName={quarterName} suraNames={suraNames} />

        {/* Image */}
        <View
          ref={imageRef}
          style={styles.imageContainer}
          onLayout={handleImageLayout}
        >
          {state.imagePage?.image && (
            <QuranThemedImage
              source={{ uri: state.imagePage.image.uri }}
              style={styles.pageImage}
              resizeMode="contain"
            />
          )}

          {/* Render highlights */}
          <HighlightsOverlay
            decorations={decorations}
            scale={state.scale}
          />
        </View>

        {/* Footer */}
        <QuranPageFooter page={pageNumber} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// HighlightsOverlay Component
// ============================================================================

interface HighlightsOverlayProps {
  decorations: ImageDecorations;
  scale: WordFrameScale;
}

function HighlightsOverlay({ decorations, scale }: HighlightsOverlayProps) {
  const highlightRects: React.ReactNode[] = [];

  // Render word frame highlights
  decorations.highlights.forEach((color, frame) => {
    const scaledRect = {
      x: frame.minX * scale.scaleX + scale.xOffset,
      y: frame.minY * scale.scaleY + scale.yOffset,
      width: (frame.maxX - frame.minX) * scale.scaleX,
      height: (frame.maxY - frame.minY) * scale.scaleY,
    };
    // Slightly expand to overlap adjacent segments and avoid seams
    const padY = 0.75;
    const padX = 0.25;
    const adjustedRect = {
      x: scaledRect.x - padX,
      y: scaledRect.y - padY,
      width: scaledRect.width + padX * 2,
      height: scaledRect.height + padY * 2,
    };

    highlightRects.push(
      <View
        key={`highlight-${frame.word.verse.sura.suraNumber}-${frame.word.verse.ayah}-${frame.word.wordNumber}`}
        style={[
          styles.highlight,
          {
            left: adjustedRect.x,
            top: adjustedRect.y,
            width: adjustedRect.width,
            height: adjustedRect.height,
            backgroundColor: color,
          },
        ]}
      />
    );
  });

  return <View style={styles.highlightsContainer}>{highlightRects}</View>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageImage: {
    width: '100%',
    aspectRatio: 0.65, // Typical Quran page aspect ratio
  },
  highlightsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  highlight: {
    position: 'absolute',
    borderRadius: 0,
  },
});
