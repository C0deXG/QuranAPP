/**
 * QuranView.swift + QuranViewController.swift → QuranScreen.tsx
 *
 * Main Quran reading screen.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
  SafeAreaView,
  Platform,
  Dimensions,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, ThemeService } from '../../ui/theme';
import { Timer } from '../../core/timing';
import { l, lFormat } from '../../core/localization';
import { NumberFormatter } from '../../core/localization';
import type { Page, AyahNumber, Word } from '../../model/quran-kit';
import type { Note } from '../../model/quran-annotations';
import type { Point } from '../../model/quran-geometry';
import type { QuranInput } from '../quran-content-feature';
import { ContentScreen, type ContentListener } from '../quran-content-feature';
import {
  QuranInteractor,
  type QuranInteractorState,
  type QuranPresentable,
  type ContentStatus,
} from './quran-interactor';
import { LoadingView } from '../../ui/components';

// ============================================================================
// TwoLineNavigationTitle Component
// ============================================================================

interface TwoLineNavigationTitleProps {
  firstLine: string;
  secondLine: string;
}

function TwoLineNavigationTitle({ firstLine, secondLine }: TwoLineNavigationTitleProps) {
  const theme = useTheme();

  return (
    <View style={styles.titleContainer}>
      <Text style={[styles.titleFirstLine, { color: theme.colors.label }]} numberOfLines={1}>
        {firstLine}
      </Text>
      <Text style={[styles.titleSecondLine, { color: theme.colors.secondaryLabel }]} numberOfLines={1}>
        {secondLine}
      </Text>
    </View>
  );
}

// ============================================================================
// ContentStatusView Component
// ============================================================================

interface ContentStatusViewProps {
  status: ContentStatus;
}

function ContentStatusView({ status }: ContentStatusViewProps) {
  const theme = useTheme();

  if (!status) return null;

  if (status.type === 'downloading') {
    return (
      <View style={[styles.contentStatusContainer, { backgroundColor: theme.colors.systemBackground }]}>
        <LoadingView />
        <Text style={[styles.statusText, { color: theme.colors.label }]}>
          {l('downloading.title')} ({Math.round(status.progress * 100)}%)
        </Text>
      </View>
    );
  }

  if (status.type === 'error') {
    return (
      <View style={[styles.contentStatusContainer, { backgroundColor: theme.colors.systemBackground }]}>
        <Text style={[styles.statusText, { color: theme.colors.destructive }]}>
          {status.error.message}
        </Text>
        <TouchableOpacity onPress={status.retry} style={styles.retryButton}>
          <Text style={{ color: theme.colors.tint }}>{l('button.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// ============================================================================
// QuranScreen Props
// ============================================================================

export interface QuranScreenProps {
  interactor: QuranInteractor;
  input: QuranInput;
}

// ============================================================================
// QuranScreen Component
// ============================================================================

/**
 * Main Quran reading screen.
 *
 * 1:1 translation of iOS QuranViewController + QuranView.
 */
export function QuranScreen({ interactor, input }: QuranScreenProps) {
  const navigation = useNavigation();
  const theme = useTheme();

  // State
  const [interactorState, setInteractorState] = useState<QuranInteractorState>(interactor.state);
  const [barsHidden, setBarsHidden] = useState(false);
  const [statusBarHidden, setStatusBarHidden] = useState(false);
  const [firstLine, setFirstLine] = useState('');
  const [secondLine, setSecondLine] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Refs
  const barsTimerRef = useRef<Timer | null>(null);
  const barsOpacity = useRef(new Animated.Value(1)).current;
  const pagesViewRef = useRef<View>(null);

  // Subscribe to interactor state
  useEffect(() => {
    setInteractorState(interactor.state);
    interactor.addListener(setInteractorState);
    return () => {
      interactor.removeListener(setInteractorState);
    };
  }, [interactor]);

  // Connect interactor to presenter
  useEffect(() => {
    const presenter: QuranPresentable = {
      pagesView: pagesViewRef.current,

      startHiddenBarsTimer() {
        // Increase timer duration to give users time to see new buttons
        barsTimerRef.current?.cancel();
        barsTimerRef.current = new Timer({
          interval: 5000,
          repeated: false,
          handler: () => {
            setBarsHidden(true);
          },
        });
      },

      hideBars() {
        setBarsHidden(true);
      },

      setVisiblePages(pages: Page[]) {
        updateTitle(pages);
      },

      updateBookmark(bookmarked: boolean) {
        setIsBookmarked(bookmarked);
      },

      shareText(lines: string[], point: Point, completion: () => void) {
        Share.share({ message: lines.join('\n') }).finally(completion);
      },

      presentMoreMenu(onDismiss: () => void) {
        // TODO: Present more menu modal
      },

      presentAyahMenu(input) {
        // TODO: Present ayah menu
      },

      presentTranslatedVerse(verse: AyahNumber, onDismiss: () => void) {
        // TODO: Present translated verse modal
      },

      presentAudioBanner() {
        // Audio banner is rendered as part of this component
      },

      presentWordPointer() {
        // TODO: Present word pointer
      },

      presentQuranContent() {
        // Content is rendered as part of this component
      },

      presentTranslationsSelection() {
        // TODO: Navigate to translations selection
      },

      dismissWordPointer() {
        // TODO: Dismiss word pointer
      },

      dismissPresentedViewController(completion?: () => void) {
        completion?.();
      },

      confirmNoteDelete(onDelete: () => Promise<void>, onCancel: () => void) {
        Alert.alert(
          l('notes.delete.title'),
          l('notes.delete.message'),
          [
            { text: l('cancel'), style: 'cancel', onPress: onCancel },
            { text: l('delete'), style: 'destructive', onPress: () => onDelete() },
          ]
        );
      },

      rotateToPortraitIfPhone() {
        // Not applicable in React Native the same way
      },

      presentNoteEditor(note: Note) {
        // TODO: Navigate to note editor
      },

      dismissNoteEditor() {
        navigation.goBack();
      },

      goBack() {
        navigation.goBack();
      },
    };

    interactor.presenter = presenter;
    interactor.start();

    return () => {
      barsTimerRef.current?.cancel();
    };
  }, [interactor, navigation]);

  // Handle bars visibility animation
  useEffect(() => {
    Animated.timing(barsOpacity, {
      toValue: barsHidden ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setStatusBarHidden(barsHidden);
  }, [barsHidden, barsOpacity]);

  // Update title based on visible pages
  const updateTitle = useCallback((pages: Page[]) => {
    if (pages.length === 0) {
      setFirstLine('');
      setSecondLine('');
      return;
    }

    const suras = pages.map((p) => p.startSura);
    const juzs = pages.map((p) => p.startJuz);
    const pageNumbers = pages.map((p) => NumberFormatter.shared.format(p.pageNumber)).join(' - ');

    const minJuz = Math.min(...juzs.map((j) => j.juzNumber));
    const pageDescription = lFormat('page_description', pageNumbers, NumberFormatter.shared.format(minJuz));

    const minSura = suras.reduce((min, s) => (s.suraNumber < min.suraNumber ? s : min), suras[0]);
    setFirstLine(minSura.localizedName(true));
    setSecondLine(pageDescription);
  }, []);

  // Handle tap on quran view
  const handleTap = useCallback(() => {
    if (!interactorState.contentStatus) {
      setBarsHidden(!barsHidden);
    }
  }, [interactorState.contentStatus, barsHidden]);

  // Handle back button
  const handleBack = useCallback(() => {
    interactor.onBackTapped();
  }, [interactor]);

  // Handle bookmark button
  const handleBookmark = useCallback(() => {
    interactor.toggleBookmark();
  }, [interactor]);

  // Handle more button
  const handleMore = useCallback(() => {
    interactor.onMoreBarButtonTapped();
  }, [interactor]);

  // Content listener
  const contentListener: ContentListener = useMemo(
    () => ({
      userWillBeginDragScroll() {
        interactor.userWillBeginDragScroll();
      },
      presentAyahMenu(point: Point, verses: AyahNumber[]) {
        interactor.presentAyahMenu(point, verses);
      },
    }),
    [interactor]
  );

  // Background color
  const backgroundColor = ThemeService.shared.themeStyle.backgroundColor;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar hidden={statusBarHidden} animated />

      {/* Content */}
      <View style={styles.contentContainer} ref={pagesViewRef}>
        {interactorState.contentStatus ? (
          <ContentStatusView status={interactorState.contentStatus} />
        ) : (
          <TouchableOpacity
            style={styles.tapArea}
            activeOpacity={1}
            onPress={handleTap}
          >
            {/* Content will be rendered here via ContentScreen */}
            {interactor.getContentViewModel() && (
              <ContentScreen
                viewModel={interactor.getContentViewModel()!}
                renderArabicPage={() => null}
                renderTranslationPage={() => null}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Navigation Bar */}
      <Animated.View style={[styles.navigationBar, { opacity: barsOpacity }]}>
        <SafeAreaView style={styles.navigationBarContent}>
          <TouchableOpacity onPress={handleBack} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.label} />
          </TouchableOpacity>

          <TwoLineNavigationTitle firstLine={firstLine} secondLine={secondLine} />

          <View style={styles.rightButtons}>
            <TouchableOpacity onPress={handleBookmark} style={styles.navButton}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isBookmarked ? theme.colors.destructive : theme.colors.label}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMore} style={styles.navButton}>
              <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={theme.colors.label} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Audio Banner (bottom) */}
      <Animated.View
        style={[
          styles.audioBannerContainer,
          { opacity: barsOpacity },
        ]}
        pointerEvents={barsHidden ? 'none' : 'auto'}
      >
        {/* Audio banner will be rendered here */}
      </Animated.View>
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
  contentContainer: {
    flex: 1,
  },
  tapArea: {
    flex: 1,
  },
  navigationBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  navigationBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 44,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  navButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  titleFirstLine: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  titleSecondLine: {
    fontSize: 15,
    fontWeight: '300',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioBannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentStatusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
  },
});

