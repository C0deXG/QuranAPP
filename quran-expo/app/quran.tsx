/**
 * Quran Route Screen
 *
 * Main Quran reading screen with page images, navigation, and audio.
 * 1:1 translation of iOS QuranViewController + QuranView.
 *
 * Quran.com. All rights reserved.
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
  Pressable,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Audio } from 'expo-av';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/ui/theme';
import { Quran } from '@/src/model/quran-kit';
import { getPageImage } from '@/assets/images/quran_pages';
import { AyahMenuView } from '@/src/ui/features/ayah-menu/AyahMenuView';
import { NoteState, type AyahMenuDataObject } from '@/src/ui/features/ayah-menu/AyahMenuTypes';
import { NoteColor, type Note, noteColorHex, createNoteNow, ayahKey } from '@/src/model/quran-annotations';
import { l } from '@/src/core/localization';
import { useAppDependencies } from '@/src/app-core/AppContainer';
import type { IAyahNumber, IPage } from '@/src/model/quran-kit';
import { AyahNumber } from '@/src/model/quran-kit/ayah-number';
import { compareAyahs } from '@/src/model/quran-kit/types';
import { QuranHighlightsService } from '@/src/domain/annotations-service';
import { ReadingPreferences } from '@/src/domain/reading-service';
import { ContentImageView } from '@/src/ui/features/quran/ContentImageView';
import { ContentImageViewModel } from '@/src/features/quran-image-feature/content-image-view-model';
import { createImageDataService, ImageDataService } from '@/src/domain/image-service';
import type { Reading } from '@/src/model/quran-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Single Quran page component - memoized for performance.
 * Handles tap gesture for full-screen toggle.
 */
const QuranPage = React.memo(({
  pageNumber,
  onTap,
  onPressIn,
  onLongPress,
  onLongPressMove,
  onLongPressEnd,
  onLongPressCancel,
  highlightedAyah,
  highlights,
  page,
  imageDataService,
  highlightsService,
}: {
  pageNumber: number;
  onTap: () => void;
  onPressIn?: (pageNumber: number, verse?: IAyahNumber) => void;
  onLongPress: (pageNumber: number, verse?: IAyahNumber) => void;
  onLongPressMove: (pageNumber: number, verse?: IAyahNumber) => void;
  onLongPressEnd: (pageNumber: number, verse?: IAyahNumber) => void;
  onLongPressCancel?: (pageNumber: number, verse?: IAyahNumber) => void;
  highlightedAyah: IAyahNumber | null;
  highlights: any;
  page: IPage | null;
  imageDataService: ImageDataService | null;
  highlightsService: QuranHighlightsService;
}) => {
  const theme = useTheme();

  // Create ViewModel
  const viewModel = useMemo(() => {
    if (!page || !imageDataService) return null;
    return new ContentImageViewModel(
      'hafs_1421' as Reading,
      page,
      imageDataService,
      highlightsService
    );
  }, [page, imageDataService, highlightsService]);

  // Mushaf canvas background: 100% black in dark mode, theme color in light mode
  const isDarkMode = theme.isDark;
  const backgroundColor = isDarkMode ? '#000000' : theme.themeColors.backgroundColor;

  return (
    <View style={[styles.pageContainer, { width: SCREEN_WIDTH, backgroundColor }]}>
      <View style={[styles.imageContainer, { backgroundColor }]}>
        {viewModel ? (
          <ContentImageView
            viewModel={viewModel}
            onPress={onTap}
            onPressIn={(p, verse) => onPressIn?.(p || pageNumber, verse)}
            onLongPress={(p, verse) => onLongPress(p || pageNumber, verse)}
            onLongPressMove={(p, verse) => onLongPressMove(p || pageNumber, verse)}
            onLongPressEnd={(p, verse) => onLongPressEnd(p || pageNumber, verse)}
            onLongPressCancel={(p, verse) => onLongPressCancel?.(p || pageNumber, verse)}
          />
        ) : (
          <Pressable
            style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center' }}
            onPress={onTap}
            onLongPress={() => onLongPress(pageNumber)}
          >
            <Text style={{ color: theme.colors.label }}>Page {pageNumber} (Loading...)</Text>
          </Pressable>
        )}

        {/* Highlight overlay when ayah is playing - iOS pattern: highlight specific ayah */}
        {highlightedAyah !== null && (
          <View style={styles.highlightOverlay} pointerEvents="none">
            <View style={[styles.highlightIndicator, {
              backgroundColor: theme.colors.tint + '40',
              borderWidth: 2,
              borderColor: theme.colors.tint + '80',
            }]} />
          </View>
        )}
      </View>
    </View>
  );
});

/**
 * Two-line navigation title (like iOS TwoLineNavigationTitleView)
 */
function TwoLineNavigationTitle({ firstLine, secondLine }: { firstLine: string; secondLine: string }) {
  const theme = useTheme();
  return (
    <View>
      <Text style={[styles.titleFirstLine, { color: theme.colors.label }]} numberOfLines={1}>
        {firstLine}
      </Text>
      <Text style={[styles.titleSecondLine, { color: theme.colors.secondaryLabel }]} numberOfLines={1}>
        {secondLine}
      </Text>
    </View>
  );
}

/**
 * Quran view screen with full-screen toggle and audio banner.
 * 1:1 translation of iOS QuranViewController.
 */
export default function QuranScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ page?: string; sura?: string }>();
  const flatListRef = useRef<FlatList>(null);

  // Use hafsMadani1405 directly - add try/catch for safety
  let quran;
  try {
    quran = Quran.hafsMadani1405;
  } catch (error) {
    console.error('Failed to load Quran:', error);
    quran = null;
  }

  // Bars visibility state (iOS: statusBarHidden + setBarsHidden)
  // Navigation bar stays visible by default, only hides on tap
  const [barsHidden, setBarsHidden] = useState(false);
  const barsOpacity = useRef(new Animated.Value(1)).current;
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine starting page index - with safety checks
  let initialPageIndex = 0;
  if (quran) {
    if (params.page) {
      initialPageIndex = Math.max(0, (parseInt(params.page, 10) || 1) - 1);
    } else if (params.sura) {
      const suraNumber = parseInt(params.sura, 10) || 1;
      try {
        const sura = quran?.suras?.find(s => s.suraNumber === suraNumber);
        if (sura?.page) {
          initialPageIndex = Math.max(0, sura.page.pageNumber - 1);
        }
      } catch (error) {
        console.error('Failed to find sura:', error);
      }
    }
  }

  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);

  // Animate bars visibility (iOS: setBarsHidden with alpha animation)
  useEffect(() => {
    Animated.timing(barsOpacity, {
      toValue: barsHidden ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [barsHidden, barsOpacity]);

  // Page data - just page numbers (lightweight)
  const pageNumbers = useMemo(() => Array.from({ length: 604 }, (_, i) => i + 1), []);

  // Safety check for quran data - must be early return
  if (!quran || !quran.pages || quran.pages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.themeColors.backgroundColor || '#fff' }]}>
        <ActivityIndicator size="large" color={theme.colors?.tint || '#007AFF'} />
        <Text style={{ marginTop: 16, color: theme.colors?.label || '#000' }}>
          Loading Quran...
        </Text>
      </View>
    );
  }

  // Get current page info for title - with safety checks
  let currentPage;
  let firstLine = '';
  let secondLine = `Page ${currentPageIndex + 1}`;

  try {
    currentPage = quran.pages[currentPageIndex];
    if (currentPage) {
      const currentSura = currentPage?.verses?.[0]?.sura;
      firstLine = currentSura?.localizedName?.(true) || '';
      const juzNumber = currentPage?.startJuz?.juzNumber || 1;
      secondLine = `Page ${currentPageIndex + 1} · Juz ${juzNumber}`;
    }
  } catch (error) {
    console.error('Failed to get page info:', error);
  }

  // App dependencies (used for image data service)
  const dependencies = useAppDependencies();

  // Create ImageDataService
  const imageDataService = useMemo(() => {
    if (!dependencies?.ayahInfoDatabase) return null;
    return createImageDataService(dependencies.ayahInfoDatabase, dependencies.databasesDirectory || '');
  }, [dependencies]);

  // Highlight overlay for audio playback is disabled while audio features are removed
  const [highlightedAyah] = useState<IAyahNumber | null>(null);
  const [highlightingEnabled, setHighlightingEnabled] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  useEffect(() => {
    console.log('[GESTURE_DEBUG] isSelecting changed', { isSelecting, scrollEnabled: !isSelecting });
  }, [isSelecting]);

  // Highlights service and notes state (iOS pattern: QuranHighlightsService)
  const highlightsServiceRef = useRef(new QuranHighlightsService());
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState(highlightsServiceRef.current.highlights);

  // In-memory highlights only (notes persistence disabled); keep highlights in sync.
  useEffect(() => {
    const unsubscribeHighlights = highlightsServiceRef.current.addListener('highlights', (newHighlights) => {
      setHighlights(newHighlights);
    });
    return () => {
      unsubscribeHighlights();
    };
  }, []);

  // Dev-only sanity check: force-highlight surah 1 ayah 1 on initial load via normal highlights pipeline.
  // Ayah menu state (iOS: presentAyahMenu)
  const [ayahMenuVisible, setAyahMenuVisible] = useState(false);
  const [selectedPageForMenu, setSelectedPageForMenu] = useState(1);
  const [selectedAyahForMenu, setSelectedAyahForMenu] = useState<IAyahNumber | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<IAyahNumber[]>([]);

// Long press selection state (iOS: LongPressData)
const longPressDataRef = useRef<{
  startVerse: IAyahNumber;
  endVerse: IAyahNumber;
  startPage: number;
} | null>(null);
const pendingStartVerseRef = useRef<IAyahNumber | null>(null);

  // Handle scroll
  const onMomentumScrollEnd = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex >= 0 && newIndex < 604) {
      setCurrentPageIndex(newIndex);
    }
  }, []);

  // Auto-hide bars after 5 seconds (iOS pattern: startHiddenBarsTimer)
  const startAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = setTimeout(() => {
      setBarsHidden(true);
    }, 5000);
  }, []);

  // Stop auto-hide timer
  const stopAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  // Handle tap to toggle bars (iOS pattern: onQuranViewTapped)
  const handleTap = useCallback(() => {
    setBarsHidden(prev => {
      const newHidden = !prev;
      // Don't auto-hide - let user control visibility
      stopAutoHideTimer();
      return newHidden;
    });
  }, [stopAutoHideTimer]);

  // Handle back button
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Capture initial touch verse before long-press recognition so start verse stays anchored
  const handlePressIn = useCallback((_: number, verse?: IAyahNumber) => {
    pendingStartVerseRef.current = verse ?? null;
  }, []);

  // Handle long-press start - iOS pattern: onViewLongPressStarted
  const handleLongPressStart = useCallback((pageNumber: number, verse?: IAyahNumber) => {
    console.log('[GESTURE_DEBUG] start/began', { pageNumber, verse });
    setIsSelecting((prev) => {
      if (!prev) {
        console.log('[GESTURE_DEBUG] isSelecting -> true (scroll disabled)');
      }
      return true;
    });
    const page = quran.pages[pageNumber - 1];
    const targetVerse = pendingStartVerseRef.current ?? verse ?? page?.verses?.[0];
    pendingStartVerseRef.current = null;
    if (targetVerse) {
      longPressDataRef.current = {
        startVerse: targetVerse,
        endVerse: targetVerse,
        startPage: pageNumber,
      };
      // Update share verses for visual feedback
      highlightsServiceRef.current.highlights = {
        ...highlightsServiceRef.current.highlights,
        shareVerses: [targetVerse],
      };
      setHighlights(highlightsServiceRef.current.highlights);
    }
  }, [quran]);

  const buildSelectionRange = useCallback((startVerse: IAyahNumber, endVerse: IAyahNumber) => {
    let start = startVerse;
    let end = endVerse;
    if (compareAyahs(end, start) < 0) {
      [start, end] = [end, start];
    }
    const selected: IAyahNumber[] = [start];
    let current: IAyahNumber | undefined = start;
    while (current && current.next && compareAyahs(current.next, end) <= 0) {
      current = current.next;
      selected.push(current);
    }
    return { start, end, selected };
  }, []);

  // Handle drag move during long press
  const handleLongPressMove = useCallback((_: number, verse?: IAyahNumber) => {
    console.log('[GESTURE_DEBUG] move/changed', { verse });
    if (!longPressDataRef.current || !verse) return;
    const { startVerse } = longPressDataRef.current;
    const { start, end, selected } = buildSelectionRange(startVerse, verse);
    longPressDataRef.current = {
      ...longPressDataRef.current,
      endVerse: end,
    };
    highlightsServiceRef.current.highlights = {
      ...highlightsServiceRef.current.highlights,
      shareVerses: selected,
    };
    setHighlights(highlightsServiceRef.current.highlights);
    setSelectedVerses(selected);
    setSelectedAyahForMenu(start);
    setSelectedPageForMenu(longPressDataRef.current.startPage);
  }, [buildSelectionRange]);

  // Handle long-press end - finalize selection and show menu
  const handleLongPressEnd = useCallback((_: number, verse?: IAyahNumber) => {
    console.log('[GESTURE_DEBUG] end/ended', { verse });
    if (!longPressDataRef.current || !quran) return;
    const endVerse = verse ?? longPressDataRef.current.endVerse ?? longPressDataRef.current.startVerse;
    const { startVerse, startPage } = longPressDataRef.current;
    const { start, end, selected } = buildSelectionRange(startVerse, endVerse);

    highlightsServiceRef.current.highlights = {
      ...highlightsServiceRef.current.highlights,
      shareVerses: selected,
    };
    setHighlights(highlightsServiceRef.current.highlights);

    setSelectedVerses(selected);
    setSelectedPageForMenu(startPage);
    setSelectedAyahForMenu(start);
    setAyahMenuVisible(true);
    longPressDataRef.current = null;
    setIsSelecting((prev) => {
      if (prev) {
        console.log('[GESTURE_DEBUG] isSelecting -> false (scroll enabled) via end');
      }
      return false;
    });
  }, [quran, buildSelectionRange]);

  // Handle long-press cancel - iOS pattern: onViewLongPressCancelled
  const handleLongPressCancel = useCallback((_: number, __?: IAyahNumber) => {
    console.log('[GESTURE_DEBUG] cancel/terminated');
    longPressDataRef.current = null;
    pendingStartVerseRef.current = null;
    highlightsServiceRef.current.highlights = {
      ...highlightsServiceRef.current.highlights,
      shareVerses: [],
    };
    setHighlights(highlightsServiceRef.current.highlights);
    setIsSelecting((prev) => {
      if (prev) {
        console.log('[GESTURE_DEBUG] isSelecting -> false (scroll enabled) via cancel');
      }
      return false;
    });
  }, []);

  // Handle long-press to show ayah menu - iOS pattern: get ayah from touch point
  const handleLongPress = useCallback((pageNumber: number, verse?: IAyahNumber) => {
    console.log('[GESTURE_DEBUG] longPress handler invoked (begin)');
    handleLongPressStart(pageNumber, verse);
  }, [handleLongPressStart]);

  // Close ayah menu
  const closeAyahMenu = useCallback(() => {
    setAyahMenuVisible(false);
    // Clear temporary selection highlight
    highlightsServiceRef.current.highlights = {
      ...highlightsServiceRef.current.highlights,
      shareVerses: [],
    };
    setHighlights(highlightsServiceRef.current.highlights);
    setIsSelecting((prev) => {
      if (prev) {
        console.log('[GESTURE_DEBUG] isSelecting -> false (scroll enabled) via menu close');
      }
      return false;
    });
  }, []);

  // Get verse text for copy/share
  const getVerseText = useCallback(() => {
    if (!selectedAyahForMenu) return '';
    return `${selectedAyahForMenu.sura.localizedName()} ${selectedAyahForMenu.ayah}`;
  }, [selectedAyahForMenu]);

  // Get notes for selected verses (iOS pattern: notesInteractingVerses)
  const notesForSelectedVerses = useMemo(() => {
    if (!selectedVerses.length) return [];
    const selectedSet = new Set(selectedVerses.map(v => `${v.sura.suraNumber}:${v.ayah}`));
    return notes.filter(note =>
      Array.from(note.verses).some(verse => selectedSet.has(`${verse.sura.suraNumber}:${verse.ayah}`))
    );
  }, [notes, selectedVerses]);

  // Get highlighting color from notes (iOS pattern: noteService.color)
  const highlightingColor = useMemo(() => {
    if (notesForSelectedVerses.length > 0) {
      // Get most recent note's color
      const mostRecent = notesForSelectedVerses.reduce((latest, note) =>
        note.modifiedDate > latest.modifiedDate ? note : latest
      );
      return mostRecent.color;
    }
    return NoteColor.Green; // Default color
  }, [notesForSelectedVerses]);

  // Get note state (iOS pattern: noteState)
  const noteState = useMemo(() => {
    if (notesForSelectedVerses.length === 0) {
      return NoteState.NoHighlight;
    }
    // Check if any note has text
    const hasText = notesForSelectedVerses.some(note => note.note && note.note.trim().length > 0);
    return hasText ? NoteState.Noted : NoteState.Highlighted;
  }, [notesForSelectedVerses]);

  // Ayah menu data object - iOS pattern: play from selected ayah
  const ayahMenuDataObject: AyahMenuDataObject = useMemo(() => {
    if (!selectedAyahForMenu || selectedVerses.length === 0) {
      return {
        highlightingColor: NoteColor.Green,
        state: NoteState.NoHighlight,
        playSubtitle: l('ayah.menu.play-end-page'),
        repeatSubtitle: l('ayah.menu.selected-verse'),
        isTranslationView: false,
        actions: {
          play: async () => closeAyahMenu(),
          repeatVerses: async () => closeAyahMenu(),
          highlight: async () => closeAyahMenu(),
          addNote: async () => closeAyahMenu(),
          deleteNote: async () => closeAyahMenu(),
          showTranslation: async () => closeAyahMenu(),
          copy: async () => closeAyahMenu(),
          share: async () => closeAyahMenu(),
        },
      };
    }

    const verses = selectedVerses;
    const repeatSubtitle = verses.length === 1
      ? l('ayah.menu.selected-verse')
      : l('ayah.menu.selected-verses');

    return {
      highlightingColor,
      state: noteState,
      playSubtitle: l('ayah.menu.play-end-page'),
      repeatSubtitle,
      isTranslationView: false,
      actions: {
        // Audio disabled for rollback; close menu without playback.
        play: async () => {
          closeAyahMenu();
        },
        repeatVerses: async () => {
          closeAyahMenu();
        },
        highlight: async (color: NoteColor) => {
          try {
            // In this build, skip persistence and update in-memory highlights directly.
            const currentHighlights = highlightsServiceRef.current.highlights;
            const newNote = createNoteNow({ verses: new Set(verses), color });
            const updatedNoteVerses = new Map(currentHighlights.noteVerses);
            for (const verse of verses) {
              updatedNoteVerses.set(ayahKey(verse), newNote);
            }
            highlightsServiceRef.current.highlights = {
              ...currentHighlights,
              noteVerses: updatedNoteVerses,
              shareVerses: [],
            };
            setHighlights(highlightsServiceRef.current.highlights);
            // Keep local notes state in sync for menu UI.
            setNotes((prev) => {
              const filtered = prev.filter((note) => {
                return !Array.from(note.verses).some((v) =>
                  verses.some((sel) => sel.sura.suraNumber === v.sura.suraNumber && sel.ayah === v.ayah)
                );
              });
              return [...filtered, newNote];
            });
            closeAyahMenu();
          } catch (error) {
            console.error('Failed to update highlight:', error);
            closeAyahMenu();
          }
        },
        addNote: async () => {
          // Notes disabled in this build.
          closeAyahMenu();
        },
        deleteNote: async () => {
          try {
            // Remove from in-memory highlights map only (no persistence).
            const currentHighlights = highlightsServiceRef.current.highlights;
            const updatedNoteVerses = new Map(currentHighlights.noteVerses);
            for (const verse of verses) {
              updatedNoteVerses.delete(ayahKey(verse));
            }
            highlightsServiceRef.current.highlights = {
              ...currentHighlights,
              noteVerses: updatedNoteVerses,
            };
            setHighlights(highlightsServiceRef.current.highlights);
            setNotes((prev) =>
              prev.filter((note) =>
                !Array.from(note.verses).some((v) =>
                  verses.some((sel) => sel.sura.suraNumber === v.sura.suraNumber && sel.ayah === v.ayah)
                )
              )
            );
            closeAyahMenu();
          } catch (error) {
            console.error('Failed to delete notes:', error);
            closeAyahMenu();
          }
        },
        showTranslation: async () => {
          closeAyahMenu();
          router.push('/translations' as any);
        },
        copy: async () => {
          const text = getVerseText();
          await Clipboard.setStringAsync(text);
          closeAyahMenu();
        },
        share: async () => {
          const text = getVerseText();
          await Share.share({ message: text });
          closeAyahMenu();
        },
      },
    };
  }, [
    selectedAyahForMenu,
    selectedVerses,
    selectedPageForMenu,
    quran,
    closeAyahMenu,
    getVerseText,
    router,
    highlightingColor,
    noteState,
    dependencies,
  ]);

  // Render page - iOS pattern: highlight if ayah is on this page
  const renderPage = useCallback(({ item }: { item: number }) => {
    const pageNumber = item;
    const shouldHighlight = currentPageIndex + 1 === pageNumber && highlightingEnabled && highlightedAyah;

    // Check if highlighted ayah is on this page (iOS pattern: page.contains(ayah))
    let showHighlight = false;
    if (shouldHighlight && highlightedAyah) {
      const page = quran.pages[pageNumber - 1];
      if (page) {
        // Check if ayah is on this page (iOS: compareAyahs(ayah, page.firstVerse) >= 0 && compareAyahs(ayah, page.lastVerse) <= 0)
        const pageStart = page.firstVerse;
        const pageEnd = page.lastVerse;
        const ayah = highlightedAyah;

        // Compare ayahs: sura number first, then ayah number
        const compareSura = ayah.sura.suraNumber - pageStart.sura.suraNumber;
        if (compareSura === 0) {
          // Same sura - check ayah number
          if (ayah.ayah >= pageStart.ayah && ayah.ayah <= pageEnd.ayah) {
            showHighlight = true;
          }
        } else if (ayah.sura.suraNumber > pageStart.sura.suraNumber && ayah.sura.suraNumber < pageEnd.sura.suraNumber) {
          showHighlight = true;
        } else if (ayah.sura.suraNumber === pageEnd.sura.suraNumber && ayah.ayah <= pageEnd.ayah) {
          showHighlight = true;
        }
      }
    }

    const page = quran.pages[pageNumber - 1];

    return (
      <QuranPage
        pageNumber={pageNumber}
        onTap={handleTap}
        onPressIn={handlePressIn}
        onLongPress={handleLongPress}
        onLongPressMove={handleLongPressMove}
        onLongPressEnd={handleLongPressEnd}
        onLongPressCancel={handleLongPressCancel}
        highlightedAyah={showHighlight ? highlightedAyah : null}
        highlights={highlights}
        page={page || null}
        imageDataService={imageDataService}
        highlightsService={highlightsServiceRef.current}
      />
    );
  }, [handleTap, handleLongPress, currentPageIndex, highlightingEnabled, highlightedAyah, quran, highlights]);

  // Key extractor
  const keyExtractor = useCallback((item: number) => item.toString(), []);

  // Get item layout for instant scrolling
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  }), []);

  // Mushaf canvas background: 100% black in dark mode, theme color in light mode
  const backgroundColor = theme.isDark ? '#000000' : theme.themeColors.backgroundColor;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar hidden={barsHidden} animated />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Main Content */}
      <FlatList
        ref={flatListRef}
        data={pageNumbers}
        renderItem={renderPage}
        keyExtractor={keyExtractor}
        horizontal
      pagingEnabled
      inverted
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={initialPageIndex}
      getItemLayout={getItemLayout}
      scrollEnabled={!isSelecting}
      onMomentumScrollEnd={onMomentumScrollEnd}
      removeClippedSubviews={true}
      maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        style={styles.flatList}
      />

      {/* Immersive Mode Overlays - Minimal context when bars are hidden */}
      {barsHidden && (
        <>
          {/* Top Left: Juz info */}
          <SafeAreaView edges={['top', 'left']} style={styles.immersiveTopLeft}>
            <Text style={[styles.immersiveText, { color: theme.colors.secondaryLabel }]}>
              {secondLine.split('·')[1]?.trim() || 'Juz 1'}
            </Text>
          </SafeAreaView>

          {/* Top Right: Surah name (English + Arabic) */}
          <SafeAreaView edges={['top', 'right']} style={styles.immersiveTopRight}>
            <Text style={[styles.immersiveText, { color: theme.colors.secondaryLabel }]}>
              {firstLine} {currentPage?.verses?.[0]?.sura?.name || ''}
            </Text>
          </SafeAreaView>

          {/* Bottom Center: Page number */}
          <SafeAreaView edges={['bottom']} style={styles.immersiveBottomCenter}>
            <Text style={[styles.immersivePageNumber, { color: theme.colors.secondaryLabel }]}>
              {currentPageIndex + 1}
            </Text>
          </SafeAreaView>
        </>
      )}

      {/* Navigation Bar - Clean header with surah info */}
      {!barsHidden && (
        <Animated.View
          style={[
            styles.safeAreaContainer,
            {
              opacity: barsOpacity,
              backgroundColor: theme.isDark ? '#1C1C1E' : '#F7F7F7',
            }
          ]}
        >
          <SafeAreaView edges={['top']} style={styles.navigationBarContainer}>
            <View
              style={[
                styles.navigationBar,
                {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                }
              ]}
              pointerEvents="auto"
            >
              {/* Back button - positioned absolutely on left */}
              <TouchableOpacity onPress={handleBack} style={styles.leftNavButton}>
                <Ionicons name="chevron-back" size={26} color={theme.colors.tint} />
              </TouchableOpacity>

              {/* Title - centered relative to screen width */}
              <View style={styles.centeredTitleContainer}>
                <TwoLineNavigationTitle firstLine={firstLine} secondLine={secondLine} />
              </View>

              {/* Right buttons - positioned absolutely on right */}
              <View style={styles.rightButtonsContainer}>
                <TouchableOpacity style={styles.navButton}>
                  <Ionicons name="bookmark-outline" size={24} color={theme.colors.tint} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton}>
                  <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={theme.colors.tint} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Ayah Menu Modal */}
      <Modal
        visible={ayahMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAyahMenu}
      >
        <Pressable style={styles.ayahMenuOverlay} onPress={closeAyahMenu}>
          <View style={[styles.ayahMenuContent, { backgroundColor: theme.colors.systemBackground }]}>
            <View style={styles.ayahMenuHeader}>
              <Text style={[styles.ayahMenuTitle, { color: theme.colors.label }]}>
                {l('page')} {selectedPageForMenu}
              </Text>
              <TouchableOpacity onPress={closeAyahMenu} style={styles.ayahMenuCloseButton}>
                <Ionicons name="close-circle" size={24} color={theme.colors.secondaryLabel} />
              </TouchableOpacity>
            </View>
            <AyahMenuView dataObject={ayahMenuDataObject} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  highlightIndicator: {
    position: 'absolute',
    top: '20%',
    left: '5%',
    right: '5%',
    height: 60,
    borderRadius: 8,
    opacity: 0.6,
  },
  highlightLabel: {
    position: 'absolute',
    top: '22%',
    left: '10%',
    fontSize: 16,
    fontWeight: 'bold',
  },
  safeAreaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navigationBarContainer: {
    width: '100%',
  },
  navigationBar: {
    minHeight: 52,
    paddingBottom: 4,
  },
  navigationBarContent: {
    position: 'relative',
    minHeight: 52,
  },
  leftNavButton: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleFirstLine: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  titleSecondLine: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  rightButtonsContainer: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniPlayerBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  miniPlayerSafeArea: {
    // No padding - AudioBannerView handles inner spacing
  },
  immersiveTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 16,
    zIndex: 5,
  },
  immersiveTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 16,
    zIndex: 5,
  },
  immersiveBottomCenter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 16,
    zIndex: 5,
  },
  immersiveText: {
    fontSize: 14,
    fontWeight: '500',
  },
  immersivePageNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  ayahMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahMenuContent: {
    width: 300,
    maxWidth: '90%',
    maxHeight: '70%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  ayahMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  ayahMenuTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  ayahMenuCloseButton: {
    padding: 4,
  },
});
