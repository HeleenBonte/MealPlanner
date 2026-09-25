// app/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { useIsFocused, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getCurrentWeekDates, getNextWeekDates, getTodayDateString, getTomorrowDateString } from '../utils/dateHelpers';
import { globalStyles, COLORS } from '../styles/theme';
import { assignMealToSchedule, fetchAllMealsFromLibrary, LibraryMealRow } from '../database/dbQueries';
import { updateMealPlannerWidget } from '../widgets/widgetRuntime';

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
  const [mealPickerDate, setMealPickerDate] = useState<string | null>(null);
  const [mealOptions, setMealOptions] = useState<LibraryMealRow[]>([]);
  const [isLoadingMealOptions, setIsLoadingMealOptions] = useState(false);

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

      const widgetDates = [getTodayDateString(), getTomorrowDateString()];
      const widgetPlaceholders = widgetDates.map(() => '?').join(',');
      const widgetRows = await db.getAllAsync<{ date: string; widget_display_string: string | null }>(
        `SELECT date, widget_display_string FROM scheduled_days WHERE date IN (${widgetPlaceholders});`,
        widgetDates
      );
      const widgetMeal = (date: string, emptyText: string) =>
        widgetRows.find(row => row.date === date)?.widget_display_string || emptyText;
      await updateMealPlannerWidget({
        today: widgetMeal(widgetDates[0], 'Not planned'),
        tomorrow: widgetMeal(widgetDates[1], 'Not planned'),
      });

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

  const handleOpenMealPicker = async (dateStr: string) => {
    try {
      setIsLoadingMealOptions(true);
      setMealPickerDate(dateStr);
      setMealOptions(await fetchAllMealsFromLibrary(db));
    } catch (error) {
      console.error('Failed to load meal options:', error);
      Alert.alert('Meal Picker Error', 'Could not load meals from the library.');
      setMealPickerDate(null);
    } finally {
      setIsLoadingMealOptions(false);
    }
  };

  const handleSelectMeal = async (mealId: number) => {
    if (!mealPickerDate) return;

    try {
      await assignMealToSchedule(db, mealPickerDate, mealId);
      setMealPickerDate(null);
      await loadSchedules();
    } catch (error: any) {
      Alert.alert('Meal Selection Error', error.message || 'Could not assign the meal.');
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
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.shuffleButton} onPress={() => handleReRollSingleDay(item.date)}>
                  <Text style={styles.shuffleIcon}>↻</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickButton} onPress={() => handleOpenMealPicker(item.date)}>
                  <Text style={styles.pickIcon}>✎</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <Modal
        visible={mealPickerDate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setMealPickerDate(null)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose Meal</Text>
              <TouchableOpacity onPress={() => setMealPickerDate(null)}>
                <Text style={styles.pickerCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            {isLoadingMealOptions ? (
              <ActivityIndicator size="small" color={COLORS.accentBlue} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {mealOptions.map(meal => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.mealOption}
                    onPress={() => handleSelectMeal(meal.id)}
                  >
                    <Text style={styles.mealOptionName}>{meal.name}</Text>
                    {meal.category && <Text style={styles.mealOptionCategory}>{meal.category}</Text>}
                  </TouchableOpacity>
                ))}
                {mealOptions.length === 0 && (
                  <Text style={styles.emptyPickerText}>No meals are available in the library.</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
  shuffleButton: { backgroundColor: COLORS.surfaceHover, borderRadius: 6, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  shuffleIcon: { fontSize: 19, color: COLORS.accentOrange},
  cardActions: { flexDirection: 'row', gap: 6 },
  pickButton: { backgroundColor: 'rgba(10, 132, 255, 0.1)', borderRadius: 6, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pickIcon: { fontSize: 19, color: COLORS.accentBlue },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  pickerCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.border },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12, marginBottom: 12 },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  pickerCloseText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  mealOption: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 8 },
  mealOptionName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  mealOptionCategory: { color: COLORS.accentBlue, fontSize: 12, marginTop: 3, textTransform: 'capitalize' },
  emptyPickerText: { color: COLORS.textMuted, fontSize: 14, paddingVertical: 16, textAlign: 'center' }
});
