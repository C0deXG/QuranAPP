/**
 * AppWhatsNewController.swift → WhatsNewScreen.tsx
 *
 * What's new display screen.
 *
 * Quran.com. All rights reserved.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../ui/theme';
import { l } from '../../core/localization';
import { mapSFSymbolToIonicon } from '../../ui/images';
import {
  type WhatsNewVersion,
  type WhatsNewItem,
  getWhatsNewItemTitle,
  getWhatsNewItemSubtitle,
} from './app-whats-new';

// ============================================================================
// WhatsNewItemView Component
// ============================================================================

interface WhatsNewItemViewProps {
  item: WhatsNewItem;
}

function WhatsNewItemView({ item }: WhatsNewItemViewProps) {
  const theme = useTheme();
  const iconName = mapSFSymbolToIonicon(item.image);

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.tint + '20' }]}>
        <Ionicons name={iconName as any} size={28} color={theme.colors.tint} />
      </View>
      <View style={styles.itemTextContainer}>
        <Text style={[styles.itemTitle, { color: theme.colors.label }]}>
          {getWhatsNewItemTitle(item)}
        </Text>
        <Text style={[styles.itemSubtitle, { color: theme.colors.secondaryLabel }]}>
          {getWhatsNewItemSubtitle(item)}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// WhatsNewScreen Props
// ============================================================================

export interface WhatsNewScreenProps {
  /** Versions to display */
  versions: WhatsNewVersion[];

  /** Whether the modal is visible */
  visible: boolean;

  /** Called when the modal should be dismissed */
  onDismiss: () => void;
}

// ============================================================================
// WhatsNewScreen Component
// ============================================================================

/**
 * What's new display screen.
 *
 * 1:1 translation of iOS WhatsNewViewController presentation.
 */
export function WhatsNewScreen({ versions, visible, onDismiss }: WhatsNewScreenProps) {
  const theme = useTheme();

  // Flatten all items from all versions
  const allItems = versions.flatMap((version) => version.items);

  const handleContinue = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
        {/* Title */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: theme.colors.label }]}>
            {l('new.title')}
          </Text>

          {/* Items */}
          <View style={styles.itemsContainer}>
            {allItems.map((item, index) => (
              <WhatsNewItemView key={`${item.title}-${index}`} item={item} />
            ))}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.colors.tint }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{l('new.action')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  scrollContent: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  itemsContainer: {
    gap: 24,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  continueButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

