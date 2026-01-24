/**
 * Home Tab Screen
 *
 * Main home screen showing Sura/Juz list grouped by Juz sections.
 * 1:1 translation of iOS HomeView.
 *
 * Quran.com. All rights reserved.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SectionList, 
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/ui/theme';
import { l, lFormat } from '@/src/core/localization';
import { Quran, type Sura, type Juz } from '@/src/model/quran-kit';

// View type: Suras or Juzs
enum HomeViewType {
  suras = 0,
  juzs = 1,
}

// Sort order
enum SurahSortOrder {
  ascending = 1,
  descending = -1,
}

interface SectionData {
  title: string;
  juzNumber: number;
  data: Sura[];
}

/**
 * Sura list item component (like iOS NoorListItem)
 */
function SuraItem({ sura, onPress }: { sura: Sura; onPress: () => void }) {
  const theme = useTheme();
  const ayahsString = `${sura.numberOfAyahs} ${l('verses')}`;
  const suraType = sura.isMakki ? l('makki') : l('madani');

  return (
    <Pressable 
      style={[styles.suraItem, { backgroundColor: theme.colors.systemBackground }]}
      onPress={onPress}
      android_ripple={{ color: theme.colors.separator }}
    >
      <View style={[styles.suraNumber, { backgroundColor: theme.colors.secondarySystemBackground }]}>
        <Text style={[styles.numberText, { color: theme.colors.secondaryLabel }]}>
          {sura.suraNumber}
        </Text>
      </View>
      <View style={styles.suraInfo}>
        <View style={styles.suraNameRow}>
          <Text style={[styles.suraName, { color: theme.colors.label }]}>
            {sura.localizedName(true)}
          </Text>
          <Text style={[styles.arabicName, { color: theme.colors.secondaryLabel }]}>
            {sura.arabicSuraName}
          </Text>
        </View>
        <Text style={[styles.suraDetails, { color: theme.colors.secondaryLabel }]}>
          {suraType} · {ayahsString}
        </Text>
      </View>
      <Text style={[styles.pageNumber, { color: theme.colors.tertiaryLabel }]}>
        {sura.page.pageNumber}
      </Text>
    </Pressable>
  );
}

/**
 * Section header component
 */
function SectionHeader({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.secondarySystemBackground }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.secondaryLabel }]}>
        {title}
      </Text>
    </View>
  );
}

/**
 * Home tab component.
 * 1:1 translation of iOS HomeView with Juz sections.
 */
export default function HomeTab() {
  const router = useRouter();
  const theme = useTheme();
  const quran = Quran.hafpiPageQuran;
  
  const [viewType, setViewType] = useState(HomeViewType.suras);
  const [sortOrder, setSortOrder] = useState(SurahSortOrder.ascending);

  // Handle sura press
  const handleSuraPress = useCallback((suraNumber: number) => {
    console.log('Navigating to Surah:', suraNumber);
    router.push({
      pathname: '/quran' as any,
      params: { sura: String(suraNumber) },
    });
  }, [router]);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === SurahSortOrder.ascending ? SurahSortOrder.descending : SurahSortOrder.ascending);
  }, []);

  // Group suras by Juz (like iOS sectionsView)
  const sections = useMemo((): SectionData[] => {
    // Group suras by their starting Juz
    const surasByJuz = new Map<number, Sura[]>();
    
    for (const sura of quran.suras) {
      const juzNumber = sura.page.startJuz?.juzNumber || 1;
      if (!surasByJuz.has(juzNumber)) {
        surasByJuz.set(juzNumber, []);
      }
      surasByJuz.get(juzNumber)!.push(sura);
    }

    // Get sorted juz numbers
    const juzNumbers = Array.from(surasByJuz.keys()).sort((a, b) => sortOrder * (a - b));

    // Create sections
    return juzNumbers.map(juzNumber => {
      const suras = surasByJuz.get(juzNumber) || [];
      // Sort suras within the section
      const sortedSuras = [...suras].sort((a, b) => sortOrder * (a.suraNumber - b.suraNumber));
      
      return {
        title: `${l('quran_juz2')} ${juzNumber}`,
        juzNumber,
        data: sortedSuras,
      };
    });
  }, [quran.suras, sortOrder]);

  // Render sura item
  const renderItem = useCallback(({ item }: { item: Sura }) => {
    return <SuraItem sura={item} onPress={() => handleSuraPress(item.suraNumber)} />;
  }, [handleSuraPress]);

  // Render section header
  const renderSectionHeader = useCallback(({ section }: { section: SectionData }) => {
    return <SectionHeader title={section.title} />;
  }, []);

  // Key extractor
  const keyExtractor = useCallback((item: Sura) => `sura-${item.suraNumber}`, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      {/* Header with controls */}
      <View style={[styles.header, { 
        backgroundColor: theme.colors.systemBackground,
        borderBottomColor: theme.colors.separator 
      }]}>
        {/* Sort button */}
        <TouchableOpacity onPress={toggleSortOrder} style={styles.headerButton}>
          <Ionicons 
            name={sortOrder === SurahSortOrder.ascending ? "arrow-down" : "arrow-up"} 
            size={22} 
            color={theme.colors.tint} 
          />
        </TouchableOpacity>

        {/* Segmented control */}
        <View style={[styles.segmentedControl, { backgroundColor: theme.colors.secondarySystemBackground }]}>
          <TouchableOpacity
            style={[
              styles.segment,
              viewType === HomeViewType.suras && { backgroundColor: theme.colors.tint },
            ]}
            onPress={() => setViewType(HomeViewType.suras)}
          >
            <Text style={[
              styles.segmentText,
              { color: viewType === HomeViewType.suras ? '#fff' : theme.colors.label },
            ]}>
              {l('quran_sura')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segment,
              viewType === HomeViewType.juzs && { backgroundColor: theme.colors.tint },
            ]}
            onPress={() => setViewType(HomeViewType.juzs)}
          >
            <Text style={[
              styles.segmentText,
              { color: viewType === HomeViewType.juzs ? '#fff' : theme.colors.label },
            ]}>
              {l('quran_juz2')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mushaf selector button */}
        <TouchableOpacity 
          onPress={() => router.push('/reading-selector' as any)} 
          style={styles.headerButton}
        >
          <Ionicons name="library-outline" size={22} color={theme.colors.tint} />
        </TouchableOpacity>
      </View>

      {/* Section List */}
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
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
    padding: 2,
  },
  segment: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
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
  suraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suraNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  suraInfo: {
    flex: 1,
  },
  suraNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  suraName: {
    fontSize: 17,
    fontWeight: '500',
  },
  arabicName: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'System',
  },
  suraDetails: {
    fontSize: 13,
  },
  pageNumber: {
    fontSize: 14,
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
});
