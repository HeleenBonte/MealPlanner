"use no memo";

import React from 'react';
import * as SQLite from 'expo-sqlite';
import {
    registerWidgetTaskHandler,
    requestWidgetUpdate,
} from 'react-native-android-widget';
import { MealPlannerWidget, MealPlannerWidgetData, defaultMealPlannerWidgetData } from './MealPlannerWidget';
import { getTodayDateString, getTomorrowDateString } from '../utils/dateHelpers';

export const MEAL_PLANNER_WIDGET_NAME = 'MealPlannerWidget';

let widgetData: MealPlannerWidgetData = defaultMealPlannerWidgetData;

function formatWidgetDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString('en-BE', { weekday: 'short' });
    const monthName = date.toLocaleDateString('en-BE', { month: 'short' });
    return `${weekday} ${day} ${monthName}`;
}

async function loadWidgetDataFromDatabase(): Promise<MealPlannerWidgetData> {
    const db = await SQLite.openDatabaseAsync('meals.db');
    try {
        const dates = [getTodayDateString(), getTomorrowDateString()];
        const placeholders = dates.map(() => '?').join(',');
        const rows = await db.getAllAsync<{
            date: string;
            widget_display_string: string | null;
        }>(
            `SELECT date, widget_display_string
             FROM scheduled_days
             WHERE date IN (${placeholders});`,
            dates
        );

        const mealForDate = (date: string) =>
            rows.find(row => row.date === date)?.widget_display_string || 'Not planned';

        return {
            today: mealForDate(dates[0]),
            tomorrow: mealForDate(dates[1]),
            todayLabel: formatWidgetDate(dates[0]),
            tomorrowLabel: formatWidgetDate(dates[1]),
        };
    } finally {
        await db.closeAsync();
    }
}

registerWidgetTaskHandler(async ({ widgetAction, renderWidget }) => {
    if (
        widgetAction === 'WIDGET_ADDED' ||
        widgetAction === 'WIDGET_UPDATE' ||
        widgetAction === 'WIDGET_RESIZED'
    ) {
        widgetData = await loadWidgetDataFromDatabase();
        renderWidget(<MealPlannerWidget {...widgetData} />);
    }
});

export async function updateMealPlannerWidget(data: MealPlannerWidgetData): Promise<void> {
    const dates = [getTodayDateString(), getTomorrowDateString()];
    widgetData = {
        ...data,
        todayLabel: data.todayLabel ?? formatWidgetDate(dates[0]),
        tomorrowLabel: data.tomorrowLabel ?? formatWidgetDate(dates[1]),
    };
    await requestWidgetUpdate({
        widgetName: MEAL_PLANNER_WIDGET_NAME,
        renderWidget: () => <MealPlannerWidget {...widgetData} />,
    });
}
