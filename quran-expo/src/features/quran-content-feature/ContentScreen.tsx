/**
 * ContentViewController.swift + PagesView.swift → ContentScreen.tsx
 *
 * Content screen component for displaying Quran pages.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  GestureResponderEvent,
} from 'react-native';
import { useTheme } from '../../ui/theme';
import type { Page, AyahNumber, Word } from '../../model/quran-kit';
import type { Point } from '../../model/quran-geometry';
import { TwoPagesUtils } from '../../domain/quran-text-kit';
import {
  ContentViewModel,
  type ContentViewState,
  type PagingStrategy,
  type PageGeometryActions,
} from './content-view-model';

// ============================================================================
// Types
// ============================================================================

export interface ContentScreenProps {
  viewModel: ContentViewModel;
  /** Render function for Arabic page content */
  renderArabicPage?: (page: Page) => React.ReactNode;
  /** Render function for Translation page content */
  renderTranslationPage?: (page: Page) => React.ReactNode;
}

// ============================================================================
// ContentScreen Component
// ============================================================================

/**
 * Content screen for displaying Quran pages.
 *
 * 1:1 translation of iOS ContentViewController + PagesView.
 */
export function ContentScreen({
  viewModel,
  renderArabicPage,
  renderTranslationPage,
}: ContentScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<ContentViewState>(viewModel.state);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const flatListRef = useRef<FlatList>(null);
  const longPressStartRef = useRef<{ point: Point; verse: AyahNumber | null } | null>(null);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Listen to dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  // Determine paging strategy
  const pagingStrategy = useCallback((): PagingStrategy => {
    // If portrait
    if (screenDimensions.height > screenDimensions.width) {
      return 'singlePage';
    }

    if (!TwoPagesUtils.hasEnoughHorizontalSpace()) {
      return 'singlePage';
    }

    return viewModel.pagingStrategy;
  }, [screenDimensions, viewModel.pagingStrategy]);

  // Get verse at point from geometry actions
  const getVerseAtPoint = useCallback(
    (point: Point): AyahNumber | null => {
      for (const action of state.geometryActions) {
        const verse = action.verse(point);
        if (verse) {
          return verse;
        }
      }
      return null;
    },
    [state.geometryActions]
  );

  // Get word at point from geometry actions
  const getWordAtPoint = useCallback(
    (point: Point): Word | null => {
      for (const action of state.geometryActions) {
        const word = action.word(point);
        if (word) {
          return word;
        }
      }
      return null;
    },
    [state.geometryActions]
  );

  // Handle scroll begin
  const handleScrollBeginDrag = useCallback(() => {
    viewModel.listener?.userWillBeginDragScroll();
  }, [viewModel.listener]);

  // Handle page change
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      const pageWidth = layoutMeasurement.width;
      const pageIndex = Math.round(contentOffset.x / pageWidth);

      // RTL: Quran pages are displayed right-to-left
      const totalPages = viewModel.deps.quran.pages.length;
      const actualPageIndex = totalPages - 1 - pageIndex;

      const page = viewModel.deps.quran.pages[actualPageIndex];
      if (page) {
        viewModel.setVisiblePages([page]);
      }
    },
    [viewModel]
  );

  // Handle long press start
  const handleLongPressStart = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY, pageX, pageY } = event.nativeEvent;
      const point: Point = { x: pageX, y: pageY };
      const verse = getVerseAtPoint(point);

      if (verse) {
        longPressStartRef.current = { point, verse };
        viewModel.onViewLongPressStarted(point, verse);
      }
    },
    [getVerseAtPoint, viewModel]
  );

  // Handle long press move
  const handleLongPressMove = useCallback(
    (event: GestureResponderEvent) => {
      if (!longPressStartRef.current) return;

      const { pageX, pageY } = event.nativeEvent;
      const point: Point = { x: pageX, y: pageY };
      const verse = getVerseAtPoint(point);

      if (verse) {
        viewModel.onViewLongPressChanged(point, verse);
      }
    },
    [getVerseAtPoint, viewModel]
  );

  // Handle long press end
  const handleLongPressEnd = useCallback(() => {
    if (longPressStartRef.current) {
      viewModel.onViewLongPressEnded();
      longPressStartRef.current = null;
    }
  }, [viewModel]);

  // Handle long press cancel
  const handleLongPressCancel = useCallback(() => {
    if (longPressStartRef.current) {
      viewModel.onViewLongPressCancelled();
      longPressStartRef.current = null;
    }
  }, [viewModel]);

  // Render page item
  const renderPageItem = useCallback(
    ({ item: page }: { item: Page }) => {
      const isDoublePage = pagingStrategy() === 'doublePage';
      const pageWidth = isDoublePage
        ? screenDimensions.width / 2
        : screenDimensions.width;

      return (
        <View style={[styles.pageContainer, { width: pageWidth }]}>
          {state.quranMode === 'arabic'
            ? renderArabicPage?.(page)
            : renderTranslationPage?.(page)}
        </View>
      );
    },
    [
      pagingStrategy,
      screenDimensions.width,
      state.quranMode,
      renderArabicPage,
      renderTranslationPage,
    ]
  );

  // Calculate initial scroll index (RTL)
  const getInitialScrollIndex = useCallback(() => {
    const initialPage = state.visiblePages[0];
    if (!initialPage) return 0;

    const totalPages = viewModel.deps.quran.pages.length;
    const pageIndex = viewModel.deps.quran.pages.findIndex(
      (p) => p.pageNumber === initialPage.pageNumber
    );

    // RTL: reverse the index
    return totalPages - 1 - pageIndex;
  }, [state.visiblePages, viewModel.deps.quran.pages]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleLongPressStart}
      onResponderMove={handleLongPressMove}
      onResponderRelease={handleLongPressEnd}
      onResponderTerminate={handleLongPressCancel}
    >
      <FlatList
        ref={flatListRef}
        data={[...viewModel.deps.quran.pages].reverse()} // RTL
        renderItem={renderPageItem}
        keyExtractor={(page) => String(page.pageNumber)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        inverted={false} // Already reversed data for RTL
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        initialScrollIndex={getInitialScrollIndex()}
        getItemLayout={(_, index) => ({
          length: screenDimensions.width,
          offset: screenDimensions.width * index,
          index,
        })}
        // Re-render when mode changes
        extraData={state.quranMode}
      />
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
  pageContainer: {
    flex: 1,
  },
});

