import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, globalStyles } from '../styles/theme';
import { getCurrentWeekDates } from '../utils/dateHelpers';

interface DisplayDay {
    date: string;
    dayName: string;
    mealText: string;
}

export default function WeekCalendarScreen() {
    const db = useSQLiteContext();
    const [schedule, setSchedule] = useState<DisplayDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const loadSchedule = useCallback(async () => {
        try {
            setIsLoading(true);
            const dates = getCurrentWeekDates();

            const placeholders = dates.map(() => '?').join(',');
            const rows = await db.getAllAsync<{ date: string; widget_display_string: string }>(
                `SELECT date, widget_display_string FROM scheduled_days WHERE date IN (${placeholders}) ORDER BY date;`,
                dates
            );

            const compiledSchedule: DisplayDay[] = dates.map((dateStr) => {
                const matchingRow = rows.find(r => r.date === dateStr);
                const jsDate = new Date(dateStr);
                const dayName = jsDate.toLocaleDateString('en-BE', { weekday: 'long' });
                return {
                    date: dateStr,
                    dayName: dayName,
                    mealText: matchingRow ? matchingRow.widget_display_string : 'No meal scheduled'
                };
            });

            setSchedule(compiledSchedule);
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setIsLoading(false);
        }
    }, [db]);

    useFocusEffect(
        useCallback(() => {
            loadSchedule();
        }, [loadSchedule])
    );

    const handleReRollSingleDay = async (dateStr: string) => {
        try {
            const { generateWeeklySchedule } = require('../database/dbQueries');
            await generateWeeklySchedule(db, [dateStr]);
            await loadSchedule();
        } catch (error) {
            console.error('Error re-rolling single day:', error);
        }
    };

    if (isLoading) {
        return (
            <View style={globalStyles.centered}>
                <ActivityIndicator size="large" color={COLORS.accentOrange} />
            </View>
        );
    }

    return (
        <View style={globalStyles.screenContainer}>
            <Text style={globalStyles.headerTitle}>This Week's Dinner Menu</Text>
            <FlatList
                data={schedule}
                keyExtractor={(item) => item.date}
                renderItem={({ item }) => (
                    <View style={globalStyles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.dayLabel}>{item.dayName}</Text>
                            <Text style={styles.dateLabel}>{item.date}</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.mealLabel}>{item.mealText}</Text>
                            <TouchableOpacity
                                style={styles.shuffleButton}
                                onPress={() => handleReRollSingleDay(item.date)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.shuffleIcon}>🔄</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}




    const styles = StyleSheet.create({
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
            paddingBottom: 8,
            marginBottom: 8
        },
        dayLabel: {
            fontSize: 16,
            fontWeight: '700',
            color: COLORS.textPrimary
        },
        dateLabel: {
            fontSize: 13,
            color: COLORS.textMuted,
            fontFamily: 'monospace'
        },
        cardBody: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        mealLabel: {
            fontSize: 15,
            fontWeight: '500',
            color: COLORS.textSecondary,
            flex: 1,
            lineHeight: 20
        },
        shuffleButton: {
            backgroundColor: COLORS.surfaceHover,
            borderRadius: 8,
            width: 38,
            height: 38,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.border
        },
        shuffleIcon: {
            fontSize: 14,
            color: COLORS.accentOrange
        }
    });