import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../styles/theme';
import { addCategory, CategoryItem, deleteCategory, fetchCategories } from '../database/dbQueries';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setCategories(await fetchCategories(db));
    } catch (error) {
      console.error('Failed to load categories:', error);
      Alert.alert('Error', 'Could not load categories.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isOpen) loadCategories();
  }, [isOpen, loadCategories]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim().toLowerCase();
    if (!name) return;

    try {
      await addCategory(db, name);
      setNewCategoryName('');
      await loadCategories();
    } catch (error) {
      console.error(`Failed to add category "${name}":`, error);
      Alert.alert('Error', 'Could not add the category.');
    }
  };

  const handleDeleteCategory = async (category: CategoryItem) => {
    try {
      await deleteCategory(db, category.name);
      await loadCategories();
    } catch (error) {
      console.error(`Failed to delete category "${category.name}":`, error);
      Alert.alert('Error', 'Could not remove the category.');
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.overlay, { paddingBottom: isKeyboardVisible ? 0 : insets.bottom }]}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Manage Categories</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>Done</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.accentOrange} />
            ) : (
              <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Categories are available when adding meals and configuring weekday rules.</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Add category (e.g. vegan)"
                    placeholderTextColor={COLORS.textMuted}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    returnKeyType="done"
                    submitBehavior="submit"
                    onSubmitEditing={handleAddCategory}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.tagGrid}>
                  {categories.map(category => (
                    <View key={category.name} style={styles.tag}>
                      <Text style={styles.tagText}>{category.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(category)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${category.name}`}
                        hitSlop={6}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>x</Text>
                      </TouchableOpacity>
                    </View>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%', width: '100%', borderWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  closeText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  content: { paddingBottom: 16 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: { flex: 1, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, color: COLORS.textPrimary, fontSize: 15 },
  addButton: { backgroundColor: COLORS.surfaceHover, borderWidth: 1, borderColor: COLORS.accentOrange, borderRadius: 8, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: COLORS.accentOrange, fontSize: 20, fontWeight: '600' },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingLeft: 10, paddingRight: 6, paddingVertical: 5 },
  tagText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  removeButton: { marginLeft: 6, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  removeButtonText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 16 },
});
