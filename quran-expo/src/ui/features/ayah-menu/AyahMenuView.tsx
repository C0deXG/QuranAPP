/**
 * AyahMenuView.swift → AyahMenuView.tsx
 *
 * Ayah context menu with actions like play, highlight, note, share.
 *
 * Quran.com. All rights reserved.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { NoorSystemImage, getIoniconName } from '../../images';
import { l } from '../../../core/localization';
import { NoteColor } from '../../../model/quran-annotations';
import { NoteCircle } from '../note';
import { getNoteColorValue, sortedNoteColors } from '../note/NoteColors';
import type { AyahMenuDataObject } from './AyahMenuTypes';
import { NoteState } from './AyahMenuTypes';

// ============================================================================
// Menu State
// ============================================================================

type MenuMode = 'list' | 'highlights';

// ============================================================================
// AyahMenuView Component
// ============================================================================

export interface AyahMenuViewProps {
  dataObject: AyahMenuDataObject;
}

/**
 * Ayah context menu that shows actions for selected verses.
 */
export function AyahMenuView({ dataObject }: AyahMenuViewProps) {
  const [mode, setMode] = useState<MenuMode>('list');
  
  const existingHighlightedColor = 
    dataObject.state === NoteState.Highlighted || dataObject.state === NoteState.Noted
      ? dataObject.highlightingColor
      : null;
  
  if (mode === 'list') {
    return (
      <ScrollView>
        <AyahMenuViewList
          dataObject={dataObject}
          showHighlights={() => setMode('highlights')}
        />
      </ScrollView>
    );
  }
  
  return (
    <ScrollView>
      <NoteCircles
        selectedColor={existingHighlightedColor}
        onSelect={dataObject.actions.highlight}
      />
    </ScrollView>
  );
}

// ============================================================================
// AyahMenuViewList
// ============================================================================

interface AyahMenuViewListProps {
  dataObject: AyahMenuDataObject;
  showHighlights: () => void;
}

function AyahMenuViewList({ dataObject, showHighlights }: AyahMenuViewListProps) {
  const theme = useTheme();
  
  const noteDeleteText = (() => {
    switch (dataObject.state) {
      case NoteState.NoHighlight:
        return '-';
      case NoteState.Highlighted:
        return l('ayah.menu.delete-highlight');
      case NoteState.Noted:
        return l('ayah.menu.delete-note');
    }
  })();
  
  return (
    <View style={styles.list}>
      {/* Play & Repeat Group */}
      <MenuGroup>
        <MenuRow
          title={l('play')}
          subtitle={dataObject.playSubtitle}
          icon={<Ionicons name={getIoniconName(NoorSystemImage.Play) as any} size={20} color={theme.colors.label} />}
          onPress={dataObject.actions.play}
        />
        <MenuDivider />
        <MenuRow
          title={l('ayah.menu.repeat')}
          subtitle={dataObject.repeatSubtitle}
          icon={<Ionicons name="repeat" size={20} color={theme.colors.label} />}
          onPress={dataObject.actions.repeatVerses}
        />
        <MenuDivider />
      </MenuGroup>
      
      {/* Highlight & Note Group */}
      <MenuGroup>
        <MenuDivider />
        
        {/* Quick highlight with current color (only when no highlight) */}
        {dataObject.state === NoteState.NoHighlight && (
          <>
            <MenuRow
              title={l('ayah.menu.highlight')}
              icon={<IconCircle color={dataObject.highlightingColor} />}
              onPress={() => dataObject.actions.highlight(dataObject.highlightingColor)}
            />
            <MenuDivider indented />
          </>
        )}
        
        {/* Color selector */}
        <MenuRow
          title={l('ayah.menu.highlight')}
          subtitle={l('ayah.menu.highlight-select-color')}
          icon={<IconCircles />}
          onPress={showHighlights}
        />
        <MenuDivider indented />
        
        {/* Add/Edit Note */}
        {dataObject.state === NoteState.Noted ? (
          <MenuRow
            title={l('ayah.menu.edit-note')}
            icon={<Ionicons name="chatbubble" size={20} color={getNoteColorValue(dataObject.highlightingColor)} />}
            onPress={dataObject.actions.addNote}
          />
        ) : (
          <MenuRow
            title={l('ayah.menu.add-note')}
            icon={<Ionicons name="add-circle" size={20} color={getNoteColorValue(dataObject.highlightingColor)} />}
            onPress={dataObject.actions.addNote}
          />
        )}
        
        {/* Delete note/highlight */}
        {dataObject.state !== NoteState.NoHighlight && (
          <>
            <MenuDivider indented />
            <MenuRow
              title={noteDeleteText}
              icon={<Ionicons name="trash" size={20} color="#FF3B30" />}
              onPress={dataObject.actions.deleteNote}
            />
          </>
        )}
        
        <MenuDivider />
      </MenuGroup>
      
      {/* Translation (only in non-translation view) */}
      {!dataObject.isTranslationView && (
        <MenuGroup>
          <MenuDivider />
          <MenuRow
            title={l('menu.translation')}
            icon={<Ionicons name="globe" size={20} color={theme.colors.label} />}
            onPress={dataObject.actions.showTranslation}
          />
          <MenuDivider />
        </MenuGroup>
      )}
      
      {/* Copy & Share Group */}
      <MenuGroup>
        <MenuDivider />
        <MenuRow
          title={l('ayah.menu.copy')}
          icon={<Ionicons name="copy" size={20} color={theme.colors.label} />}
          onPress={dataObject.actions.copy}
        />
        <MenuDivider indented />
        <MenuRow
          title={l('ayah.menu.share')}
          icon={<Ionicons name="share-outline" size={20} color={theme.colors.label} />}
          onPress={dataObject.actions.share}
        />
      </MenuGroup>
    </View>
  );
}

// ============================================================================
// MenuRow
// ============================================================================

interface MenuRowProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => Promise<void>;
}

function MenuRow({ title, subtitle, icon, onPress }: MenuRowProps) {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePress = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onPress();
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={isLoading}
      style={[
        styles.row,
        isPressed && { backgroundColor: theme.colors.systemFill },
      ]}
      activeOpacity={1}
    >
      <View style={styles.rowIcon}>
        {icon}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.colors.label }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: theme.colors.secondaryLabel }]}>
            {' '}{subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// MenuGroup
// ============================================================================

interface MenuGroupProps {
  children: React.ReactNode;
}

function MenuGroup({ children }: MenuGroupProps) {
  const theme = useTheme();
  
  return (
    <View style={[styles.group, { backgroundColor: theme.colors.secondarySystemBackground }]}>
      {children}
    </View>
  );
}

// ============================================================================
// MenuDivider
// ============================================================================

interface MenuDividerProps {
  indented?: boolean;
}

function MenuDivider({ indented }: MenuDividerProps) {
  const theme = useTheme();
  
  return (
    <View 
      style={[
        styles.divider,
        { backgroundColor: theme.colors.separator },
        indented && styles.dividerIndented,
      ]} 
    />
  );
}

// ============================================================================
// IconCircle (single color circle)
// ============================================================================

interface IconCircleProps {
  color: NoteColor;
}

function IconCircle({ color }: IconCircleProps) {
  return (
    <View style={[styles.iconCircle, { backgroundColor: getNoteColorValue(color) }]} />
  );
}

// ============================================================================
// IconCircles (stacked circles for "select color")
// ============================================================================

function IconCircles() {
  return (
    <View style={styles.iconCircles}>
      <View style={[styles.stackedCircle, styles.purpleCircle, { backgroundColor: getNoteColorValue(NoteColor.Purple) }]} />
      <View style={[styles.stackedCircle, styles.blueCircle, { backgroundColor: getNoteColorValue(NoteColor.Blue) }]} />
      <View style={[styles.stackedCircle, styles.greenCircle, { backgroundColor: getNoteColorValue(NoteColor.Green) }]} />
    </View>
  );
}

// ============================================================================
// NoteCircles (color picker)
// ============================================================================

interface NoteCirclesProps {
  selectedColor: NoteColor | null;
  onSelect: (color: NoteColor) => Promise<void>;
}

function NoteCircles({ selectedColor, onSelect }: NoteCirclesProps) {
  const theme = useTheme();
  
  return (
    <View style={styles.noteCircles}>
      {sortedNoteColors.map((color: NoteColor) => (
        <TouchableOpacity
          key={color}
          onPress={() => onSelect(color)}
          style={[
            styles.noteCircleWrapper,
            {
              shadowColor: theme.colors.tertiaryLabel,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 1,
            },
          ]}
        >
          <NoteCircle
            color={getNoteColorValue(color)}
            selected={color === selectedColor}
            size={36}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  group: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  rowIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 12,
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
  },
  rowSubtitle: {
    fontSize: 13,
    marginLeft: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  dividerIndented: {
    marginLeft: 60,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  iconCircles: {
    flexDirection: 'row',
    width: 36,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  stackedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
  purpleCircle: {
    left: 8,
    zIndex: 1,
  },
  blueCircle: {
    left: 4,
    zIndex: 2,
  },
  greenCircle: {
    left: 0,
    zIndex: 3,
  },
  noteCircles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  noteCircleWrapper: {
    elevation: 2,
  },
});
