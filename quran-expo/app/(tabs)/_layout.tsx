/**
 * Tab Layout
 *
 * Bottom tab navigation matching the iOS tab structure.
 *
 * Quran.com. All rights reserved.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/ui/theme';
import { l } from '@/src/core/localization';
import { HapticTab } from '@/components/haptic-tab';

/**
 * Tab layout component.
 */
export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: theme.colors.systemBackground,
          borderTopColor: theme.colors.separator,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.systemBackground,
        },
        headerTintColor: theme.colors.label,
        headerShadowVisible: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: l('quran_sura'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'document-text' : 'document-text-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: l('notes.title'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'pencil' : 'pencil-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: l('bookmarks.title'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'bookmark' : 'bookmark-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: l('search.title'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'search' : 'search-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: l('menu.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
