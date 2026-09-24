// app/settings.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles, COLORS } from '../styles/theme';

// Import our new isolated dictionary configuration modal component!
import ManageSidesModal from '../components/ManageSidesModal';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [isSidesModalOpen, setIsSidesModalOpen] = useState(false);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
    >
      <Text style={globalStyles.headerTitle}>App Settings</Text>

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
          <Text style={styles.arrowIconText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* --- SECTION 2: WEEKDAY THEME RULES PLANNER --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>📅 Weekday Constraints & Rules</Text>
        <Text style={styles.sectionSubtitleText}>Configure specific dinner parameters for your calendar slots.</Text>
        
        <View style={styles.placeholderRulesList}>
          <Text style={styles.placeholderRulesText}>⚙️ Advanced rule scheduling tools ready to link.</Text>
        </View>
      </View>

      {/* INJECT THE HIDDEN MODAL CARDS SHEETS */}
      <ManageSidesModal 
        isOpen={isSidesModalOpen}
        onClose={() => setIsSidesModalOpen(false)}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 8 },
  sectionCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, letterSpacing: -0.3 },
  sectionSubtitleText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 16 },
  settingsMenuCell: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12 },
  cellLeftInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cellMainLabelText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  cellSubLabelText: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  arrowIconText: { color: COLORS.accentOrange, fontSize: 20, fontWeight: '300' },
  placeholderRulesList: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, alignItems: 'center' },
  placeholderRulesText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' }
});
