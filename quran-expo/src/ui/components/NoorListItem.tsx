/**
 * NoorListItem.swift → NoorListItem.tsx
 *
 * A versatile list item component with support for:
 * - Leading edge color bar
 * - Icon
 * - Heading, subheading, title, subtitle
 * - RTL right-aligned pretitle/subtitle
 * - Various accessories (text, disclosure, download, icon)
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { NoorSystemImage, getIoniconName } from '../images';
import { DisclosureIndicator } from './DisclosureIndicator';

// ============================================================================
// Types
// ============================================================================

export type SubtitleLocation = 'trailing' | 'bottom';

export interface NoorListItemSubtitle {
  label?: string;
  text: string;
  location: SubtitleLocation;
}

export interface NoorListItemImage {
  image: NoorSystemImage;
  color?: string;
}

export type NoorListItemAccessory =
  | { type: 'text'; text: string }
  | { type: 'disclosureIndicator' }
  | { type: 'image'; image: NoorSystemImage; color?: string };

export interface NoorListItemProps {
  /** Leading edge color bar */
  leadingEdgeLineColor?: string;
  /** Icon on the left */
  image?: NoorListItemImage;
  /** Heading text (accent color) */
  heading?: string;
  /** Subheading text (secondary) */
  subheading?: string;
  /** Right-aligned pretitle (for RTL) */
  rightPretitle?: string;
  /** Main title */
  title: string;
  /** Right-aligned subtitle (for RTL) */
  rightSubtitle?: string;
  /** Subtitle configuration */
  subtitle?: NoorListItemSubtitle;
  /** Accessory on the right */
  accessory?: NoorListItemAccessory;
  /** Action when pressed */
  onPress?: () => void | Promise<void>;
}

// ============================================================================
// NoorListItem Component
// ============================================================================

/**
 * A versatile list item component.
 */
export function NoorListItem({
  leadingEdgeLineColor,
  image,
  heading,
  subheading,
  rightPretitle,
  title,
  rightSubtitle,
  subtitle,
  accessory,
  onPress,
}: NoorListItemProps) {
  const theme = useTheme();
  
  const content = (
    <View style={styles.container}>
      {/* Leading Edge Color Bar */}
      {leadingEdgeLineColor && (
        <View style={[styles.leadingEdge, { backgroundColor: leadingEdgeLineColor }]} />
      )}
      
      {/* Icon */}
      {image && (
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIoniconName(image.image) as keyof typeof Ionicons.glyphMap}
            size={22}
            color={image.color ?? theme.appIdentity}
          />
        </View>
      )}
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Heading */}
        {heading && (
          <Text style={[styles.heading, { color: theme.appIdentity }]}>
            {heading}
          </Text>
        )}
        
        {/* Subheading */}
        {subheading && (
          <Text style={[styles.subheading, { color: theme.colors.secondaryLabel }]}>
            {subheading}
          </Text>
        )}
        
        {/* Right Pretitle (RTL aligned) */}
        {rightPretitle && (
          <View style={styles.rtlRow}>
            <Text style={[styles.rightPretitle, { color: theme.colors.label }]} numberOfLines={2}>
              {rightPretitle}
            </Text>
          </View>
        )}
        
        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.label }]}>
          {title}
        </Text>
        
        {/* Right Subtitle (RTL aligned) */}
        {rightSubtitle && (
          <View style={styles.rtlRow}>
            <Text style={[styles.rightSubtitle, { color: theme.colors.secondaryLabel }]}>
              {rightSubtitle}
            </Text>
          </View>
        )}
        
        {/* Bottom Subtitle */}
        {subtitle?.location === 'bottom' && (
          <Text style={[styles.bottomSubtitle, { color: theme.colors.secondaryLabel }]}>
            {subtitle.label && (
              <Text style={styles.subtitleLabel}>{subtitle.label}</Text>
            )}
            {subtitle.text}
          </Text>
        )}
      </View>
      
      {/* Trailing Subtitle or Accessory */}
      {(subtitle?.location === 'trailing' || accessory) && (
        <View style={styles.trailing}>
          {subtitle?.location === 'trailing' && (
            <Text style={[styles.trailingSubtitle, { color: theme.colors.secondaryLabel }]}>
              {subtitle.text}
            </Text>
          )}
          
          {accessory && renderAccessory(accessory, theme)}
        </View>
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
}

function renderAccessory(accessory: NoorListItemAccessory, theme: ReturnType<typeof useTheme>) {
  switch (accessory.type) {
    case 'text':
      return (
        <Text style={[styles.accessoryText, { color: theme.colors.secondaryLabel }]}>
          {accessory.text}
        </Text>
      );
    case 'disclosureIndicator':
      return <DisclosureIndicator />;
    case 'image':
      return (
        <Ionicons
          name={getIoniconName(accessory.image) as keyof typeof Ionicons.glyphMap}
          size={20}
          color={accessory.color ?? theme.colors.secondaryLabel}
        />
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  leadingEdge: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 8,
    borderRadius: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  heading: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  subheading: {
    fontSize: 12,
    marginBottom: 2,
  },
  rtlRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    marginBottom: 2,
  },
  rightPretitle: {
    fontSize: 16,
    textAlign: 'right',
  },
  title: {
    fontSize: 17,
  },
  rightSubtitle: {
    fontSize: 12,
  },
  bottomSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  subtitleLabel: {
    fontWeight: '600',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  trailingSubtitle: {
    fontSize: 15,
    marginRight: 8,
  },
  accessoryText: {
    fontSize: 15,
    fontWeight: '300',
  },
});

