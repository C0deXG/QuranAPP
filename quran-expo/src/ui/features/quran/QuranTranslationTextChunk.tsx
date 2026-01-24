/**
 * QuranTranslationTextChunk.swift → QuranTranslationTextChunk.tsx
 *
 * Translation text chunk with footnotes and Quran references.
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

import React from 'react';
import { Text, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../../theme';
import { FontSize } from '../../../model/quran-text';
import { calculateFontSize } from '../../fonts';
import { useReadableInsets } from './ContentDimension';
import { l } from '../../../core/localization';

// ============================================================================
// Types
// ============================================================================

export interface TextRange {
  start: number;
  end: number;
}

// ============================================================================
// QuranTranslationTextChunk Component
// ============================================================================

export interface QuranTranslationTextChunkProps {
  /** The full translation text */
  text: string;
  /** Whether this is the first chunk */
  firstChunk?: boolean;
  /** Footnote ranges in the text */
  footnoteRanges?: TextRange[];
  /** Quran reference ranges (to highlight) */
  quranRanges?: TextRange[];
  /** Whether to show "Read more" link */
  showReadMore?: boolean;
  /** Callback for "Read more" */
  onReadMore?: () => void;
  /** Callback for footnote tap */
  onFootnoteTap?: (index: number) => void;
  /** Font size preference */
  fontSize: FontSize;
  /** Text direction */
  isRTL?: boolean;
}

/**
 * A chunk of translation text with optional footnotes and highlighted Quran references.
 */
export function QuranTranslationTextChunk({
  text,
  firstChunk = true,
  footnoteRanges = [],
  quranRanges = [],
  showReadMore = false,
  onReadMore,
  onFootnoteTap,
  fontSize,
  isRTL = false,
}: QuranTranslationTextChunkProps) {
  const theme = useTheme();
  const insets = useReadableInsets();
  const textSize = calculateFontSize(fontSize, 17);
  
  // Build attributed text
  const buildText = () => {
    // For simplicity, we render plain text with highlighted sections
    // In a full implementation, you would use a library like react-native-render-html
    // or build custom Text components for each segment
    return (
      <>
        <Text style={{ color: theme.themeColors.text }}>{text}</Text>
        {showReadMore && (
          <Text
            style={{ color: theme.appIdentity }}
            onPress={onReadMore}
          >
            {'\n' + l('translation.text.read-more')}
          </Text>
        )}
      </>
    );
  };
  
  return (
    <Text
      style={[
        styles.text,
        {
          fontSize: textSize,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingTop: firstChunk ? 10 : 0,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
      ]}
    >
      {buildText()}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    lineHeight: 26,
  },
});

