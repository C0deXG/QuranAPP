/**
 * AdvancedAudioOptionsView.swift + AdvancedAudioVersesViewController.swift → AdvancedAudioOptionsScreen.tsx
 *
 * Advanced audio options screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SectionList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l, lAndroid } from '../../core/localization';
import type { Runs } from '../../core/queue-player';
import { useTheme } from '../../ui/theme';
import { Dimensions, CORNER_RADIUS } from '../../ui/dimensions';
import { NoorSystemImage } from '../../ui/images';
import { ActiveRoundedButton, DisclosureIndicator } from '../../ui/components';
import type { AyahNumber, Sura } from '../../model/quran-kit';
import {
  AdvancedAudioOptionsViewModel,
  type AdvancedAudioOptionsViewState,
} from './advanced-audio-options-view-model';
import { sortedRuns, getRunsLocalizedDescription, runsEqual, getRunsKey } from './runs-localization';

// ============================================================================
// Types
// ============================================================================

export interface AdvancedAudioOptionsScreenProps {
  viewModel: AdvancedAudioOptionsViewModel;
  onDismiss?: () => void;
}

// ============================================================================
// AdvancedAudioOptionsScreen Component
// ============================================================================

export function AdvancedAudioOptionsScreen({
  viewModel,
  onDismiss,
}: AdvancedAudioOptionsScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<AdvancedAudioOptionsViewState>(viewModel.state);
  const [showFromVersePicker, setShowFromVersePicker] = useState(false);
  const [showToVersePicker, setShowToVersePicker] = useState(false);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);

    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  const handleDismiss = useCallback(() => {
    viewModel.dismiss();
    onDismiss?.();
  }, [viewModel, onDismiss]);

  const handlePlay = useCallback(() => {
    viewModel.play();
  }, [viewModel]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemGroupedBackground }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        <TouchableOpacity onPress={handleDismiss} style={styles.headerButton}>
          <Text style={[styles.cancelButtonText, { color: theme.colors.tint }]}>
            {lAndroid('cancel')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.label }]}>
          {l('audio.advanced-options')}
        </Text>

        <TouchableOpacity onPress={handlePlay} style={styles.headerButton}>
          <Ionicons name={NoorSystemImage.Play} size={24} color={theme.colors.tint} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Reciter Section */}
        <SectionContainer>
          <TouchableOpacity
            style={[styles.listItem, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}
            onPress={() => viewModel.presentReciterList()}
          >
            <Text style={[styles.listItemTitle, { color: theme.colors.label }]}>
              {state.reciter.localizedName}
            </Text>
            <DisclosureIndicator />
          </TouchableOpacity>
        </SectionContainer>

        {/* Quick Adjust Section */}
        <SectionContainer title={l('audio.adjust-end-verse-to-the-end.label')}>
          <View style={[styles.buttonRow, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
            <ActiveRoundedButton
              label={lAndroid('quran_page')}
              onPress={() => viewModel.setLastVerseInPage()}
            />
            <ActiveRoundedButton
              label={l('surah')}
              onPress={() => viewModel.setLastVerseInSura()}
            />
            <ActiveRoundedButton
              label={lAndroid('quran_juz2')}
              onPress={() => viewModel.setLastVerseInJuz()}
            />
          </View>
        </SectionContainer>

        {/* Verse Range Section */}
        <SectionContainer title={l('audio.playing-verses.label')}>
          <VerseRow
            label={lAndroid('from')}
            verse={state.fromVerse}
            onPress={() => setShowFromVersePicker(true)}
          />
          <VerseRow
            label={lAndroid('to')}
            verse={state.toVerse}
            onPress={() => setShowToVersePicker(true)}
          />
        </SectionContainer>

        {/* Verse Runs Section */}
        <SectionContainer title={lAndroid('play_each_verse').replace(':', '')}>
          <RunsChoices
            runs={state.verseRuns}
            onSelect={(runs) => viewModel.updateVerseRuns(runs)}
          />
        </SectionContainer>

        {/* List Runs Section */}
        <SectionContainer title={lAndroid('play_verses_range').replace(':', '')}>
          <RunsChoices
            runs={state.listRuns}
            onSelect={(runs) => viewModel.updateListRuns(runs)}
          />
        </SectionContainer>
      </ScrollView>

      {/* From Verse Picker Modal */}
      <Modal visible={showFromVersePicker} animationType="slide" presentationStyle="pageSheet">
        <VersePicker
          suras={viewModel.suras}
          selected={state.fromVerse}
          title={l('audio.select-start-verse')}
          onSelect={(verse) => {
            viewModel.updateFromVerseTo(verse);
            setShowFromVersePicker(false);
          }}
          onClose={() => setShowFromVersePicker(false)}
        />
      </Modal>

      {/* To Verse Picker Modal */}
      <Modal visible={showToVersePicker} animationType="slide" presentationStyle="pageSheet">
        <VersePicker
          suras={viewModel.suras}
          selected={state.toVerse}
          title={l('audio.select-end-verse')}
          onSelect={(verse) => {
            viewModel.updateToVerseTo(verse);
            setShowToVersePicker(false);
          }}
          onClose={() => setShowToVersePicker(false)}
        />
      </Modal>
    </View>
  );
}

// ============================================================================
// SectionContainer Component
// ============================================================================

interface SectionContainerProps {
  title?: string;
  children: React.ReactNode;
}

function SectionContainer({ title, children }: SectionContainerProps) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      {title && (
        <Text style={[styles.sectionTitle, { color: theme.colors.secondaryLabel }]}>
          {title.toUpperCase()}
        </Text>
      )}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// ============================================================================
// VerseRow Component
// ============================================================================

interface VerseRowProps {
  label: string;
  verse: AyahNumber;
  onPress: () => void;
}

function VerseRow({ label, verse, onPress }: VerseRowProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}
      onPress={onPress}
    >
      <Text style={[styles.listItemTitle, { color: theme.colors.label }]}>{label}</Text>
      <View style={styles.verseRowRight}>
        <Text style={[styles.verseText, { color: theme.colors.secondaryLabel }]}>
          {verse.localizedNameWithSuraNumber}
        </Text>
        <DisclosureIndicator />
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// RunsChoices Component
// ============================================================================

interface RunsChoicesProps {
  runs: Runs;
  onSelect: (runs: Runs) => void;
}

function RunsChoices({ runs, onSelect }: RunsChoicesProps) {
  const theme = useTheme();

  return (
    <View style={[styles.runsContainer, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}>
      {sortedRuns.map((item) => {
        const isSelected = runsEqual(item, runs);
        return (
          <TouchableOpacity
            key={getRunsKey(item)}
            style={[
              styles.runsItem,
              isSelected && { backgroundColor: theme.colors.tint },
            ]}
            onPress={() => onSelect(item)}
          >
            <Text
              style={[
                styles.runsItemText,
                { color: isSelected ? 'white' : theme.colors.label },
              ]}
            >
              {getRunsLocalizedDescription(item)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================================
// VersePicker Component
// ============================================================================

interface VersePickerProps {
  suras: Sura[];
  selected: AyahNumber;
  title: string;
  onSelect: (verse: AyahNumber) => void;
  onClose: () => void;
}

function VersePicker({ suras, selected, title, onSelect, onClose }: VersePickerProps) {
  const theme = useTheme();

  const sections = suras.map((sura) => ({
    title: sura.localizedName(),
    data: sura.verses,
    sura,
  }));

  const renderItem = ({ item }: { item: AyahNumber }) => {
    const isSelected =
      item.sura.suraNumber === selected.sura.suraNumber && item.ayah === selected.ayah;

    return (
      <TouchableOpacity
        style={[styles.versePickerItem, { backgroundColor: theme.colors.secondarySystemGroupedBackground }]}
        onPress={() => onSelect(item)}
      >
        <Text style={[styles.versePickerItemText, { color: theme.colors.label }]}>
          {item.localizedName()}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={theme.colors.tint} />
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.versePickerSectionHeader, { backgroundColor: theme.colors.systemGroupedBackground }]}>
      <Text style={[styles.versePickerSectionTitle, { color: theme.colors.secondaryLabel }]}>
        {section.title}
      </Text>
    </View>
  );

  return (
    <View style={[styles.versePickerContainer, { backgroundColor: theme.colors.systemGroupedBackground }]}>
      {/* Header */}
      <View style={[styles.versePickerHeader, { borderBottomColor: theme.colors.separator }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Text style={[styles.cancelButtonText, { color: theme.colors.tint }]}>
            {lAndroid('cancel')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.label }]}>{title}</Text>
        <View style={styles.headerButton} />
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.sura.suraNumber}:${item.ayah}`}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.versePickerList}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButtonText: {
    fontSize: 17,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {},
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: CORNER_RADIUS,
  },
  listItemTitle: {
    fontSize: 17,
  },
  verseRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 15,
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: CORNER_RADIUS,
  },
  runsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: CORNER_RADIUS,
  },
  runsItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  runsItemText: {
    fontSize: 15,
  },
  // Verse Picker
  versePickerContainer: {
    flex: 1,
  },
  versePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  versePickerList: {
    paddingBottom: 20,
  },
  versePickerSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  versePickerSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  versePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: CORNER_RADIUS,
  },
  versePickerItemText: {
    fontSize: 17,
  },
});

