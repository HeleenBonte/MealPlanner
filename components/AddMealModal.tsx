import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { COLORS, globalStyles } from '../styles/theme';
import { addNewMealToLibrary, fetchGlobalCarbs, fetchGlobalVegetables, GlobalSideItem } from '../database/dbQueries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export default function AddMealModal({ isOpen, onClose, onSaveSuccess }: AddMealModalProps) {
    const db = useSQLiteContext();
    const insets = useSafeAreaInsets();

    const [mealName, setMealName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCarbs, setSelectedCarbs] = useState<number[]>([]);
    const [selectedVeggies, setSelectedVeggies] = useState<number[]>([]);

    const [availableCarbs, setAvailableCarbs] = useState<GlobalSideItem[]>([]);
    const [availableVeggies, setAvailableVeggies] = useState<GlobalSideItem[]>([]);
    const [isLoadingPools, setIsLoadingPools] = useState(false);

    const categoriesPool = ['italian', 'meat', 'fish', 'international'];

    useEffect(() => {
        if (isOpen) {
            async function loadReferencePools() {
            try {
                setIsLoadingPools(true);
                const carbs = await fetchGlobalCarbs(db);
                const veggies = await fetchGlobalVegetables(db);
                setAvailableCarbs(carbs);
                setAvailableVeggies(veggies);
            }
            catch (error) {
                console.error('Error fetching global items:', error);
            }
            finally {
                setIsLoadingPools(false);
            }
        }
        loadReferencePools();
    }
    }, [isOpen, db]);

    const resetForm = () => {
        setMealName('');
        setSelectedCategory(null);
        setSelectedCarbs([]);
        setSelectedVeggies([]);
    }

    const handleSave = async () => {
        if (!mealName.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        try {
            await addNewMealToLibrary(db, 
                { name: mealName.trim(),
                    category: selectedCategory,
                    carbIds: selectedCarbs.map(Number),
                    vegIds: selectedVeggies.map(Number)
                });
            Alert.alert('Success', 'Meal added to library successfully.');
            resetForm();
            onSaveSuccess();
        } catch (error) {
            console.error('Error saving meal:', error);
            Alert.alert('Error', 'Failed to save the meal. Please try again.');
        }
    };

    const toggleSelection = (id: number, currentList: number[], setList: React.Dispatch<React.SetStateAction<number[]>>) => {
        if (currentList.includes(id)) {
            setList(currentList.filter(itemId => itemId !== id));  
        } else {
            setList([...currentList, id]);
        }
    };

    return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { marginBottom: 60 +insets.bottom }]}>
        <View style={styles.modalContentCard}>
          
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>New Meal</Text>
            <TouchableOpacity onPress={() => { onClose(); resetForm(); }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {isLoadingPools ? (
            <View style={{ paddingVertical: 40 }}><ActivityIndicator size="small" color={COLORS.accentOrange} /></View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
              <Text style={styles.inputLabel}>Meal Title (required)</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g., Grilled Salmon, Chili..." 
                placeholderTextColor={COLORS.textMuted}
                value={mealName}
                onChangeText={setMealName}
              />

              <Text style={styles.inputLabel}>Visual Category Badge</Text>
              <View style={styles.buttonGrid}>
                {categoriesPool.map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.selectButton, selectedCategory === cat && styles.activeButton]}
                    onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    <Text style={[styles.buttonText, selectedCategory === cat && { color: COLORS.accentOrange }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Link Carbs Dictionary Options</Text>
              <View style={styles.buttonGrid}>
                {availableCarbs.map((carb) => (
                  <TouchableOpacity 
                    key={carb.id} 
                    style={[styles.selectButton, selectedCarbs.includes(carb.id) && styles.activeButton]}
                    onPress={() => toggleSelection(carb.id, selectedCarbs, setSelectedCarbs)}
                  >
                    <Text style={[styles.buttonText, selectedCarbs.includes(carb.id) && { color: COLORS.accentOrange }]}>{carb.name}</Text>
                  </TouchableOpacity>
                ))}
                {availableCarbs.length === 0 && <Text style={styles.emptyText}>No carbs available. Add them in Settings! ⚙️</Text>}
              </View>

              <Text style={styles.inputLabel}>Link Vegetables Dictionary Options</Text>
              <View style={styles.buttonGrid}>
                {availableVeggies.map((veg) => (
                  <TouchableOpacity 
                    key={veg.id} 
                    style={[styles.selectButton, selectedVeggies.includes(veg.id) && styles.activeButton]}
                    onPress={() => toggleSelection(veg.id, selectedVeggies, setSelectedVeggies)}
                  >
                    <Text style={[styles.buttonText, selectedVeggies.includes(veg.id) && { color: COLORS.accentOrange }]}>{veg.name}</Text>
                  </TouchableOpacity>
                ))}
                {availableVeggies.length === 0 && <Text style={styles.emptyText}>No veggies available. Add them in Settings! ⚙️</Text>}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>Save Recipe to Library</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.75)', 
    justifyContent: 'flex-end' },
  modalContentCard: { 
    backgroundColor: COLORS.surface, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    maxHeight: '85%', 
    borderWidth: 1, 
    borderColor: COLORS.border },
  modalHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    paddingBottom: 12 },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary, 
    letterSpacing: -0.5 },
  inputLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.textSecondary, 
    marginBottom: 8, 
    marginTop: 14 },
  textInput: { 
    backgroundColor: COLORS.background, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 8, 
    padding: 12, 
    color: COLORS.textPrimary, 
    fontSize: 15 },
  buttonGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginTop: 4 },
  selectButton: { 
    backgroundColor: COLORS.background, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8 },
  activeButton: { 
    borderColor: COLORS.accentOrange, 
    backgroundColor: 'rgba(255, 159, 10, 0.05)' },
  buttonText: { 
    color: COLORS.textSecondary, 
    fontSize: 14, fontWeight: '500', 
    textTransform: 'capitalize' },
  saveButton: { 
    backgroundColor: COLORS.accentOrange, 
    borderRadius: 10, 
    padding: 14, 
    alignItems: 'center', 
    marginTop: 28 },
  saveButtonText: { 
    color: '#0D0D0E', 
    fontSize: 16, 
    fontWeight: '700' },
  emptyText: { 
    fontSize: 13, 
    color: COLORS.textMuted, 
    fontStyle: 'italic', 
    paddingVertical: 4 }
});



