import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { globalStyles, COLORS } from '../styles/theme';

import { fetchAllMealsFromLibrary, deleteMealFromLibrary, LibraryMealRow } from '../database/dbQueries';

export default function LibraryScreen() {
    const db = useSQLiteContext();
    const isFocused = useIsFocused(); 

    const [meals, setMeals] = useState<LibraryMealRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    React.useEffect(() => {
        if (isFocused) {
            loadMeals();
        }
    }, [isFocused, loadMeals]);

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
      <View style={styles.headerActionRow}>
        <Text style={globalStyles.headerTitle}>Recipe Library</Text>
        
        {/* We will wire this button up to open our Add Meal overlay panel form next! */}
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ Add Meal</Text>
        </TouchableOpacity>
      </View>

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

              {/* Delete Trash Anchor Button */}
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteMeal(item.id, item.name)}
                activeOpacity={0.6}
              >
                <Text style={styles.deleteIconText}>🗑️</Text>
              </TouchableOpacity>
            </View>

            {/* Relational Side Dish Item Metadata Chip Layers */}
            <View style={styles.cardBody}>
              {renderSideChips(item.carbs_list, 'carbs')}
              {renderSideChips(item.veggies_list, 'veggies')}
            </View>
          </View>
        )}
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
  headerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: COLORS.surfaceHover,
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
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





