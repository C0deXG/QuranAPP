/**
 * MoreMenuTranslationSelector, MoreMenuWordPointerType → MoreMenuListItem.tsx
 *
 * List item menu items.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../ui/theme';
import { DisclosureIndicator } from '../../../ui/components';

// ============================================================================
// Types
// ============================================================================

interface MoreMenuListItemProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
}

// ============================================================================
// MoreMenuListItem Component
// ============================================================================

export function MoreMenuListItem({
  title,
  subtitle,
  onPress,
}: MoreMenuListItemProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={[styles.title, { color: theme.colors.label }]}>{title}</Text>
      <View style={styles.right}>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.secondaryLabel }]}>
            {subtitle}
          </Text>
        )}
        <DisclosureIndicator />
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 17,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginRight: 8,
  },
});

