/**
 * ReadingSelector.swift + ReadingSelectorViewController.swift → ReadingSelectorScreen.tsx
 *
 * Reading selector screen component.
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
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { l } from '../../core/localization';
import { useTheme } from '../../ui/theme';
import { Dimensions, CORNER_RADIUS } from '../../ui/dimensions';
import { Reading } from '../../model/quran-kit';
import type { ReadingInfo } from './reading-info';
import { getReadingImageName } from './reading-info';
import {
  ReadingSelectorViewModel,
  type ReadingSelectorViewState,
} from './reading-selector-view-model';

// ============================================================================
// Types
// ============================================================================

export interface ReadingSelectorScreenProps {
  viewModel: ReadingSelectorViewModel;
}

// ============================================================================
// ReadingSelectorScreen Component
// ============================================================================

export function ReadingSelectorScreen({ viewModel }: ReadingSelectorScreenProps) {
  const theme = useTheme();
  const [state, setState] = useState<ReadingSelectorViewState>(viewModel.state);
  const [detailsReading, setDetailsReading] = useState<ReadingInfo<Reading> | null>(null);

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

  // Handle reading selection
  const handleSelectReading = useCallback(
    (reading: Reading) => {
      viewModel.showReading(reading);
      setDetailsReading(null);
    },
    [viewModel]
  );

  // Handle show details
  const handleShowDetails = useCallback((readingInfo: ReadingInfo<Reading>) => {
    setDetailsReading(readingInfo);
  }, []);

  // Handle close details
  const handleCloseDetails = useCallback(() => {
    setDetailsReading(null);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemGroupedBackground }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.label }]}>
          {l('reading.selector.title')}
        </Text>
        <Text style={[styles.headerPrompt, { color: theme.colors.secondaryLabel }]}>
          {l('reading.selector.selection-description')}
        </Text>
      </View>

      {/* Reading List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {state.readings.map((readingInfo) => {
          const isSelected = state.selectedReading === readingInfo.value;
          const progress = isSelected ? state.progress : null;

          return (
            <ReadingItem
              key={readingInfo.value}
              reading={readingInfo}
              isSelected={isSelected}
              progress={progress}
              onPress={() => handleShowDetails(readingInfo)}
            />
          );
        })}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={detailsReading !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseDetails}
      >
        {detailsReading && (
          <ReadingDetails
            reading={detailsReading}
            onSelect={() => handleSelectReading(detailsReading.value)}
            onClose={handleCloseDetails}
          />
        )}
      </Modal>
    </View>
  );
}

// ============================================================================
// ReadingItem Component
// ============================================================================

interface ReadingItemProps {
  reading: ReadingInfo<Reading>;
  isSelected: boolean;
  progress: number | null;
  onPress: () => void;
}

function ReadingItem({ reading, isSelected, progress, onPress }: ReadingItemProps) {
  const theme = useTheme();
  const imageName = getReadingImageName(reading.value);

  return (
    <TouchableOpacity
      style={[
        styles.readingItem,
        { backgroundColor: theme.colors.secondarySystemGroupedBackground },
        isSelected && { borderColor: theme.colors.tint, borderWidth: 2 },
      ]}
      onPress={onPress}
    >
      {/* Checkmark */}
      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: theme.colors.tint }]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
      )}

      {/* Content */}
      <View style={styles.readingContent}>
        {/* Progress */}
        {progress !== null && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.tint, width: `${progress * 100}%` },
              ]}
            />
          </View>
        )}

        {/* Title */}
        <Text style={[styles.readingTitle, { color: theme.colors.label }]}>
          {reading.title}
        </Text>

        {/* Description */}
        <Text
          style={[styles.readingDescription, { color: theme.colors.secondaryLabel }]}
          numberOfLines={3}
        >
          {reading.description}
        </Text>
      </View>

      {/* Image */}
      <View style={[styles.readingImageContainer, { backgroundColor: theme.colors.tertiarySystemBackground }]}>
        {/* Placeholder for reading image */}
        <View style={styles.readingImagePlaceholder}>
          <Ionicons name="book-outline" size={40} color={theme.colors.secondaryLabel} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// ReadingDetails Component
// ============================================================================

interface ReadingDetailsProps {
  reading: ReadingInfo<Reading>;
  onSelect: () => void;
  onClose: () => void;
}

function ReadingDetails({ reading, onSelect, onClose }: ReadingDetailsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.detailsContainer, { backgroundColor: theme.colors.systemBackground }]}>
      {/* Header */}
      <View style={[styles.detailsHeader, { borderBottomColor: theme.colors.separator }]}>
        <TouchableOpacity onPress={onSelect} style={styles.detailsHeaderButton}>
          <Text style={[styles.detailsHeaderButtonText, { color: theme.colors.tint }]}>
            {l('reading.selector.selectMushaf.short')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.detailsTitle, { color: theme.colors.label }]}>
          {reading.title}
        </Text>

        <TouchableOpacity onPress={onClose} style={styles.detailsHeaderButton}>
          <Ionicons name="close-circle" size={24} color={theme.colors.label} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.detailsContent}>
        {/* Select Button */}
        <TouchableOpacity style={[styles.selectButton, { backgroundColor: theme.colors.tint }]} onPress={onSelect}>
          <Text style={styles.selectButtonText}>
            {l('reading.selector.selectMushaf.long')}
          </Text>
        </TouchableOpacity>

        {/* Description */}
        <Text style={[styles.detailsDescription, { color: theme.colors.label }]}>
          {reading.description}
        </Text>

        {/* Properties */}
        <View style={styles.propertiesList}>
          {reading.properties.map((property, index) => (
            <View key={index} style={styles.propertyRow}>
              <Ionicons
                name={property.type === 'supports' ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={property.type === 'supports' ? theme.colors.tint : theme.colors.systemRed}
                style={styles.propertyIcon}
              />
              <Text style={[styles.propertyText, { color: theme.colors.label }]}>
                {property.property}
              </Text>
            </View>
          ))}
        </View>

        {/* Image Placeholder */}
        <View style={[styles.detailsImageContainer, { backgroundColor: theme.colors.tertiarySystemBackground }]}>
          <Ionicons name="book-outline" size={60} color={theme.colors.secondaryLabel} />
        </View>

        {/* Select Button (bottom) */}
        <TouchableOpacity style={[styles.selectButton, { backgroundColor: theme.colors.tint }]} onPress={onSelect}>
          <Text style={styles.selectButtonText}>
            {l('reading.selector.selectMushaf.long')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerPrompt: {
    fontSize: 13,
    marginTop: 4,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  readingItem: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: CORNER_RADIUS,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  readingContent: {
    flex: 0.65,
    paddingRight: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  readingTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  readingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  readingImageContainer: {
    flex: 0.35,
    borderRadius: CORNER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  readingImagePlaceholder: {
    padding: 20,
  },
  // Details
  detailsContainer: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailsHeaderButton: {
    padding: 4,
  },
  detailsHeaderButtonText: {
    fontSize: 15,
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  detailsContent: {
    padding: 16,
  },
  detailsDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginVertical: 16,
  },
  propertiesList: {
    marginBottom: 16,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  propertyText: {
    flex: 1,
    fontSize: 15,
  },
  detailsImageContainer: {
    height: 200,
    borderRadius: CORNER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  selectButton: {
    paddingVertical: 14,
    borderRadius: CORNER_RADIUS,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

