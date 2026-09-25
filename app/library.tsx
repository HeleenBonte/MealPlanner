import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { globalStyles, COLORS } from '../styles/theme';

import { fetchAllMealsFromLibrary, fetchMealForEdit, deleteMealFromLibrary, EditMealPayload, LibraryMealRow } from '../database/dbQueries';

import AddMealModal from '../components/AddMealModal';

export default function LibraryScreen() {
    const db = useSQLiteContext();
    const isFocused = useIsFocused(); 
    const navigation = useNavigation();

    const [meals, setMeals] = useState<LibraryMealRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mealToEdit, setMealToEdit] = useState<EditMealPayload | null>(null);

    const loadMeals = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchAllMealsFromLibrary(db);
            setMeals(data);
        } catch (error) {
            console.error('Error loading meals:', error);
            Alert.alert('Error', 'Failed to load meals from the library.');
        } finally {
            setIsLoading(false);
        }
    }, [db]);

    useEffect(() => {
        if (isFocused) {
            loadMeals();
        }
    }, [isFocused, loadMeals]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={styles.headerAddButton}
                    onPress={() => {
                        setMealToEdit(null);
                        setIsModalOpen(true);
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={styles.headerAddButtonText}>+ Meal</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const handleDeleteMeal = async (mealId: number, mealName: string) => {
        Alert.alert(
            'Delete Meal',
            `Are you sure you want to permanently remove ${mealName} from your library?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMealFromLibrary(db, mealId);
                            setMeals(prev => prev.filter(m => m.id !== mealId));
                        } catch (error) {
                            console.error('Error deleting meal:', error);
                            Alert.alert('Error', 'Failed to delete the meal.');
                        }
                    }
                }
            ]
        );
    };

    const handleEditMeal = async (mealId: number) => {
        try {
            const meal = await fetchMealForEdit(db, mealId);
            if (!meal) {
                Alert.alert('Error', 'Could not load this meal for editing.');
                return;
            }
            setMealToEdit(meal);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error loading meal for editing:', error);
            Alert.alert('Error', 'Could not load this meal for editing.');
        }
    };


    const renderSideChips = (listString: string | null, label: string) => {
        if (!listString) return null;
        const items = listString.split(',');

        return (
            <View style={styles.chipGroupRow}>
                <Text style={styles.chipSectionLabel}>{label}:</Text>
                {items.map((item, index) => (
                    <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{item.trim()}</Text>
                    </View>
                ))}
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={globalStyles.centered}>
                <ActivityIndicator size="large" color={COLORS.accentOrange} />
            </View>
        );
    }

    return (
  <View style={styles.container}>
      <FlatList
        data={meals}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your library is currently empty. 🍳</Text>
            <Text style={styles.emptySubText}>Tap "+ Add Meal" to start building your menu choices.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealNameText}>{item.name}</Text>
                {item.category ? (
                  <View style={[styles.categoryBadge, { borderColor: COLORS.accentBlue }]}>
                    <Text style={[styles.categoryBadgeText, { color: COLORS.accentBlue }]}>
                      {item.category}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditMeal(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editIconText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMeal(item.id, item.name)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.deleteIconText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Relational Side Dish Item Metadata Chip Layers */}
            <View style={styles.cardBody}>
              {renderSideChips(item.carbs_list, 'carbs')}
              {renderSideChips(item.veggies_list, 'veggies')}
            </View>
          </View>
        )}
      />
      <AddMealModal
      isOpen={isModalOpen}
      onClose={() => {
        setMealToEdit(null);
        setIsModalOpen(false);
      }}
      mealToEdit={mealToEdit}
      onSaveSuccess={() => {
        setIsModalOpen(false);
        setMealToEdit(null);
        loadMeals();
      }}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 8,
  },
  headerAddButton: {
    backgroundColor: COLORS.surfaceHover,
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  headerAddButtonText: {
    color: COLORS.accentOrange,
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  mealNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)', // Subtle deep transparent red hue
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  editIconText: {
    color: COLORS.accentBlue,
    fontSize: 19,
  },
  deleteIconText: {
    fontSize: 14,
  },
  cardBody: {
    gap: 8,
  },
  chipGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    width: 50,
  },
  chip: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});


