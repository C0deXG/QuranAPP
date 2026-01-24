/**
 * NoorSection.swift → NoorSection.tsx
 *
 * Section components for lists.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { Spacing } from '../dimensions';

// ============================================================================
// NoorBasicSection
// ============================================================================

export interface NoorBasicSectionProps {
  /** Section title (header) */
  title?: string;
  /** Section footer */
  footer?: string;
  /** Section content */
  children: React.ReactNode;
}

/**
 * A basic section with optional header and footer.
 */
export function NoorBasicSection({ title, footer, children }: NoorBasicSectionProps) {
  const theme = useTheme();
  
  return (
    <View style={styles.section}>
      {title && (
        <Text style={[styles.header, { color: theme.colors.secondaryLabel }]}>
          {title.toUpperCase()}
        </Text>
      )}
      
      <View style={[styles.content, { backgroundColor: theme.colors.secondarySystemBackground }]}>
        {children}
      </View>
      
      {footer && (
        <Text style={[styles.footer, { color: theme.colors.secondaryLabel }]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// NoorSection
// ============================================================================

export interface Identifiable {
  id: string | number;
}

export interface NoorSectionProps<T extends Identifiable> {
  /** Section title (header) */
  title?: string;
  /** Items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T) => React.ReactNode;
  /** Item separator */
  separator?: boolean;
}

/**
 * A section that renders a list of items.
 */
export function NoorSection<T extends Identifiable>({
  title,
  items,
  renderItem,
  separator = true,
}: NoorSectionProps<T>) {
  const theme = useTheme();
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <NoorBasicSection title={title}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {renderItem(item)}
          {separator && index < items.length - 1 && (
            <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
          )}
        </React.Fragment>
      ))}
    </NoorBasicSection>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  header: {
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: Spacing.md,
    paddingBottom: 8,
  },
  content: {
    borderRadius: 10,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  footer: {
    fontSize: 13,
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.md,
  },
});

