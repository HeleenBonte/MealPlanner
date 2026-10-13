import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface MealPlannerWidgetData {
    today: string;
    tomorrow: string;
    todayLabel?: string;
    tomorrowLabel?: string;
}

export const defaultMealPlannerWidgetData: MealPlannerWidgetData = {
    today: 'Open Meal Planner to load today\'s meal',
    tomorrow: 'Open Meal Planner to load tomorrow\'s meal',
    todayLabel: 'Today',
    tomorrowLabel: 'Tomorrow',
};

export function MealPlannerWidget({
    today,
    tomorrow,
    todayLabel = 'Today',
    tomorrowLabel = 'Tomorrow',
}: MealPlannerWidgetData) {
    return (
        <FlexWidget
            clickAction="OPEN_APP"
            accessibilityLabel="Open Meal Planner"
            style={{
                backgroundColor: '#16161A',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            <TextWidget
                text="Meal Planner"
                style={{ color: '#FF9F0A', fontSize: 18, fontWeight: 'bold' }}
            />
            <FlexWidget style={{ flexDirection: 'column', flexGap: 6 }}>
                <TextWidget text={`${todayLabel}: ${today}`} style={{ color: '#F2F2F7', fontSize: 14 }} />
                <TextWidget text={`${tomorrowLabel}: ${tomorrow}`} style={{ color: '#AEAEB2', fontSize: 14 }} />
            </FlexWidget>
            <TextWidget
                text="Refresh in app"
                clickAction="OPEN_APP"
                accessibilityLabel="Refresh meals in Meal Planner"
                style={{ color: '#0A84FF', fontSize: 12, fontWeight: 'bold' }}
            />
        </FlexWidget>
    );
}
