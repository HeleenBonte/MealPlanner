export const MEAL_CATEGORIES = [
    {id: 'italian', name: 'italian 🍝'},
    {id: 'meat', name: 'meat 🥩'},
    {id: 'fish', name: 'fish 🐟'},
    {id: 'international', name: 'international 🌮🥢'}
] as const;

export type MealCategory = typeof MEAL_CATEGORIES[number]['id'];