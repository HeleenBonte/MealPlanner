import { SQLiteDatabase } from 'expo-sqlite';
import { getWeekdayIndex } from '../utils/dateHelpers';

export interface ScheduledDay {
    date: string;
    dayName: string;
    mealId: number | null;
    widget_display_string: string;
}

interface DBMeal {
    id: number;
    name: string;
    category: string | null;
}

export interface DBRule {
    day_index: number;
    day_name: string;
    required_category: string | null;
    fixed_meal_name: string | null;
}

export interface NewMealPayload {
    name: string;
    category: string | null;
    carbIds: number[];
    vegIds: number[];
}

export interface EditMealPayload {
    id: number;
    name: string;
    category: string | null;
    carbIds: number[];
    vegIds: number[];
}

export interface GlobalSideItem {
    id: number;
    name: string;
}

export interface UpdateDayRule {
    day_index: number;
    required_category: string | null;
    fixed_meal_name: string | null;
}

export interface LibraryMealRow {
    id: number;
    name: string;
    category: string | null;
    last_cooked: string | null;
    carbs_list: string | null;
    veggies_list: string | null;
}

export interface CategoryItem {
    name: string;
}

export interface MealEditData {
    id: number;
    name: string;
    category: string | null;
    carbIds: number[];
    vegIds: number[];
}
export async function generateWeeklySchedule(db: SQLiteDatabase, startDates: string[]): Promise<void> {
    await db.withTransactionAsync(async () => {
        await clearOldSchedules(db);

        const rules = await db.getAllAsync<DBRule>('SELECT * FROM weekday_rules ORDER BY day_index ASC;');

        const chosenMealIdsThisSession: number[] = [];

        for (const targetDate of startDates) {

            const currentDayIndex = getWeekdayIndex(targetDate);

            const dayRule = rules.find(r => r.day_index === currentDayIndex);

            if (dayRule) {
                if (dayRule.fixed_meal_name) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO scheduled_days (date, meal_id, selected_carb, selected_veg, widget_display_string) 
                    VALUES (?, -1, NULL, NULL, ?);`,
                        [targetDate, dayRule.fixed_meal_name]
                    );
                    continue;
                }
            }

            let candidateMeals = await getCandidateMeals(db, targetDate, dayRule, chosenMealIdsThisSession);

            if (candidateMeals.length === 0) {
                await db.runAsync(
                    `INSERT OR REPLACE INTO scheduled_days (date, meal_id, selected_carb, selected_veg, widget_display_string) 
                    VALUES (?, NULL, NULL, NULL, 'No meal available');`,
                    [targetDate, 'No Meals Found (Add more to Library)']
                );
                continue;
            }

            const selectedMeal = selectRandomMeal(candidateMeals);

            chosenMealIdsThisSession.push(selectedMeal.id);

            const chosenCarb = await selectRandomCarb(db, selectedMeal.id);
            const chosenVeg = await selectRandomVegetable(db, selectedMeal.id);

            const displayString = compileWidgetDisplayString(selectedMeal.name, chosenCarb, chosenVeg);

            await db.runAsync(
                `INSERT OR REPLACE INTO scheduled_days (date, meal_id, selected_carb, selected_veg, widget_display_string) 
                VALUES (?, ?, ?, ?, ?);`,
                [targetDate, selectedMeal.id, chosenCarb, chosenVeg, displayString]
            );
        }
    });
}

async function clearOldSchedules(db: SQLiteDatabase): Promise<void> {
    try {
        await db.runAsync('DELETE FROM scheduled_days WHERE date < date("now", "-60 days");');
    } catch (error) {
        console.error('Error clearing old schedules:', error);
    }
}

async function getCandidateMeals(db: SQLiteDatabase, targetDate: string, dayRule: DBRule | undefined, chosenMealIdsThisSession: number[]): Promise<DBMeal[]> {

    let baseQuery = `
            SELECT id, name, category FROM meals 
            WHERE (last_cooked IS NULL OR last_cooked < date(?, '-14 days'))
            `;

    const queryParams: any[] = [targetDate];

    if (dayRule && dayRule.required_category) {
        baseQuery += ` AND category = ?`;
        queryParams.push(dayRule.required_category);
    }

    const queryResults = await db.getAllAsync<DBMeal>(baseQuery, queryParams);

    let candidateMeals = queryResults.filter(meal => !chosenMealIdsThisSession.includes(meal.id));

    if (candidateMeals.length === 0) {
        let fallbackQuery = `SELECT id, name, category FROM meals`;
        const fallbackParams: any[] = [];

        if (dayRule && dayRule.required_category) {
            fallbackQuery += ` WHERE category = ?`;
            fallbackParams.push(dayRule.required_category);
        }

        const fallbackResults = await db.getAllAsync<DBMeal>(fallbackQuery, fallbackParams);
        candidateMeals = fallbackResults.filter(meal => !chosenMealIdsThisSession.includes(meal.id));
    }


    return candidateMeals;
}

function selectRandomMeal(meals: DBMeal[]): DBMeal {
    const randomIndex = Math.floor(Math.random() * meals.length);
    return meals[randomIndex];
}

async function selectRandomCarb(db: SQLiteDatabase, mealId: number): Promise<string | null> {
    const carbs = await db.getAllAsync<{ carb_name: string }>(
        `SELECT c.carb_name 
                FROM global_carbs c
                JOIN meal_carbs_link m ON m.carb_id = c.id
                WHERE m.meal_id = ?;`,
        [mealId]
    );
    return carbs.length > 0 ? carbs[Math.floor(Math.random() * carbs.length)].carb_name : null;
}

async function selectRandomVegetable(db: SQLiteDatabase, mealId: number): Promise<string | null> {
    const veggies = await db.getAllAsync<{ veg_name: string }>(
        `SELECT v.veg_name 
        FROM global_vegetables v
        JOIN meal_vegetables_link m ON m.veg_id = v.id
        WHERE m.meal_id = ?;`,
        [mealId]
    );
    return veggies.length > 0 ? veggies[Math.floor(Math.random() * veggies.length)].veg_name : null;
}

function compileWidgetDisplayString(mealName: string, carb: string | null, veg: string | null): string {
    const attachments: string[] = [];
    if (carb) attachments.push(carb);
    if (veg) attachments.push(veg);
    if (attachments.length === 2) {
        return `${mealName} with ${attachments[0]} and ${attachments[1]}`;
    } else if (attachments.length === 1) {
        return `${mealName} with ${attachments[0]}`;
    } else {
        return mealName;
    }
}

export async function addNewMealToLibrary(db: SQLiteDatabase, meal: NewMealPayload): Promise<void> {
    await db.withTransactionAsync(async () => {

        const mealResult = await db.runAsync(
            `INSERT INTO meals (name, category) VALUES (?, ?);`,
            [meal.name, meal.category]
        );

        const mealId = mealResult.lastInsertRowId;

        if (meal.carbIds && meal.carbIds.length > 0) {
            for (const carbId of meal.carbIds) {
                await db.runAsync(
                    `INSERT OR IGNORE INTO meal_carbs_link (meal_id, carb_id) VALUES (?, ?);`,
                    [mealId, carbId]
                );
            }
        }

        if (meal.vegIds && meal.vegIds.length > 0) {
            for (const vegId of meal.vegIds) {
                await db.runAsync(
                    `INSERT OR IGNORE INTO meal_vegetables_link (meal_id, veg_id) VALUES (?, ?);`,
                    [mealId, vegId]
                );
            }
        }
    });
}

export async function editMealInLibrary(db: SQLiteDatabase, meal: EditMealPayload): Promise<void> {
    await db.withTransactionAsync(async () => {
        try {
            await db.runAsync(
                `UPDATE meals SET name = ?, category = ? WHERE id = ?;`,
                [meal.name, meal.category, meal.id]
            );

            await db.runAsync(
                `DELETE FROM meal_carbs_link WHERE meal_id = ?;`,
                [meal.id]
            );
            if (meal.carbIds && meal.carbIds.length > 0) {
                for (const carbId of meal.carbIds) {
                    await db.runAsync(
                        `INSERT OR IGNORE INTO meal_carbs_link (meal_id, carb_id) VALUES (?, ?);`,
                        [meal.id, carbId]
                    );
                }

            }
            await db.runAsync(
                `DELETE FROM meal_vegetables_link WHERE meal_id = ?;`,
                [meal.id]
            );
            if (meal.vegIds && meal.vegIds.length > 0) {
                for (const vegId of meal.vegIds) {
                    await db.runAsync(
                        `INSERT OR IGNORE INTO meal_vegetables_link (meal_id, veg_id) VALUES (?, ?);`,
                        [meal.id, vegId]
                    );
                }
            }
            console.log(`Meal with ID ${meal.id} (${meal.name}) updated successfully.`);
        } catch (error) {
            console.error('Error updating meal:', error);
            throw error;
        }
    });
}

export async function fetchMealForEdit(db: SQLiteDatabase, mealId: number): Promise<MealEditData | null> {
    const meal = await db.getFirstAsync<{ id: number; name: string; category: string | null }>(
        `SELECT id, name, category FROM meals WHERE id = ?;`,
        [mealId]
    );

    if (!meal) return null;

    const carbs = await db.getAllAsync<{ id: number }>(
        `SELECT carb_id AS id FROM meal_carbs_link WHERE meal_id = ?;`,
        [mealId]
    );
    const vegetables = await db.getAllAsync<{ id: number }>(
        `SELECT veg_id AS id FROM meal_vegetables_link WHERE meal_id = ?;`,
        [mealId]
    );

    return {
        ...meal,
        carbIds: carbs.map(item => item.id),
        vegIds: vegetables.map(item => item.id),
    };
}

export async function fetchGlobalCarbs(db: SQLiteDatabase): Promise<GlobalSideItem[]> {
    return await db.getAllAsync<GlobalSideItem>(
        `SELECT id, carb_name AS name FROM global_carbs ORDER BY carb_name ASC;`);
}

export async function fetchGlobalVegetables(db: SQLiteDatabase): Promise<GlobalSideItem[]> {
    return await db.getAllAsync<GlobalSideItem>(
        `SELECT id, veg_name as name FROM global_vegetables ORDER BY veg_name ASC;`);
}

export async function fetchCategories(db: SQLiteDatabase): Promise<CategoryItem[]> {
    return await db.getAllAsync<CategoryItem>(
        `SELECT name FROM categories ORDER BY name ASC;`
    );
}

export async function addCategory(db: SQLiteDatabase, categoryName: string): Promise<void> {
    const normalizedName = categoryName.trim().toLowerCase();
    if (!normalizedName) return;

    await db.runAsync(
        `INSERT OR IGNORE INTO categories (name) VALUES (?);`,
        [normalizedName]
    );
}

export async function deleteCategory(db: SQLiteDatabase, categoryName: string): Promise<void> {
    await db.withTransactionAsync(async () => {
        await db.runAsync(`UPDATE meals SET category = NULL WHERE category = ?;`, [categoryName]);
        await db.runAsync(`UPDATE weekday_rules SET required_category = NULL WHERE required_category = ?;`, [categoryName]);
        await db.runAsync(`DELETE FROM categories WHERE name = ?;`, [categoryName]);
    });
}

export async function addGlobalCarb(db: SQLiteDatabase, carbName: string): Promise<void> {
    const trimmedName = carbName.trim();
    if (trimmedName) {
        const result = await db.runAsync(
            `INSERT OR IGNORE INTO global_carbs (carb_name) VALUES (?);`,
            [trimmedName]
        );
        console.log(`Carb "${trimmedName}" saved with ${result.changes} database change(s).`);
    }
}

export async function addGlobalVegetable(db: SQLiteDatabase, vegName: string): Promise<void> {
    const trimmedName = vegName.trim();
    if (trimmedName) {
        const result = await db.runAsync(
            `INSERT OR IGNORE INTO global_vegetables (veg_name) VALUES (?);`,
            [trimmedName]
        );
        console.log(`Vegetable "${trimmedName}" saved with ${result.changes} database change(s).`);
    }
}

export async function deleteGlobalCarb(db: SQLiteDatabase, carbId: number): Promise<void> {
    const result = await db.runAsync(
        `DELETE FROM global_carbs WHERE id = ?;`,
        [carbId]
    );
    console.log(`Carb with ID ${carbId} deleted with ${result.changes} database change(s).`);
}

export async function deleteGlobalVegetable(db: SQLiteDatabase, vegetableId: number): Promise<void> {
    const result = await db.runAsync(
        `DELETE FROM global_vegetables WHERE id = ?;`,
        [vegetableId]
    );
    console.log(`Vegetable with ID ${vegetableId} deleted with ${result.changes} database change(s).`);
}

export async function updateWeekdayRule(db: SQLiteDatabase, rule: UpdateDayRule): Promise<void> {
    try {
        await db.runAsync(
            `UPDATE weekday_rules 
             SET required_category = ?, fixed_meal_name = ? 
             WHERE day_index = ?;`,
            [rule.required_category, rule.fixed_meal_name, rule.day_index]
        );
        console.log(`Weekday rule for day_index ${rule.day_index} updated successfully.`);
    } catch (error) {
        console.error('Error updating weekday rule:', error);
        throw error;
    }
}

export async function fetchAllMealsFromLibrary(db: SQLiteDatabase): Promise<LibraryMealRow[]> {
    return await db.getAllAsync<LibraryMealRow>(`
        SELECT m.id, m.name, m.category, m.last_cooked,
            GROUP_CONCAT(DISTINCT c.carb_name) AS carbs_list,
            GROUP_CONCAT(DISTINCT v.veg_name) AS veggies_list
        FROM meals m
        LEFT JOIN meal_carbs_link mcl ON m.id = mcl.meal_id
        LEFT JOIN global_carbs c ON mcl.carb_id = c.id
        LEFT JOIN meal_vegetables_link mvl ON m.id = mvl.meal_id
        LEFT JOIN global_vegetables v ON mvl.veg_id = v.id
        GROUP BY m.id
        ORDER BY m.name ASC;`
    );
}

export async function deleteMealFromLibrary(db: SQLiteDatabase, mealId: number): Promise<void> {
    await db.runAsync(`DELETE FROM meals WHERE id = ?;`, [mealId]);
}

export async function fetchAllWeekdayRules(db: SQLiteDatabase): Promise<DBRule[]> {
    return await db.getAllAsync<DBRule>(
        `SELECT day_index, day_name, required_category, fixed_meal_name FROM weekday_rules ORDER BY day_index ASC;`);
}