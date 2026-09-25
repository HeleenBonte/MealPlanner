// app/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getCurrentWeekDates, getNextWeekDates, getTodayDateString } from '../utils/dateHelpers';
import { globalStyles, COLORS } from '../styles/theme';

interface DisplayDay {
  date: string;
  dayName: string;
  mealText: string;
}

export default function WeekCalendarScreen() {
  const db = useSQLiteContext();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  
  // View Toggle State: 'current' or 'next'
  const [activeTab, setActiveTab] = useState<'current' | 'next'>('current');

  // Schedule States
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<DisplayDay[]>([]);
  const [nextWeekSchedule, setNextWeekSchedule] = useState<DisplayDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Core database fetch timeline router query
  const loadSchedules = useCallback(async () => {
    if (!db) return;
    try {
      setIsLoading(true);
      const currentWeekDates = getCurrentWeekDates();
      const nextWeekDates = getNextWeekDates();

      // Query database for current week rows
      const currentPlaceholders = currentWeekDates.map(() => '?').join(',');
      const currentRows = await db.getAllAsync<{ date: string; widget_display_string: string | null }>(
        `SELECT date, widget_display_string FROM scheduled_days WHERE date IN (${currentPlaceholders});`,
        currentWeekDates
      );

      // Query database for next week rows
      const nextPlaceholders = nextWeekDates.map(() => '?').join(',');
      const nextRows = await db.getAllAsync<{ date: string; widget_display_string: string | null }>(
        `SELECT date, widget_display_string FROM scheduled_days WHERE date IN (${nextPlaceholders});`,
        nextWeekDates
      );

      // Map Current Week values safely
      const compiledCurrent = currentWeekDates.map(dateStr => {
        const match = currentRows.find(r => r.date === dateStr);
        const dayName = new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-BE', { weekday: 'long' });
        return { date: dateStr, dayName, mealText: match?.widget_display_string || 'Not Planned Yet 🍽️' };
      });

      // Map Next Week values safely
      const compiledNext = nextWeekDates.map(dateStr => {
        const match = nextRows.find(r => r.date === dateStr);
        const dayName = new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-BE', { weekday: 'long' });
        return { date: dateStr, dayName, mealText: match?.widget_display_string || 'Draft Empty 🗓️' };
      });

      setCurrentWeekSchedule(compiledCurrent);
      setNextWeekSchedule(compiledNext);
    } catch (error) {
      console.error('❌ Failed to fetch database timelines:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isFocused) {
      loadSchedules();
    }
  }, [isFocused, loadSchedules]);

  const handleGenerateNextWeek = async () => {
    try {
      setIsGenerating(true);
      const { generateWeeklySchedule } = require('../database/dbQueries');
      const nextWeekDates = nextWeekSchedule.map(day => day.date);
      
      await generateWeeklySchedule(db, nextWeekDates);
      Alert.alert('Success', "Next week's dinner draft has been successfully generated! 🚀");
      await loadSchedules();
    } catch (error: any) {
      Alert.alert('Generation Blocked', error.message || 'Ensure your Meal Library has options.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReRollSingleDay = async (dateStr: string) => {
    try {
      const { generateWeeklySchedule } = require('../database/dbQueries');
      await generateWeeklySchedule(db, [dateStr]);
      await loadSchedules();
    } catch (error: any) {
      Alert.alert('Shuffle Error', error.message);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: activeTab === 'next' ? 'Next Week' : 'This Week',
      headerRight: activeTab === 'next'
        ? () => (
            <TouchableOpacity
              style={styles.headerGenerateButton}
              onPress={handleGenerateNextWeek}
              disabled={isGenerating}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#0D0D0E" />
              ) : (
                <Text style={styles.headerGenerateButtonText}>⚡ Roll</Text>
              )}
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [activeTab, isGenerating, navigation, nextWeekSchedule]);

  if (isLoading) {
    return (
      <View style={globalStyles.centered}><ActivityIndicator size="large" color={COLORS.accentOrange} /></View>
    );
  }

  const activeScheduleData = activeTab === 'current' ? currentWeekSchedule : nextWeekSchedule;
  const todayDate = getTodayDateString();

  return (
    <View style={styles.container}>
      
      {/* 🎯 PREMIUM SEGMENTED CONTROL HEADER ROW */}
      <View style={styles.segmentedControlWrapper}>
        <TouchableOpacity 
          style={[styles.segmentButton, activeTab === 'current' && styles.activeSegmentButton]}
          onPress={() => setActiveTab('current')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'current' && styles.activeSegmentText]}>This Week</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.segmentButton, activeTab === 'next' && styles.activeSegmentButton]}
          onPress={() => setActiveTab('next')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'next' && styles.activeSegmentText]}>Next Week</Text>
        </TouchableOpacity>
      </View>

      {/* CLEAN, UNIFIED CARD SCROLLER LIST */}
      <FlatList
        data={activeScheduleData}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[
            globalStyles.card,
            activeTab === 'next' && { borderStyle: 'dashed', opacity: 0.85 },
            activeTab === 'current' && item.date === todayDate && styles.todayCard,
          ]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[
                styles.dayLabelText,
                activeTab === 'current' && item.date === todayDate && styles.todayText,
              ]}>{item.dayName}</Text>
              <Text style={styles.dateLabelText}>{item.date}</Text>
            </View>
            <View style={styles.cardBodyRow}>
              <Text style={[styles.mealText, activeTab === 'next' && { fontStyle: 'italic' }]}>{item.mealText}</Text>
              <TouchableOpacity style={styles.shuffleButton} onPress={() => handleReRollSingleDay(item.date)}>
                <Text style={styles.shuffleIcon}>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 12 },
  segmentedControlWrapper: { flexDirection: 'row', backgroundColor: COLORS.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 10, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  segmentButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  activeSegmentButton: { backgroundColor: COLORS.surfaceHover, borderWidth: 1, borderColor: COLORS.border },
  segmentText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  activeSegmentText: { color: COLORS.accentOrange },
  headerGenerateButton: { backgroundColor: COLORS.accentOrange, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 12 },
  headerGenerateButtonText: { color: '#0D0D0E', fontSize: 13, fontWeight: '700' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 6, marginBottom: 8 },
  dayLabelText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  todayCard: { borderColor: COLORS.accentOrange, borderWidth: 2 },
  todayText: { color: COLORS.accentOrange },
  dateLabelText: { fontSize: 12, color: COLORS.textMuted, fontFamily: 'monospace' },
  cardBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealText: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary, flex: 1, paddingRight: 8, lineHeight: 18 },
  shuffleButton: { backgroundColor: COLORS.surfaceHover, borderRadius: 6, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  shuffleIcon: { fontSize: 13, color: COLORS.accentOrange }
});
