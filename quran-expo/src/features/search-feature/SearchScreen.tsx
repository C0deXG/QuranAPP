/**
 * SearchView.swift + SearchViewController.swift → SearchScreen.tsx
 *
 * Search screen component.
 *
 * Quran.com. All rights reserved.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l, lFormat, lAndroid } from '../../core/localization';
import { logger } from '../../core/logging';
import { NumberFormatter } from '../../core/localization';
import { useTheme } from '../../ui/theme';
import { DataUnavailableView, NoorListItem, LoadingView } from '../../ui/components';
import type { SearchResult, SearchResults, SearchResultsSource } from '../../model/quran-text';
import { SearchViewModel, type SearchViewState } from './search-view-model';

// ============================================================================
// Types
// ============================================================================

export interface SearchScreenProps {
  viewModel: SearchViewModel;
}

// ============================================================================
// SearchScreen Component
// ============================================================================

export function SearchScreen({ viewModel }: SearchScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<SearchViewState>(viewModel.state);
  const searchInputRef = useRef<TextInput>(null);

  // Subscribe to view model updates
  useEffect(() => {
    setState(viewModel.state);
    viewModel.addListener(setState);
    viewModel.start();

    return () => {
      viewModel.removeListener(setState);
    };
  }, [viewModel]);

  // Show error alert
  useEffect(() => {
    if (state.error) {
      Alert.alert(
        l('error'),
        state.error.message,
        [{ text: l('ok'), onPress: () => viewModel.clearError() }]
      );
    }
  }, [state.error, viewModel]);

  // Handle keyboard state changes
  useEffect(() => {
    if (state.keyboardState === 'closed') {
      Keyboard.dismiss();
    } else if (state.keyboardState === 'open') {
      searchInputRef.current?.focus();
    }
  }, [state.keyboardState]);

  // Handle search text change
  const handleSearchTextChange = useCallback(
    (text: string) => {
      logger.info(`[Search] textDidChange to ${text}`);
      viewModel.autocomplete(text);
    },
    [viewModel]
  );

  // Handle search submit
  const handleSearchSubmit = useCallback(() => {
    logger.info(`[Search] searchBarSearchButtonClicked ${state.searchTerm}`);
    viewModel.searchForUserTypedTerm();
  }, [viewModel, state.searchTerm]);

  // Handle search cancel
  const handleSearchCancel = useCallback(() => {
    logger.info('[Search] searchBarCancelButtonClicked');
    viewModel.reset();
  }, [viewModel]);

  // Handle focus
  const handleFocus = useCallback(() => {
    logger.info(`[Search] searchBarTextDidBeginEditing ${state.searchTerm}`);
    viewModel.setKeyboardState('open');
  }, [viewModel, state.searchTerm]);

  // Handle blur
  const handleBlur = useCallback(() => {
    logger.info(`[Search] searchBarTextDidEndEditing ${state.searchTerm}`);
    viewModel.setKeyboardState('closed');
  }, [viewModel, state.searchTerm]);

  // Handle search term selection
  const handleSearchTermSelect = useCallback(
    (term: string) => {
      viewModel.search(term);
    },
    [viewModel]
  );

  // Handle search result selection
  const handleSearchResultSelect = useCallback(
    (result: SearchResult, source: SearchResultsSource) => {
      viewModel.select(result, source);
    },
    [viewModel]
  );

  // Render autocompletion item
  const renderAutocompletionItem = useCallback(
    ({ item }: { item: string }) => {
      return (
        <TouchableOpacity
          style={[styles.listItem, { borderBottomColor: theme.colors.separator }]}
          onPress={() => handleSearchTermSelect(item)}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.secondaryLabel}
            style={styles.listItemIcon}
          />
          <Text
            style={[styles.listItemText, { color: theme.colors.label }]}
            numberOfLines={1}
          >
            {highlightAutocompletion(item, state.searchTerm, theme)}
          </Text>
        </TouchableOpacity>
      );
    },
    [theme, state.searchTerm, handleSearchTermSelect]
  );

  // Render recent/popular item
  const renderTermItem = useCallback(
    ({ item }: { item: string }) => {
      return (
        <TouchableOpacity
          style={[styles.listItem, { borderBottomColor: theme.colors.separator }]}
          onPress={() => handleSearchTermSelect(item)}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.secondaryLabel}
            style={styles.listItemIcon}
          />
          <Text style={[styles.listItemText, { color: theme.colors.label }]}>
            {item}
          </Text>
        </TouchableOpacity>
      );
    },
    [theme, handleSearchTermSelect]
  );

  // Render search result
  const renderSearchResult = useCallback(
    ({ item, source }: { item: SearchResult; source: SearchResultsSource }) => {
      const localizedVerse = item.ayah.localizedName;
      const arabicSuraName = item.ayah.sura.arabicSuraName;
      const pageNumber = NumberFormatter.shared.format(item.ayah.page.pageNumber);

      return (
        <NoorListItem
          subheading={`(${item.ayah.sura.suraNumber}) ${localizedVerse} ${arabicSuraName}`}
          title={item.text}
          titleHighlightRanges={item.ranges}
          accessory={{ type: 'text', text: pageNumber }}
          onPress={() => handleSearchResultSelect(item, source)}
        />
      );
    },
    [handleSearchResultSelect]
  );

  // Render content based on state
  const renderContent = () => {
    if (state.uiState.type === 'entry') {
      // Show autocompletions or entry view
      if (state.autocompletions.length > 0) {
        return (
          <FlatList
            data={state.autocompletions}
            keyExtractor={(item) => item}
            renderItem={renderAutocompletionItem}
            keyboardShouldPersistTaps="handled"
          />
        );
      }

      // Show recents and populars
      return (
        <FlatList
          data={[
            { type: 'section', title: l('search.recents.title'), items: state.recents },
            { type: 'section', title: l('search.popular.title'), items: viewModel.populars },
          ]}
          keyExtractor={(item, index) => `section-${index}`}
          renderItem={({ item }) => (
            <View>
              {item.items.length > 0 && (
                <>
                  <Text style={[styles.sectionHeader, { color: theme.colors.secondaryLabel }]}>
                    {item.title}
                  </Text>
                  {item.items.map((term) => (
                    <View key={term}>
                      {renderTermItem({ item: term })}
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
          keyboardShouldPersistTaps="handled"
        />
      );
    }

    // Search state
    if (state.searchState.type === 'searching') {
      return <LoadingView />;
    }

    // Search results
    const results = state.searchState.results;
    if (results.length === 0) {
      return (
        <DataUnavailableView
          title={lFormat('no_results', state.searchTerm)}
          text=""
          image="search"
        />
      );
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item, index) => `result-${index}`}
        renderItem={({ item: searchResults }) => {
          const title = getSourceTitle(searchResults.source);
          const countTitle = lFormat('search.result.count', title, searchResults.items.length);

          return (
            <View>
              <Text style={[styles.sectionHeader, { color: theme.colors.secondaryLabel }]}>
                {countTitle}
              </Text>
              {searchResults.items.map((result, index) => (
                <View key={`${result.ayah.sura.suraNumber}:${result.ayah.ayah}-${index}`}>
                  {renderSearchResult({ item: result, source: searchResults.source })}
                </View>
              ))}
            </View>
          );
        }}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.secondarySystemBackground }]}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.secondaryLabel}
          style={styles.searchIcon}
        />
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: theme.colors.label }]}
          placeholder={l('search.placeholder.text')}
          placeholderTextColor={theme.colors.tertiaryLabel}
          value={state.searchTerm}
          onChangeText={handleSearchTextChange}
          onSubmitEditing={handleSearchSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {state.searchTerm.length > 0 && (
          <TouchableOpacity onPress={handleSearchCancel} style={styles.cancelButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.secondaryLabel} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSourceTitle(source: SearchResultsSource): string {
  if (source.type === 'translation') {
    return source.translation.translationName;
  }
  return 'Quran';
}

function highlightAutocompletion(
  text: string,
  term: string,
  theme: ReturnType<typeof useTheme>
): React.ReactNode {
  if (!term) return text;

  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + term.length);
  const after = text.slice(index + term.length);

  return (
    <Text>
      {before}
      <Text style={{ color: theme.colors.secondaryLabel }}>{match}</Text>
      {after}
    </Text>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
  },
  cancelButton: {
    padding: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemIcon: {
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 17,
  },
});

