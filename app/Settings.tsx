// app/settings.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../styles/theme';

// Import our new isolated dictionary configuration modal component!
import ManageSidesModal from '../components/ManageSidesModal';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
import EditRulesModal from '../components/EditRulesModal';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [isSidesModalOpen, setIsSidesModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
    >
      {/* --- CONFIGURATION ROW CELL LISTS --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>📋 Ingredient Management</Text>
        <Text style={styles.sectionSubtitleText}>Configure structural components for recipe planning menus.</Text>
        
        {/* Click target triggers your sliding dictionary form */}
        <TouchableOpacity 
          style={styles.settingsMenuCell} 
          onPress={() => setIsSidesModalOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cellLeftInfo}>
            <Text style={{ fontSize: 18 }}>🥦</Text>
            <View>
              <Text style={styles.cellMainLabelText}>Edit Sides Dictionary</Text>
              <Text style={styles.cellSubLabelText}>Manage global pools of carbs and vegetables.</Text>
            </View>
          </View>
          <Text style={[styles.arrowIconText, { color: COLORS.accentGreen }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingsMenuCell, styles.categoriesMenuCell, { marginTop: 8 }]}
          onPress={() => setIsCategoriesModalOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cellLeftInfo}>
            <Text style={{ fontSize: 18 }}>🏷️</Text>
            <View>
              <Text style={styles.cellMainLabelText}>Edit Meal Categories</Text>
              <Text style={styles.cellSubLabelText}>Manage the categories available across the app.</Text>
            </View>
          </View>
          <Text style={[styles.arrowIconText, { color: COLORS.accentBlue }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* --- SECTION 2: WEEKDAY THEME RULES PLANNER --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>📅 Weekday Constraints & Rules</Text>
        <Text style={styles.sectionSubtitleText}>Lock structural requirements or static overrides to automated days.</Text>
        
        <TouchableOpacity style={[styles.settingsMenuCell, styles.rulesMenuCell]} onPress={() => setIsRulesModalOpen(true)} activeOpacity={0.7}>
          <View style={styles.cellLeftInfo}>
            <Text style={{ fontSize: 18 }}>🗓️</Text>
            <View>
              <Text style={styles.cellMainLabelText}>Edit Automated Rules</Text>
              <Text style={styles.cellSubLabelText}>Configure themes or specific fixed dinners per day.</Text>
            </View>
          </View>
          <Text style={[styles.arrowIconText, { color: COLORS.accentPurple }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* INJECT THE HIDDEN MODAL CARDS SHEETS */}
      <ManageSidesModal 
        isOpen={isSidesModalOpen}
        onClose={() => setIsSidesModalOpen(false)}
      />
      <ManageCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />

      <EditRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 8 },
  sectionCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, letterSpacing: -0.3 },
  sectionSubtitleText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 16 },
  settingsMenuCell: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12 },
  categoriesMenuCell: { borderColor: 'rgba(10, 132, 255, 0.35)' },
  rulesMenuCell: { borderColor: 'rgba(191, 90, 242, 0.35)' },
  cellLeftInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cellMainLabelText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  cellSubLabelText: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  arrowIconText: { color: COLORS.accentOrange, fontSize: 20, fontWeight: '300' },
  placeholderRulesList: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, alignItems: 'center' },
  placeholderRulesText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' }
});
