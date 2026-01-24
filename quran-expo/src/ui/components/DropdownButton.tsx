/**
 * DropdownButton.swift → DropdownButton.tsx
 *
 * A dropdown/picker button component.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { CORNER_RADIUS, Spacing } from '../dimensions';

// ============================================================================
// DropdownButton Component
// ============================================================================

export interface DropdownButtonProps<T> {
  /** Available items */
  items: T[];
  /** Currently selected item */
  selectedItem: T;
  /** Called when selection changes */
  onSelect: (item: T) => void;
  /** Renders the display text for an item */
  renderItem: (item: T) => string;
  /** Optional key extractor */
  keyExtractor?: (item: T) => string;
}

/**
 * A dropdown/picker button component.
 */
export function DropdownButton<T>({
  items,
  selectedItem,
  onSelect,
  renderItem,
  keyExtractor,
}: DropdownButtonProps<T>) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
  };
  
  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[styles.button, { borderColor: theme.colors.separator }]}
      >
        <Text style={[styles.buttonText, { color: theme.colors.label }]}>
          {renderItem(selectedItem)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={12}
          color={theme.colors.label}
          style={styles.chevron}
        />
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={[styles.dropdown, { backgroundColor: theme.colors.secondarySystemBackground }]}>
            <FlatList
              data={items}
              keyExtractor={keyExtractor ?? ((item, index) => String(index))}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    item === selectedItem && { backgroundColor: theme.appIdentity + '20' },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.itemText, { color: theme.colors.label }]}>
                    {renderItem(item)}
                  </Text>
                  {item === selectedItem && (
                    <Ionicons name="checkmark" size={20} color={theme.appIdentity} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: CORNER_RADIUS,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
  },
  chevron: {
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dropdown: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: CORNER_RADIUS,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  itemText: {
    fontSize: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});

