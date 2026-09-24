// components/ManageSidesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles, COLORS } from '../styles/theme';
import { fetchGlobalCarbs, fetchGlobalVegetables, addGlobalCarb, addGlobalVegetable, GlobalSideItem } from '../database/dbQueries';

interface ManageSidesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageSidesModal({ isOpen, onClose }: ManageSidesModalProps) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

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

  const handleAddCarb = async () => {
    const text = newCarbName.trim();
    if (!text) return;
    try {
      await addGlobalCarb(db, text);
      setNewCarbName('');
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not save carb option.');
    }
  };

  const handleAddVeg = async () => {
    const text = newVegName.trim();
    if (!text) return;
    try {
      await addGlobalVegetable(db, text);
      setNewVegName('');
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not save vegetable option.');
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.modalOverlay, { marginBottom: 60 + insets.bottom }]}>
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              
              {/* CARBS MANAGER GRID CONTAINER */}
              <Text style={styles.sectionLabel}>Carbs Pool Registry</Text>
              <View style={styles.inlineInputRow}>
                <TextInput 
                  style={styles.textInput} 
                  placeholder="Add Carb (e.g. Rice, Pasta)" 
                  placeholderTextColor={COLORS.textMuted}
                  value={newCarbName}
                  onChangeText={setNewCarbName}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddCarb}><Text style={styles.addButtonText}>+</Text></TouchableOpacity>
              </View>
              <View style={styles.tagWrapperGrid}>
                {carbsList.map(item => (
                  <View key={item.id} style={styles.pillTag}><Text style={styles.pillTagText}>{item.name}</Text></View>
                ))}
              </View>

              {/* VEGETABLES MANAGER GRID CONTAINER */}
              <Text style={styles.sectionLabel}>Vegetables Pool Registry</Text>
              <View style={styles.inlineInputRow}>
                <TextInput 
                  style={styles.textInput} 
                  placeholder="Add Veg (e.g. Broccoli, Carrots)" 
                  placeholderTextColor={COLORS.textMuted}
                  value={newVegName}
                  onChangeText={setNewVegName}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddVeg}><Text style={styles.addButtonText}>+</Text></TouchableOpacity>
              </View>
              <View style={styles.tagWrapperGrid}>
                {veggiesList.map(item => (
                  <View key={item.id} style={styles.pillTag}><Text style={styles.pillTagText}>{item.name}</Text></View>
                ))}
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
  modalContentCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 16, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.border },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, letterSpacing: -0.5 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.accentOrange, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  inlineInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  textInput: { flex: 1, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, color: COLORS.textPrimary, fontSize: 15 },
  addButton: { backgroundColor: COLORS.surfaceHover, borderWidth: 1, borderColor: COLORS.accentOrange, borderRadius: 8, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: COLORS.accentOrange, fontSize: 20, fontWeight: '600' },
  tagWrapperGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pillTag: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  pillTagText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' }
});
