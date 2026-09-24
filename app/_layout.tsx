import React from 'react';
import { Tabs } from 'expo-router'; // Native Expo Router file-based tab engine
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initializeDatabase } from '../database/dbInit';

/**
 * Root Layout Orchestrator.
 * Manages the SQLite database lifecycle wrapper and maps the application's bottom tab bar.
 */
export default function RootLayout() {
  const insets = useSafeAreaInsets(); // Hook to get device safe area insets for proper padding
  return (
    // 1. Core Data Layer: Initializes the meals database and seeds default weekday rules
    <SQLiteProvider databaseName="meals.db" onInit={initializeDatabase}>
      
      {/* Configure the device physical status bar to blend seamlessly with the premium dark theme */}
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0E" />

      {/* 2. Global Navigation Layer: Defines the style properties of the tab controller */}
      <Tabs
        screenOptions={{
          // Screen Header Configuration
          headerStyle: {
            backgroundColor: '#0D0D0E', // Deep obsidian background
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.06)', // Thin sleek container rule line
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
            letterSpacing: -0.5,
            color: '#F2F2F7', // Crisp off-white text
          },
          
          // Bottom Tab Bar Container Configuration
          tabBarStyle: {
            backgroundColor: '#16161A', // Rich slate accent container color
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.06)',
            height: 60 + insets.bottom, // Dynamic height to accommodate device safe area insets
            paddingBottom: 8 + insets.bottom, // Extra padding for devices with gesture navigation
            paddingTop: 8,
          },
          
          // Selection Indicator Highlights
          tabBarLabelPosition: 'below-icon',
          tabBarActiveTintColor: '#FF9F0A',   // Premium vibrant amber/orange highlight for active tabs
          tabBarInactiveTintColor: '#636366', // Deep muted metallic gray for background tabs
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        {/* Tab 1: Maps directly to the app/index.tsx file (Your This Week Calendar View) */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'This Week',
            // Simple visual anchor emojis used until custom SVG icons are linked
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 18 }}>{focused ? '📅' : '📆'}</Text>
            ),
          }}
        />

        {/* Tab 2: Maps directly to the app/library.tsx file (The Recipe Pool management list) */}
        <Tabs.Screen
          name="library"
          options={{
            title: 'Meal Library',
            tabBarIcon: () => (
              <Text style={{ fontSize: 18 }}>🍳</Text>
            ),
          }}
        />

        {/* Tab 3: Maps directly to the app/settings.tsx file (Configuration panels and rules) */}
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: () => (
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            ),
          }}
        />
      </Tabs>
      
    </SQLiteProvider>
  );
}
