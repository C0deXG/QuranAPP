/**
 * SingleChoiceRow.swift + SingleChoiceSelector.swift → SingleChoice.tsx
 *
 * Single choice selection components.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

// ============================================================================
// Types
// ============================================================================

/**
 * A section in a single choice list.
 */
export interface SingleChoiceSection<Item> {
  /** Optional section header */
  header?: string;
  /** Items in this section */
  items: Item[];
}

// ============================================================================
// SingleChoiceRow
// ============================================================================

export interface SingleChoiceRowProps {
  /** Text to display */
  text: string;
  /** Whether this row is selected */
  selected: boolean;
  /** Callback when row is pressed */
  onPress?: () => void;
}

/**
 * A single row in a choice list with checkmark indicator.
 */
export function SingleChoiceRow({ text, selected, onPress }: SingleChoiceRowProps) {
  const theme = useTheme();
  
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.rowText, { color: theme.colors.label }]}>
        {text}
      </Text>
      <View style={styles.spacer} />
      {selected && (
        <Ionicons name="checkmark" size={22} color={theme.appIdentity} />
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// SingleChoiceSelectorView
// ============================================================================

export interface SingleChoiceSelectorViewProps<Item> {
  /** Sections with items */
  sections: SingleChoiceSection<Item>[];
  /** Currently selected item */
  selected: Item | null;
  /** Function to get display text for an item */
  itemText: (item: Item) => string;
  /** Function to get a unique key for an item */
  itemKey: (item: Item) => string;
  /** Callback when an item is selected */
  onSelect: (item: Item) => void;
}

/**
 * A list view for selecting a single item from sections.
 */
export function SingleChoiceSelectorView<Item>({
  sections,
  selected,
  itemText,
  itemKey,
  onSelect,
}: SingleChoiceSelectorViewProps<Item>) {
  const theme = useTheme();
  
  // Check if all sections have headers
  const hasSections = sections.some((s) => s.header);
  
  if (hasSections) {
    return (
      <SectionList
        sections={sections.map((section) => ({
          title: section.header,
          data: section.items,
        }))}
        keyExtractor={(item) => itemKey(item)}
        renderItem={({ item }) => (
          <SingleChoiceRow
            text={itemText(item)}
            selected={selected !== null && itemKey(item) === itemKey(selected)}
            onPress={() => onSelect(item)}
          />
        )}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <View style={[styles.sectionHeader, { backgroundColor: theme.colors.systemGroupedBackground }]}>
              <Text style={[styles.sectionHeaderText, { color: theme.colors.secondaryLabel }]}>
                {section.title}
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
        )}
        style={[styles.list, { backgroundColor: theme.colors.systemBackground }]}
      />
    );
  }
  
  // Flatten items for simple list
  const allItems = sections.flatMap((s) => s.items);
  
  return (
    <FlatList
      data={allItems}
      keyExtractor={(item) => itemKey(item)}
      renderItem={({ item }) => (
        <SingleChoiceRow
          text={itemText(item)}
          selected={selected !== null && itemKey(item) === itemKey(selected)}
          onPress={() => onSelect(item)}
        />
      )}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
      )}
      style={[styles.list, { backgroundColor: theme.colors.systemBackground }]}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: {
    fontSize: 17,
  },
  spacer: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionHeaderText: {
    fontSize: 13,
    textTransform: 'uppercase',
  },
});

