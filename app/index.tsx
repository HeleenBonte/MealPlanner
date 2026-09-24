// app/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getCurrentWeekDates } from '../utils/dateHelpers';
import { globalStyles, COLORS } from '../styles/theme';

interface DisplayDay {
  date: string;
  dayName: string;
  mealText: string;
}

export default function WeekCalendarScreen() {
  const db = useSQLiteContext();
  const isFocused = useIsFocused(); // 🎯 Natively tracks when this tab screen is active
  
  const [schedule, setSchedule] = useState<DisplayDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Core Data Fetch Routine
  const loadSchedule = useCallback(async () => {
    // 1. Structural context safety guard check
    if (!db) {
      console.warn("⚠️ SQLite database client handle is not initialized yet.");
      return;
    }

    try {
      setIsLoading(true);
      const dates = getCurrentWeekDates();
      
      // Compute database placeholders string sequence (?,?,?,?,?,?,?)
      const placeholders = dates.map(() => '?').join(',');
      
      const rows = await db.getAllAsync<{ date: string; widget_display_string: string | null }>(
        `SELECT date, widget_display_string FROM scheduled_days WHERE date IN (${placeholders});`,
        dates
      );

      // 2. Safely map database rows into a flat display layout array
      const compiledSchedule: DisplayDay[] = dates.map(dateStr => {
        const matchingRow = rows.find(r => r.date === dateStr);
        const jsDate = new Date(dateStr);
        
        // Formats cleanly to simple day names
        const dayName = jsDate.toLocaleDateString('en-BE', { weekday: 'long' });

        return {
          date: dateStr,
          dayName: dayName,
          // Robust nullish coalescing check prevents data crashes if field returns empty row string states
          mealText: (matchingRow && matchingRow.widget_display_string) 
            ? matchingRow.widget_display_string 
            : 'Not Planned Yet 🍽️'
        };
      });

      setSchedule(compiledSchedule);
    } catch (error: any) {
      console.error('❌ Calendar query execution dropped:', error);
      // Pops a real dialog block window on the device so you can view any hidden syntax exceptions instantly
      Alert.alert('Database Load Error', error.message || String(error));
    } finally {
      // 3. Absolute Safety Rule: Turning off the spinner is guaranteed no matter what happens!
      setIsLoading(false);
    }
  }, [db]);

  // 🎯 Clean, native layout hook automatically fires whenever you switch tabs
  useEffect(() => {
    if (isFocused) {
      loadSchedule();
    }
  }, [isFocused, loadSchedule]);

  // Single Day Re-roll Click Event Handler
  const handleReRollSingleDay = async (dateStr: string) => {
    try {
      setIsLoading(true); // Spin briefly during live database mutations
      const { generateWeeklySchedule } = require('../database/dbQueries');
      await generateWeeklySchedule(db, [dateStr]);
      await loadSchedule(); // Refresh data view values instantly
    } catch (error: any) {
      console.error('Single day shuffle execution dropped:', error);
      Alert.alert('Shuffle Error', error.message || String(error));
      setIsLoading(false);
    }
  };

  // --- RENDERING LAYOUT VIEWS ---

  if (isLoading) {
    return (
      <View style={globalStyles.centered}>
        <ActivityIndicator size="large" color={COLORS.accentOrange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={globalStyles.headerTitle}>This Week's Dinner Menu</Text>
      
      <FlatList
        data={schedule}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dayLabel}>{item.dayName}</Text>
              <Text style={styles.dateLabel}>{item.date}</Text>
            </View>
            
            <View style={styles.cardBody}>
              <Text style={styles.mealLabel}>{item.mealText}</Text>
              
              <TouchableOpacity 
                style={styles.shuffleButton} 
                onPress={() => handleReRollSingleDay(item.date)}
                activeOpacity={0.7}
              >
                <Text style={styles.shuffleIcon}>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// Locally isolated design overrides matching your premium layout aesthetic
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
    paddingRight: 12,
  },
  shuffleButton: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 8,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shuffleIcon: {
    fontSize: 14,
    color: COLORS.accentOrange,
  },
});
