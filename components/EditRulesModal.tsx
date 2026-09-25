// components/EditRulesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles, COLORS } from '../styles/theme';
import { fetchAllWeekdayRules, fetchCategories, updateWeekdayRule, CategoryItem, DBRule } from '../database/dbQueries';

interface EditRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditRulesModal({ isOpen, onClose }: EditRulesModalProps) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [rules, setRules] = useState<DBRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track inputs locally for each day to prevent massive re-renders
  const [activeEditingDay, setActiveEditingDay] = useState<number | null>(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [fixedMealInput, setFixedMealInput] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const loadRules = useCallback(async () => {
    try {
      setIsLoading(true);
      let data = await fetchAllWeekdayRules(db);
      const categoryData = await fetchCategories(db);
        if (data.length < 7) {
            console.log('Incomplete rules data, initializing defaults...');
            const fullWeekmap = [
                { index: 0, name: 'Monday' },
                { index: 1, name: 'Tuesday' },
                { index: 2, name: 'Wednesday' },
                { index: 3, name: 'Thursday' },
                { index: 4, name: 'Friday' },
                { index: 5, name: 'Saturday' },
                { index: 6, name: 'Sunday' }
            ];

            for (const day of fullWeekmap) {
                const exists = data.some(r => r.day_index === day.index);
                if (!exists) {
                    await db.runAsync(
                    'INSERT INTO weekday_rules (day_index, day_name, required_category, fixed_meal_name) VALUES (?, ?, NULL, NULL);',
                    [day.index, day.name]
                );
            }   
        }
            data = await fetchAllWeekdayRules(db);
        }


      setRules(data);
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load weekday configuration rules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isOpen) {
      loadRules();
      setActiveEditingDay(null);
    }
  }, [isOpen, loadRules]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSelectDayToEdit = (rule: DBRule) => {
    setActiveEditingDay(rule.day_index);
    setCategoryInput(rule.required_category || '');
    setFixedMealInput(rule.fixed_meal_name || '');
  };

  const handleSaveRuleUpdate = async (dayIndex: number) => {
    try {
      Keyboard.dismiss();
      const finalCategory = categoryInput.trim().toLowerCase() || null;
      const finalFixedMeal = fixedMealInput.trim() || null;

      await updateWeekdayRule(db, {
        day_index: dayIndex,
        required_category: finalCategory,
        fixed_meal_name: finalFixedMeal
      });

      setActiveEditingDay(null);
      await loadRules(); // Refresh listing immediately
    } catch (error) {
      Alert.alert('Error', 'Failed to save rule settings.');
    }
  };

  const handleClearRule = async (dayIndex: number) => {
    try {
      Keyboard.dismiss();
      await updateWeekdayRule(db, {
        day_index: dayIndex,
        required_category: null,
        fixed_meal_name: null
      });
      setActiveEditingDay(null);
      await loadRules();
    } catch (error) {
      Alert.alert('Error', 'Failed to reset rule.');
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <View style={[styles.modalOverlay, { paddingBottom: isKeyboardVisible ? 0 : insets.bottom }]}>
        <View style={styles.modalContentCard}>
          
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Weekday Constraints</Text>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose(); }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 40 }}><ActivityIndicator size="small" color={COLORS.accentOrange} /></View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
            >
              <Text style={styles.subtitleText}>Tap a day to set custom automated constraints or fixed recipe overrides.</Text>
              
              {rules.map((item) => {
                const isEditing = activeEditingDay === item.day_index;
                let statusLabel = '🔓 Open Choice';
                if (item.fixed_meal_name) statusLabel = `📌 Fixed: ${item.fixed_meal_name}`;
                else if (item.required_category) statusLabel = `🏷️ Category: ${item.required_category}`;

                return (
                  <View key={item.day_index} style={[styles.dayRuleContainer, isEditing && styles.dayRuleActiveContainer]}>
                    <TouchableOpacity style={styles.dayHeaderToggleRow} onPress={() => handleSelectDayToEdit(item)} activeOpacity={0.7}>
                      <Text style={styles.dayNameText}>{item.day_name}</Text>
                      <Text style={[styles.statusLabelText, (item.required_category || item.fixed_meal_name) && { color: COLORS.accentOrange }]}>
                        {statusLabel}
                      </Text>
                    </TouchableOpacity>

                    {/* Inline Expandable Form Editor Fields */}
                    {isEditing && (
                      <View style={styles.inlineEditorForm}>
                        
                        {/* Option A: Category Constraints selection buttons */}
                        <Text style={styles.fieldLabel}>Restrict to Category Tag</Text>
                        <View style={styles.badgeGrid}>
                          {categories.map((category) => (
                            <TouchableOpacity 
                              key={category.name} 
                              style={[styles.badgeButton, categoryInput === category.name && styles.activeBadgeButton]}
                              onPress={() => {
                                setCategoryInput(categoryInput === category.name ? '' : category.name);
                                setFixedMealInput(''); // Category toggles wipe fixed options to prevent query conflicts
                              }}
                            >
                              <Text style={[styles.badgeText, categoryInput === category.name && { color: COLORS.accentOrange }]}>{category.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Option B: Fixed Recipe Overrides Text Field */}
                        <Text style={styles.fieldLabel}>Or Lock to Fixed Meal Name Override</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. Homemade Pizza, Takeaway Night"
                          placeholderTextColor={COLORS.textMuted}
                          value={fixedMealInput}
                          onChangeText={(val) => {
                            setFixedMealInput(val);
                            if (val.trim()) setCategoryInput(''); // Text overrides wipe category chips
                          }}
                          returnKeyType="done"
                          submitBehavior="submit"
                          onSubmitEditing={() => handleSaveRuleUpdate(item.day_index)}
                        />

                        {/* Control Save & Clear Actions row */}
                        <View style={styles.actionsRow}>
                          <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={() => handleClearRule(item.day_index)}>
                            <Text style={styles.clearButtonText}>Reset Day</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={() => handleSaveRuleUpdate(item.day_index)}>
                            <Text style={styles.saveButtonText}>Apply Rule</Text>
                          </TouchableOpacity>
                        </View>

                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContentCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 16, borderWidth: 1, borderColor: COLORS.border, maxHeight: '90%', width: '100%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitleText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 16 },
  dayRuleContainer: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 8 },
  dayRuleActiveContainer: { borderColor: COLORS.accentOrange, backgroundColor: 'rgba(255, 159, 10, 0.02)' },
  dayHeaderToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayNameText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  statusLabelText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  inlineEditorForm: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badgeButton: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  activeBadgeButton: { borderColor: COLORS.accentOrange },
  badgeText: { color: COLORS.textSecondary, fontSize: 13, textTransform: 'capitalize' },
  textInput: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 10, color: COLORS.textPrimary, fontSize: 14, marginBottom: 14 },
  actionsRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionButton: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  clearButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  clearButtonText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  saveButton: { backgroundColor: COLORS.accentOrange },
saveButtonText: { color: '#0D0D0E', fontSize: 13, fontWeight: '700' }});