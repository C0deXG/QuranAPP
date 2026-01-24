/**
 * ContentTranslationView.swift + TranslationItem+View.swift → ContentTranslationView.tsx
 *
 * Component for displaying translation content.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  type ListRenderItem,
  type LayoutChangeEvent,
} from 'react-native';
import { Text } from 'react-native';
import { useTheme } from '../../ui/theme';
import {
  QuranPageHeader,
  QuranPageFooter,
  QuranSuraName,
  QuranArabicText,
  QuranTranslationTextChunk,
  QuranTranslationReferenceVerse,
  QuranTranslatorName,
  QuranVerseSeparator,
} from '../../ui/features/quran';
import { lFormat, l } from '../../core/localization';
import { pageSuraNames, pageSuraNamesString } from '../quran-pages-feature';
import { createPageGeometryActions, type PageGeometryActions } from '../quran-pages-feature';
import {
  ContentTranslationViewModel,
  type ContentTranslationViewState,
} from './content-translation-view-model';
import {
  type TranslationItem,
  translationItemIdKey,
  translationItemIdAyah,
  getTranslationItemId,
  getTranslationItemColor,
} from './translation-item';
import { getFootnoteText, type TranslationFootnote } from './translation-footnote';
import { getTranslationTextFont, getTranslationCharacterDirection } from './translation-ui';
import { createReadMoreURL, createFootnoteURL } from './translation-url';

// ============================================================================
// Types
// ============================================================================

export interface ContentTranslationViewProps {
  viewModel: ContentTranslationViewModel;
}

// ============================================================================
// ContentTranslationView Component
// ============================================================================

/**
 * Component for displaying translation content.
 *
 * 1:1 translation of iOS ContentTranslationView.
 */
export function ContentTranslationView({ viewModel }: ContentTranslationViewProps) {
  const theme = useTheme();
  const [state, setState] = useState<ContentTranslationViewState>(viewModel.state);
  const flatListRef = useRef<FlatList>(null);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Load data when verses or selected translations change
  useEffect(() => {
    if (state.verses.length > 0) {
      viewModel.load();
    }
  }, [viewModel, state.verses, state.selectedTranslations]);

  // Scroll to item when needed
  useEffect(() => {
    if (state.scrollToItem && flatListRef.current) {
      const items = viewModel.items;
      const index = items.findIndex(
        (item) => translationItemIdKey(getTranslationItemId(item)) === translationItemIdKey(state.scrollToItem!)
      );
      if (index >= 0) {
        flatListRef.current.scrollToIndex({ index, animated: true });
      }
    }
  }, [state.scrollToItem, viewModel]);

  // Get geometry actions
  const geometryActions: PageGeometryActions = createPageGeometryActions(
    `translation-${state.verses[0]?.page?.pageNumber ?? 0}`,
    () => null, // No word selection for translation view
    (point) => viewModel.ayahAtPoint(point)
  );

  // Handle URL open
  const handleURLOpen = useCallback(
    (url: string) => {
      viewModel.openURL(url);
    },
    [viewModel]
  );

  // Render item
  const renderItem: ListRenderItem<TranslationItem> = useCallback(
    ({ item, index }) => {
      return (
        <TranslationItemView
          item={item}
          onURLOpen={handleURLOpen}
          tracker={viewModel.tracker}
        />
      );
    },
    [handleURLOpen, viewModel.tracker]
  );

  const keyExtractor = useCallback(
    (item: TranslationItem) => translationItemIdKey(getTranslationItemId(item)),
    []
  );

  const items = viewModel.items;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      />

      {/* Footnote Modal */}
      {state.footnote && (
        <FootnoteModal footnote={state.footnote} onDismiss={() => viewModel.dismissFootnote()} />
      )}
    </View>
  );
}

// ============================================================================
// TranslationItemView Component
// ============================================================================

interface TranslationItemViewProps {
  item: TranslationItem;
  onURLOpen: (url: string) => void;
  tracker: ContentTranslationViewModel['tracker'];
}

function TranslationItemView({ item, onURLOpen, tracker }: TranslationItemViewProps) {
  const theme = useTheme();
  const color = getTranslationItemColor(item);
  const itemRef = useRef<View>(null);

  // Track item position
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      itemRef.current?.measureInWindow((windowX, windowY, windowWidth, windowHeight) => {
        tracker.setItemRect(getTranslationItemId(item), translationItemIdKey(getTranslationItemId(item)), {
          x: windowX,
          y: windowY,
          width: windowWidth,
          height: windowHeight,
        });
      });
    },
    [item, tracker]
  );

  const content = (() => {
    switch (item.type) {
      case 'pageHeader': {
        const { page } = item.data;
        return (
          <QuranPageHeader
            quarterName={page.quarter?.localizedName ?? ''}
            suraNames={pageSuraNamesString(page)}
          />
        );
      }

      case 'pageFooter': {
        const { page } = item.data;
        return <QuranPageFooter page={String(page.pageNumber)} />;
      }

      case 'verseSeparator':
        return <QuranVerseSeparator />;

      case 'suraName': {
        const { sura, arabicFontSize } = item.data;
        return (
          <QuranSuraName
            suraName={sura.localizedName(false)}
            besmAllah={sura.startsWithBesmAllah ? sura.quran.arabicBesmAllah : ''}
            besmAllahFontSize={arabicFontSize}
          />
        );
      }

      case 'arabicText': {
        const { verse, text, arabicFontSize } = item.data;
        return <QuranArabicText verse={verse} text={text} fontSize={arabicFontSize} />;
      }

      case 'translationTextChunk': {
        const { verse, translation, text, chunks, chunkIndex, readMore, translationFontSize } = item.data;
        const chunk = chunks[chunkIndex];
        const chunkText = text.text.substring(chunk.start, chunk.end);
        const readMoreURL = readMore
          ? createReadMoreURL(translation.id, verse.sura.suraNumber, verse.ayah)
          : undefined;

        return (
          <QuranTranslationTextChunk
            text={text.text}
            chunkStart={chunk.start}
            chunkEnd={chunk.end}
            footnoteRanges={text.footnoteRanges}
            quranRanges={text.quranRanges}
            firstChunk={chunkIndex === 0}
            readMoreURL={readMoreURL}
            footnoteURL={(index: number) =>
              createFootnoteURL(translation.id, verse.sura.suraNumber, verse.ayah, index)
            }
            font={getTranslationTextFont(translation)}
            fontSize={translationFontSize}
            characterDirection={getTranslationCharacterDirection(translation)}
            onURLPress={onURLOpen}
          />
        );
      }

      case 'translationReferenceVerse': {
        const { reference, translationFontSize, translation } = item.data;
        return (
          <QuranTranslationReferenceVerse
            reference={reference}
            fontSize={translationFontSize}
            characterDirection={getTranslationCharacterDirection(translation)}
          />
        );
      }

      case 'translatorText': {
        const { translation, translationFontSize } = item.data;
        return (
          <QuranTranslatorName
            name={translation.translationName}
            fontSize={translationFontSize}
            characterDirection={getTranslationCharacterDirection(translation)}
          />
        );
      }

      default:
        return null;
    }
  })();

  return (
    <View
      ref={itemRef}
      style={[styles.itemContainer, color ? { backgroundColor: color } : undefined]}
      onLayout={handleLayout}
    >
      {content}
    </View>
  );
}

// ============================================================================
// FootnoteModal Component
// ============================================================================

interface FootnoteModalProps {
  footnote: TranslationFootnote;
  onDismiss: () => void;
}

function FootnoteModal({ footnote, onDismiss }: FootnoteModalProps) {
  const theme = useTheme();
  const text = getFootnoteText(footnote);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onDismiss}>
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.systemBackground }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.label }]}>
            {lFormat('translation.text.footnote-title', footnote.footnoteIndex + 1)}
          </Text>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={[styles.doneButton, { color: theme.colors.tint }]}>{l('button.done')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={[styles.footnoteText, { color: theme.colors.label }]}>{text}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemContainer: {
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  footnoteText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

