import React from 'react';
import { Tabs } from 'expo-router'; // Native Expo Router file-based tab engine
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initializeDatabase } from '../database/dbInit';

type TabIconProps = { color: ColorValue };

function CalendarIcon({ color }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <View style={[styles.calendarBody, { borderColor: color }]}>
        <View style={[styles.calendarHeader, { backgroundColor: color }]} />
        <View style={[styles.calendarDot, styles.calendarDotLeft, { backgroundColor: color }]} />
        <View style={[styles.calendarDot, styles.calendarDotRight, { backgroundColor: color }]} />
      </View>
      <View style={[styles.calendarRing, styles.calendarRingLeft, { backgroundColor: color }]} />
      <View style={[styles.calendarRing, styles.calendarRingRight, { backgroundColor: color }]} />
    </View>
  );
}

function MealIcon({ color }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <View style={[styles.clocheDome, { borderColor: color }]} />
      <View style={[styles.clocheHandle, { backgroundColor: color }]} />
      <View style={[styles.clocheBase, { backgroundColor: color }]} />
    </View>
  );
}

function GearIcon({ color }: TabIconProps) {
  return (
    <View style={styles.gearIcon}>
      {Array.from({ length: 8 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.gearTooth,
            { backgroundColor: color, transform: [{ rotate: `${index * 45}deg` }] },
          ]}
        />
      ))}
      <View style={[styles.gearCenter, { backgroundColor: color }]} />
    </View>
  );
}

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
            tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
          }}
        />

        {/* Tab 2: Maps directly to the app/library.tsx file (The Recipe Pool management list) */}
        <Tabs.Screen
          name="library"
          options={{
            title: 'Meal Library',
            tabBarIcon: ({ color }) => <MealIcon color={color} />,
          }}
        />

        {/* Tab 3: Maps directly to the app/settings.tsx file (Configuration panels and rules) */}
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <GearIcon color={color} />
            ),
          }}
        />
      </Tabs>
      
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBody: {
    width: 18,
    height: 17,
    borderWidth: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  calendarHeader: {
    height: 3,
    marginTop: 3,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  calendarRing: {
    position: 'absolute',
    top: 1,
    width: 2,
    height: 6,
    borderRadius: 1,
  },
  calendarRingLeft: {
    left: 6,
  },
  calendarRingRight: {
    right: 6,
  },
  calendarDot: {
    position: 'absolute',
    top: 9,
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  calendarDotLeft: {
    left: 4,
  },
  calendarDotRight: {
    right: 4,
  },
  clocheDome: {
    position: 'absolute',
    top: 5,
    width: 18,
    height: 12,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  clocheHandle: {
    position: 'absolute',
    top: 2,
    width: 6,
    height: 3,
    borderRadius: 3,
  },
  clocheBase: {
    position: 'absolute',
    bottom: 5,
    width: 23,
    height: 2,
    borderRadius: 1,
  },
  gearIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearTooth: {
    position: 'absolute',
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  gearCenter: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
});
