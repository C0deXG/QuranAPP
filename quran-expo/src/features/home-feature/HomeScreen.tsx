/**
 * HomeView.swift + HomeViewController.swift → HomeScreen.tsx
 *
 * Home screen component showing suras/juzs and last pages.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l, lFormat } from '../../core/localization';
import { NumberFormatter } from '../../core/localization';
import { useTheme } from '../../ui/theme';
import { NoorListItem } from '../../ui/components';
import { NoorSystemImage } from '../../ui/images';
import { timeAgo } from '../../ui/formatters';
import type { Sura, Juz, Quarter } from '../../model/quran-kit';
import type { LastPage } from '../../model/quran-annotations';
import type { QuarterItem } from './quarter-item';
import { getQuarterItemId } from './quarter-item';
import {
  HomeViewModel,
  HomeViewType,
  SurahSortOrder,
  type HomeViewState,
} from './home-view-model';

// ============================================================================
// Types
// ============================================================================

export interface HomeScreenProps {
  viewModel: HomeViewModel;
  onOpenReadingSelector: () => void;
}

interface SectionData<T> {
  title: string;
  data: T[];
}

// ============================================================================
// HomeScreen Component
// ============================================================================

export function HomeScreen({ viewModel, onOpenReadingSelector }: HomeScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<HomeViewState>(viewModel.state);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    viewModel.start();

    return () => {
      viewModel.removeListener(setState);
      viewModel.cleanup();
    };
  }, [viewModel]);

  // Handle segment change
  const handleSegmentChange = useCallback(
    (type: HomeViewType) => {
      viewModel.setType(type);
    },
    [viewModel]
  );

  // Handle sort toggle
  const handleToggleSort = useCallback(() => {
    viewModel.toggleSurahSortOrder();
  }, [viewModel]);

  // Handle navigation
  const handleSelectLastPage = useCallback(
    (lastPage: LastPage) => {
      viewModel.navigateTo(lastPage.page);
    },
    [viewModel]
  );

  const handleSelectSura = useCallback(
    (sura: Sura) => {
      viewModel.navigateToSuraItem(sura);
    },
    [viewModel]
  );

  const handleSelectQuarter = useCallback(
    (item: QuarterItem) => {
      viewModel.navigateToQuarterItem(item);
    },
    [viewModel]
  );

  // Prepare sections based on view type
  const sections = useMemo(() => {
    const result: SectionData<any>[] = [];

    // Last pages section
    if (state.lastPages.length > 0) {
      result.push({
        title: l('recent_pages'),
        data: state.lastPages,
      });
    }

    // Suras or Quarters sections grouped by Juz
    if (state.type === HomeViewType.suras) {
      const surasByJuz = groupByJuz(state.suras, (s) => s.page.startJuz);
      const sortedJuzs = getSortedJuzs(surasByJuz, state.surahSortOrder);

      for (const juz of sortedJuzs) {
        const items = sortItemsBySortOrder(surasByJuz.get(juz) ?? [], state.surahSortOrder, 'sura');
        result.push({
          title: juz.localizedName,
          data: items.map((s) => ({ type: 'sura', item: s })),
        });
      }
    } else {
      const quartersByJuz = groupByJuz(state.quarters, (q) => q.quarter.juz);
      const sortedJuzs = getSortedJuzs(quartersByJuz, state.surahSortOrder);

      for (const juz of sortedJuzs) {
        const items = sortItemsBySortOrder(quartersByJuz.get(juz) ?? [], state.surahSortOrder, 'quarter');
        result.push({
          title: juz.localizedName,
          data: items.map((q) => ({ type: 'quarter', item: q })),
        });
      }
    }

    return result;
  }, [state.lastPages, state.suras, state.quarters, state.type, state.surahSortOrder]);

  // Render functions
  const renderLastPageItem = useCallback(
    (lastPage: LastPage) => {
      const ayah = lastPage.page.firstVerse;
      const numberFormatter = NumberFormatter.shared;

      return (
        <NoorListItem
          image={{ name: NoorSystemImage.LastPage, color: theme.colors.secondaryLabel }}
          title={`${ayah.sura.localizedName()} ${ayah.sura.arabicSuraName}`}
          subtitle={{ text: timeAgo(lastPage.createdOn), location: 'bottom' }}
          accessory={{ type: 'text', text: numberFormatter.format(lastPage.page.pageNumber) }}
          onPress={() => handleSelectLastPage(lastPage)}
        />
      );
    },
    [theme, handleSelectLastPage]
  );

  const renderSuraItem = useCallback(
    (sura: Sura) => {
      const ayahsString = lFormat('verses', sura.numberOfAyahs);
      const suraType = sura.isMakki ? l('makki') : l('madani');
      const numberFormatter = NumberFormatter.shared;

      return (
        <NoorListItem
          title={`${sura.localizedName(true)} ${sura.arabicSuraName}`}
          subtitle={{ text: `${suraType} - ${ayahsString}`, location: 'bottom' }}
          accessory={{ type: 'text', text: numberFormatter.format(sura.page.pageNumber) }}
          onPress={() => handleSelectSura(sura)}
        />
      );
    },
    [handleSelectSura]
  );

  const renderQuarterItem = useCallback(
    (item: QuarterItem) => {
      const quarter = item.quarter;
      const ayah = quarter.firstVerse;
      const page = ayah.page;
      const numberFormatter = NumberFormatter.shared;

      return (
        <NoorListItem
          title={`${quarter.localizedName} - ${ayah.localizedName} ${ayah.sura.arabicSuraName}`}
          rightSubtitle={item.ayahText}
          accessory={{ type: 'text', text: numberFormatter.format(page.pageNumber) }}
          onPress={() => handleSelectQuarter(item)}
        />
      );
    },
    [handleSelectQuarter]
  );

  const renderItem = useCallback(
    ({ item, section }: { item: any; section: SectionData<any> }) => {
      // Check if this is a last page
      if (section.title === l('recent_pages')) {
        return renderLastPageItem(item);
      }

      // Check if this is a sura or quarter wrapper
      if (item.type === 'sura') {
        return renderSuraItem(item.item);
      } else if (item.type === 'quarter') {
        return renderQuarterItem(item.item);
      }

      return null;
    },
    [renderLastPageItem, renderSuraItem, renderQuarterItem]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData<any> }) => (
      <View style={[styles.sectionHeader, { backgroundColor: theme.colors.secondarySystemBackground }]}>
        <Text style={[styles.sectionHeaderText, { color: theme.colors.secondaryLabel }]}>
          {section.title}
        </Text>
      </View>
    ),
    [theme]
  );

  const keyExtractor = useCallback((item: any, index: number) => {
    if (item.page) {
      // LastPage
      return `lastpage-${item.page.pageNumber}`;
    } else if (item.type === 'sura') {
      return `sura-${item.item.suraNumber}`;
    } else if (item.type === 'quarter') {
      return `quarter-${getQuarterItemId(item.item)}`;
    }
    return `item-${index}`;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        {/* Sort Button */}
        <TouchableOpacity onPress={handleToggleSort} style={styles.headerButton}>
          <Ionicons
            name="swap-vertical"
            size={24}
            color={theme.colors.tint}
          />
        </TouchableOpacity>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segment,
              state.type === HomeViewType.suras && { backgroundColor: theme.colors.tint },
            ]}
            onPress={() => handleSegmentChange(HomeViewType.suras)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: state.type === HomeViewType.suras ? '#fff' : theme.colors.label },
              ]}
            >
              {l('quran_sura')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segment,
              state.type === HomeViewType.juzs && { backgroundColor: theme.colors.tint },
            ]}
            onPress={() => handleSegmentChange(HomeViewType.juzs)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: state.type === HomeViewType.juzs ? '#fff' : theme.colors.label },
              ]}
            >
              {l('quran_juz2')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reading Selector Button */}
        <TouchableOpacity onPress={onOpenReadingSelector} style={styles.headerButton}>
          <Ionicons
            name="library"
            size={24}
            color={theme.colors.tint}
          />
        </TouchableOpacity>
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function groupByJuz<T>(items: T[], getJuz: (item: T) => Juz): Map<Juz, T[]> {
  const result = new Map<Juz, T[]>();
  for (const item of items) {
    const juz = getJuz(item);
    if (!result.has(juz)) {
      result.set(juz, []);
    }
    result.get(juz)!.push(item);
  }
  return result;
}

function getSortedJuzs<T>(itemsByJuz: Map<Juz, T[]>, sortOrder: SurahSortOrder): Juz[] {
  const juzs = Array.from(itemsByJuz.keys());
  return juzs.sort((a, b) => sortOrder * (a.juzNumber - b.juzNumber));
}

function sortItemsBySortOrder<T>(items: T[], sortOrder: SurahSortOrder, type: 'sura' | 'quarter'): T[] {
  return [...items].sort((a, b) => {
    if (type === 'sura') {
      return sortOrder * ((a as any).suraNumber - (b as any).suraNumber);
    } else {
      return sortOrder * ((a as any).quarter.quarterNumber - (b as any).quarter.quarterNumber);
    }
  });
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    padding: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

