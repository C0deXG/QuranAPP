/**
 * QuranPaginationView.swift → QuranPaginationView.tsx
 *
 * Pagination view for Quran pages.
 *
 * Quran.com. All rights reserved.
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ListRenderItem,
  I18nManager,
} from 'react-native';
import type { Page } from '../../model/quran-kit';
import type { PagingStrategy } from './paging-strategy';
import { PageSideSeparator, PageMiddleSeparator, QURAN_SEPARATORS_MIDDLE_WIDTH } from './QuranSeparators';
import { useTheme } from '../../ui/theme';
import { CONTENT_DIMENSION } from '../../ui/features/quran';

// ============================================================================
// Types
// ============================================================================

export interface QuranPaginationViewProps {
  /** Paging strategy (single or double page) */
  pagingStrategy: PagingStrategy;
  /** Currently selected pages */
  selection: Page[];
  /** All available pages */
  pages: Page[];
  /** Callback when selection changes */
  onSelectionChange: (pages: Page[]) => void;
  /** Render function for page content */
  renderPage: (page: Page) => React.ReactNode;
}

interface DoublePage {
  first: Page;
  second: Page;
  id: string;
}

// ============================================================================
// QuranPaginationView Component
// ============================================================================

/**
 * Pagination view for Quran pages.
 *
 * 1:1 translation of iOS QuranPaginationView.
 */
export function QuranPaginationView({
  pagingStrategy,
  selection,
  pages,
  onSelectionChange,
  renderPage,
}: QuranPaginationViewProps) {
  const theme = useTheme();

  if (pagingStrategy === 'singlePage') {
    return (
      <QuranSinglePaginationView
        selection={selection[0]}
        pages={pages}
        onSelectionChange={(page) => onSelectionChange([page])}
        renderPage={renderPage}
      />
    );
  } else {
    return (
      <QuranDoublePaginationView
        selection={selection}
        pages={pages}
        onSelectionChange={onSelectionChange}
        renderPage={renderPage}
      />
    );
  }
}

// ============================================================================
// QuranSinglePaginationView Component
// ============================================================================

interface QuranSinglePaginationViewProps {
  selection: Page;
  pages: Page[];
  onSelectionChange: (page: Page) => void;
  renderPage: (page: Page) => React.ReactNode;
}

/**
 * Single page pagination view.
 *
 * 1:1 translation of iOS QuranSinglePaginationView.
 */
function QuranSinglePaginationView({
  selection,
  pages,
  onSelectionChange,
  renderPage,
}: QuranSinglePaginationViewProps) {
  const theme = useTheme();
  const flatListRef = useRef<FlatList<Page>>(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isScrollingRef = useRef(false);

  // Handle dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  // Pages are reversed for RTL display (Quran reads right-to-left)
  const reversedPages = useMemo(() => [...pages].reverse(), [pages]);

  // Calculate the index for the current selection in reversed array
  const getIndexForPage = useCallback(
    (page: Page): number => {
      const index = pages.findIndex((p) => p.pageNumber === page.pageNumber);
      return pages.length - 1 - index;
    },
    [pages]
  );

  // Get page from index in reversed array
  const getPageForIndex = useCallback(
    (index: number): Page => {
      return reversedPages[index];
    },
    [reversedPages]
  );

  // Scroll to selection when it changes
  useEffect(() => {
    if (!isScrollingRef.current && flatListRef.current) {
      const index = getIndexForPage(selection);
      if (index >= 0 && index < reversedPages.length) {
        flatListRef.current.scrollToIndex({ index, animated: true });
      }
    }
  }, [selection, getIndexForPage, reversedPages.length]);

  // Check if page is on the right side (odd page number)
  const isRightSide = useCallback((page: Page): boolean => {
    return page.pageNumber % 2 === 1;
  }, []);

  // Handle scroll end
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrollingRef.current = false;
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      const pageWidth = layoutMeasurement.width;
      const pageIndex = Math.round(contentOffset.x / pageWidth);

      if (pageIndex >= 0 && pageIndex < reversedPages.length) {
        const page = getPageForIndex(pageIndex);
        if (page.pageNumber !== selection.pageNumber) {
          onSelectionChange(page);
        }
      }
    },
    [reversedPages.length, getPageForIndex, selection.pageNumber, onSelectionChange]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true;
  }, []);

  // Render a single page
  const renderItem: ListRenderItem<Page> = useCallback(
    ({ item: page }) => {
      const rightSide = isRightSide(page);

      return (
        <View style={[styles.singlePageContainer, { width: screenWidth }]}>
          {rightSide ? (
            <View style={styles.singlePageRowRightSide}>
              <PageSideSeparator leading={true} />
              <View style={styles.pageContent}>{renderPage(page)}</View>
              <View style={{ width: QURAN_SEPARATORS_MIDDLE_WIDTH / 2 }}>
                <PageMiddleSeparator />
              </View>
            </View>
          ) : (
            <View style={styles.singlePageRowLeftSide}>
              <View style={styles.pageContent}>{renderPage(page)}</View>
              <PageSideSeparator leading={false} />
            </View>
          )}
        </View>
      );
    },
    [screenWidth, isRightSide, renderPage]
  );

  const keyExtractor = useCallback((page: Page) => String(page.pageNumber), []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth]
  );

  const initialScrollIndex = useMemo(() => getIndexForPage(selection), [getIndexForPage, selection]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      <FlatList
        ref={flatListRef}
        data={reversedPages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialScrollIndex}
        removeClippedSubviews={false}
        maxToRenderPerBatch={3}
        windowSize={5}
        accessibilityLabel="pages"
      />
    </View>
  );
}

// ============================================================================
// QuranDoublePaginationView Component
// ============================================================================

interface QuranDoublePaginationViewProps {
  selection: Page[];
  pages: Page[];
  onSelectionChange: (pages: Page[]) => void;
  renderPage: (page: Page) => React.ReactNode;
}

/**
 * Double page pagination view.
 *
 * 1:1 translation of iOS QuranDoublePaginationView.
 */
function QuranDoublePaginationView({
  selection,
  pages,
  onSelectionChange,
  renderPage,
}: QuranDoublePaginationViewProps) {
  const theme = useTheme();
  const flatListRef = useRef<FlatList<DoublePage>>(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isScrollingRef = useRef(false);

  // Handle dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  // Create double pages from pages array
  const doublePages = useMemo((): DoublePage[] => {
    const result: DoublePage[] = [];
    for (let i = 0; i < pages.length; i += 2) {
      if (i + 1 < pages.length) {
        result.push({
          first: pages[i],
          second: pages[i + 1],
          id: `${pages[i].pageNumber}-${pages[i + 1].pageNumber}`,
        });
      }
    }
    return result;
  }, [pages]);

  // Reversed for RTL
  const reversedDoublePages = useMemo(() => [...doublePages].reverse(), [doublePages]);

  // Get index for current selection
  const getIndexForSelection = useCallback(
    (sel: Page[]): number => {
      if (sel.length === 0) return 0;
      const firstPage = sel[0];
      const pageIndex = pages.findIndex((p) => p.pageNumber === firstPage.pageNumber);
      const doublePageIndex = Math.floor(pageIndex / 2);
      return doublePages.length - 1 - doublePageIndex;
    },
    [pages, doublePages.length]
  );

  // Scroll to selection when it changes
  useEffect(() => {
    if (!isScrollingRef.current && flatListRef.current) {
      const index = getIndexForSelection(selection);
      if (index >= 0 && index < reversedDoublePages.length) {
        flatListRef.current.scrollToIndex({ index, animated: true });
      }
    }
  }, [selection, getIndexForSelection, reversedDoublePages.length]);

  // Handle scroll end
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrollingRef.current = false;
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      const pageWidth = layoutMeasurement.width;
      const pageIndex = Math.round(contentOffset.x / pageWidth);

      if (pageIndex >= 0 && pageIndex < reversedDoublePages.length) {
        const doublePage = reversedDoublePages[pageIndex];
        const newSelection = [doublePage.first, doublePage.second];
        if (
          selection.length !== 2 ||
          selection[0].pageNumber !== newSelection[0].pageNumber ||
          selection[1].pageNumber !== newSelection[1].pageNumber
        ) {
          onSelectionChange(newSelection);
        }
      }
    },
    [reversedDoublePages, selection, onSelectionChange]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true;
  }, []);

  // Render a double page
  const renderItem: ListRenderItem<DoublePage> = useCallback(
    ({ item: doublePage }) => {
      return (
        <View style={[styles.doublePageContainer, { width: screenWidth }]}>
          <View style={styles.doublePageRow}>
            <PageSideSeparator leading={true} />
            <View style={styles.pageContent}>{renderPage(doublePage.first)}</View>
            <PageMiddleSeparator />
            <View style={styles.pageContent}>{renderPage(doublePage.second)}</View>
            <PageSideSeparator leading={false} />
          </View>
        </View>
      );
    },
    [screenWidth, renderPage]
  );

  const keyExtractor = useCallback((doublePage: DoublePage) => doublePage.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth]
  );

  const initialScrollIndex = useMemo(
    () => getIndexForSelection(selection),
    [getIndexForSelection, selection]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      <FlatList
        ref={flatListRef}
        data={reversedDoublePages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialScrollIndex}
        removeClippedSubviews={false}
        maxToRenderPerBatch={3}
        windowSize={5}
        accessibilityLabel="pages"
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
  singlePageContainer: {
    flex: 1,
  },
  singlePageRowRightSide: {
    flex: 1,
    flexDirection: 'row',
  },
  singlePageRowLeftSide: {
    flex: 1,
    flexDirection: 'row',
  },
  doublePageContainer: {
    flex: 1,
  },
  doublePageRow: {
    flex: 1,
    flexDirection: 'row',
  },
  pageContent: {
    flex: 1,
  },
});

