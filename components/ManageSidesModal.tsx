// components/ManageSidesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles, COLORS } from '../styles/theme';
import { fetchGlobalCarbs, fetchGlobalVegetables, addGlobalCarb, addGlobalVegetable, deleteGlobalCarb, deleteGlobalVegetable, GlobalSideItem } from '../database/dbQueries';

interface ManageSidesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageSidesModal({ isOpen, onClose }: ManageSidesModalProps) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [carbsList, setCarbsList] = useState<GlobalSideItem[]>([]);
  const [veggiesList, setVeggiesList] = useState<GlobalSideItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newCarbName, setNewCarbName] = useState('');
  const [newVegName, setNewVegName] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const carbs = await fetchGlobalCarbs(db);
      const veggies = await fetchGlobalVegetables(db);
      setCarbsList(carbs);
      setVeggiesList(veggies);
    } catch (error) {
      console.error('Failed to load dictionary reference items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

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

  const handleAddCarb = async () => {
    const text = newCarbName.trim();
    console.log('Adding new carb:', text);
    if (!text) {
      Alert.alert('Empty Input', 'Please enter a carb name before clicking +.');
        return;
    }
    try {
      await addGlobalCarb(db, text);
      console.log('Successfully added new carb:', text);
      setNewCarbName('');
      const freshCarbs = await fetchGlobalCarbs(db);
    console.log('📊 Re-fetched fresh carbs array length from DB:', freshCarbs.length);
    console.log('📦 Raw data payload array contents:', JSON.stringify(freshCarbs));
          setCarbsList(freshCarbs);
      await loadData(); // Instantly refresh the local screen tags grid!
    } catch (e: any) {
      console.error('Error adding new carb: crash detected inside handleAddCarb function worker', e);
      Alert.alert('Error', 'Could not save carb option.');
    }
  };

  const handleAddVeg = async () => {
    const text = newVegName.trim();
    if (!text) return;
    try {
      await addGlobalVegetable(db, text);
      setNewVegName('');
      await loadData(); // Instantly refresh the local screen tags grid!
    } catch (e) {
      Alert.alert('Error', 'Could not save vegetable option.');
    }
  };

  const handleDeleteCarb = async (carb: GlobalSideItem) => {
    try {
      await deleteGlobalCarb(db, carb.id);
      await loadData();
    } catch (error) {
      console.error(`Failed to delete carb "${carb.name}":`, error);
      Alert.alert('Error', 'Could not remove the carb option.');
    }
  };

  const handleDeleteVeg = async (vegetable: GlobalSideItem) => {
    try {
      await deleteGlobalVegetable(db, vegetable.id);
      await loadData();
    } catch (error) {
      console.error(`Failed to delete vegetable "${vegetable.name}":`, error);
      Alert.alert('Error', 'Could not remove the vegetable option.');
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
              <Text style={styles.modalTitle}>Manage Side Dishes</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={{ paddingVertical: 40 }}><ActivityIndicator size="small" color={COLORS.accentOrange} /></View>
            ) : (
              /* Keep button taps active while the keyboard is open. */
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 32 }}
                keyboardShouldPersistTaps="always"
              >
                
                {/* --- CARBS SECTOR --- */}
                <Text style={[styles.sectionLabel, { color: COLORS.accentGreen }]}>Carbs Pool Registry</Text>
                <View style={styles.inlineInputRow}>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="Add Carb (e.g. Rice, Pasta)" 
                    placeholderTextColor={COLORS.textMuted}
                    value={newCarbName}
                    onChangeText={(val) => setNewCarbName(val)}
                    returnKeyType="done"
                    submitBehavior="submit"
                    onSubmitEditing={handleAddCarb}
                  />
                  <TouchableOpacity style={[styles.addButton, styles.carbAddButton]} onPress={handleAddCarb}>
                    <Text style={[styles.addButtonText, { color: COLORS.accentGreen }]}>+</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 🎯 FIXED VISIBILITY: Renders a beautiful active tag inventory row right on screen! */}
                <View style={styles.tagWrapperGrid}>
                  {carbsList.map(item => (
                    <View key={item.id} style={styles.pillTag}>
                      <Text style={styles.pillTagText}>{item.name}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleDeleteCarb(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.name}`}
                        hitSlop={6}
                      >
                        <Text style={styles.removeButtonText}>x</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {carbsList.length === 0 && <Text style={styles.emptyNoticeText}>No carb options registered yet.</Text>}
                </View>

                {/* --- VEGETABLES SECTOR --- */}
                <Text style={[styles.sectionLabel, { marginTop: 24, color: COLORS.accentPurple }]}>Vegetables Pool Registry</Text>
                <View style={styles.inlineInputRow}>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="Add Veg (e.g. Broccoli, Carrots)" 
                    placeholderTextColor={COLORS.textMuted}
                    value={newVegName}
                    onChangeText={(val) => setNewVegName(val)}
                    returnKeyType="done"
                    submitBehavior="submit"
                    onSubmitEditing={handleAddVeg}
                  />
                  <TouchableOpacity style={[styles.addButton, styles.vegetableAddButton]} onPress={handleAddVeg}>
                    <Text style={[styles.addButtonText, { color: COLORS.accentPurple }]}>+</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 🎯 FIXED VISIBILITY: Renders a beautiful active tag inventory row right on screen! */}
                <View style={styles.tagWrapperGrid}>
                  {veggiesList.map(item => (
                    <View key={item.id} style={styles.pillTag}>
                      <Text style={styles.pillTagText}>{item.name}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleDeleteVeg(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.name}`}
                        hitSlop={6}
                      >
                        <Text style={styles.removeButtonText}>x</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {veggiesList.length === 0 && <Text style={styles.emptyNoticeText}>No vegetable options registered yet.</Text>}
                </View>

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
  modalContentCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 16, maxHeight: '90%', width: '100%', borderWidth: 1, borderColor: COLORS.border },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, letterSpacing: -0.5 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.accentOrange, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inlineInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  textInput: { flex: 1, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, color: COLORS.textPrimary, fontSize: 15 },
  addButton: { backgroundColor: COLORS.surfaceHover, borderWidth: 1, borderRadius: 8, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  carbAddButton: { borderColor: COLORS.accentGreen },
  vegetableAddButton: { borderColor: COLORS.accentPurple },
  addButtonText: { color: COLORS.accentOrange, fontSize: 20, fontWeight: '600' },
  tagWrapperGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8, paddingHorizontal: 2 },
  pillTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingLeft: 10, paddingRight: 6, paddingVertical: 5 },
  pillTagText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  removeButton: { marginLeft: 6, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  removeButtonText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 16 },
  emptyNoticeText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 4 }
});
