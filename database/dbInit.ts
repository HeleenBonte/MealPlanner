import { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
    try{
       await db.execAsync('PRAGMA foreign_keys = ON;');

       await db.execAsync(`
            CREATE TABLE IF NOT EXISTS categories (
                name TEXT PRIMARY KEY NOT NULL
            );
        `);

       await db.execAsync(`
            CREATE TABLE IF NOT EXISTS meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                last_cooked TEXT
            );
        `);
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS global_carbs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                carb_name TEXT NOT NULL
            );
        `);
       await db.execAsync(`
            CREATE TABLE IF NOT EXISTS global_vegetables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                veg_name TEXT NOT NULL
            );
        `);

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS meal_carbs_link (
                meal_id INTEGER NOT NULL,
                carb_id INTEGER NOT NULL,
                PRIMARY KEY (meal_id, carb_id),
                FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
                FOREIGN KEY (carb_id) REFERENCES global_carbs(id) ON DELETE CASCADE
            );
        `);

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS meal_vegetables_link (
                meal_id INTEGER NOT NULL,
                veg_id INTEGER NOT NULL,
                PRIMARY KEY (meal_id, veg_id),
                FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
                FOREIGN KEY (veg_id) REFERENCES global_vegetables(id) ON DELETE CASCADE
            );
        `);

        await seedCategories(db);

       await db.execAsync(`
            CREATE TABLE IF NOT EXISTS weekday_rules (
                day_index INTEGER PRIMARY KEY,
                day_name TEXT NOT NULL,
                required_category TEXT,
                fixed_meal_name TEXT
            );
        `);
        await db.runAsync(`
            UPDATE weekday_rules
            SET required_category = LOWER(TRIM(required_category))
            WHERE required_category IS NOT NULL;
        `);

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS scheduled_days (
                date TEXT PRIMARY KEY,
                meal_id INTEGER,
                selected_carb TEXT,
                selected_veg TEXT,
                widget_display_string TEXT NOT NULL
            );
        `);
        await seedExampleData(db);

        const rulesCountResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM weekday_rules;');

        if (rulesCountResult && rulesCountResult.count === 0) {
            console.log('Seeding baseline weekday rules into database...');

            const seedStatement = await db.prepareAsync(`
                INSERT INTO weekday_rules (day_index, day_name, required_category, fixed_meal_name)
                VALUES (?, ?, ?, ?);
            `);
            try {
                await seedStatement.executeAsync(0, 'Monday', null, null);
                await seedStatement.executeAsync(1, 'Tuesday', null, null);
                await seedStatement.executeAsync(2, 'Wednesday', 'pasta', null);
                await seedStatement.executeAsync(3, 'Thursday', null, null);
                await seedStatement.executeAsync(4, 'Friday', 'fish', null);
                await seedStatement.executeAsync(5, 'Saturday', null, 'pizza');
                await seedStatement.executeAsync(6, 'Sunday', null, null);
            } finally {
                seedStatement.finalizeAsync();
            }
        }

        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Failed to initialize database tables: ', error);
        throw error;
    }
}

async function seedCategories(db: SQLiteDatabase): Promise<void> {
    const defaultCategories = ['pasta', 'meat', 'fish', 'international'];

    await db.withTransactionAsync(async () => {
        await db.runAsync(`
            INSERT OR IGNORE INTO categories (name)
            SELECT DISTINCT TRIM(category)
            FROM meals
            WHERE category IS NOT NULL AND TRIM(category) != '';
        `);

        for (const category of defaultCategories) {
            await db.runAsync(
                `INSERT OR IGNORE INTO categories (name) VALUES (?);`,
                [category]
            );
        }
    });
}

async function seedExampleData(db: SQLiteDatabase): Promise<void> {
    const seedCarbs = ['Rice', 'Pasta', 'Mashed Potatoes', 'Quinoa', 'Bread'];
    const carbCount = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM global_carbs;`
    );
    if ((carbCount?.count ?? 0) === 0) {
        for (const carb of seedCarbs) {
            await db.runAsync(`INSERT INTO global_carbs (carb_name) VALUES (?);`, [carb]);
        }
    }

    const seedVegetables = ['Broccoli', 'Carrots', 'Spinach', 'Green Beans', 'Peas', 'Corn'];
    const vegetableCount = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM global_vegetables;`
    );
    if ((vegetableCount?.count ?? 0) === 0) {
        for (const veg of seedVegetables) {
            await db.runAsync(`INSERT INTO global_vegetables (veg_name) VALUES (?);`, [veg]);
        }
    }

    const seedMeals = [
        { name: 'Spaghetti Bolognese', category: 'pasta' },
        { name: 'Grilled Chicken', category: 'meat', vegetables: ['Green Beans'] },
        { name: 'Fish Tacos', category: 'fish', vegetables: ['Corn'] },
        { name: 'Vegetable Stir Fry', category: 'international', carbs: ['Rice'] },
        { name: 'Pork Chops', category: 'meat', carbs: ['Mashed Potatoes'], vegetables: ['Peas'] },
        { name: 'Steak', category: 'meat', carbs: ['Mashed Potatoes'], vegetables: ['Green Beans'] },
        { name: 'Salmon Fillet', category: 'fish', carbs: ['Quinoa'], vegetables: ['Spinach'] },
        { name: 'Chicken Alfredo', category: 'pasta' },
        { name: 'Beef Stew', category: 'meat', carbs: ['Bread'] },
        { name: 'Scampi Diabolique', category: 'fish', carbs: ['Rice'] }
    ];
    const mealCount = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM meals;`
    );
    if ((mealCount?.count ?? 0) === 0) {
        for (const mealData of seedMeals) {
            const meal = await db.runAsync(
                `INSERT OR IGNORE INTO meals (name, category) VALUES (?, ?);`,
                [mealData.name, mealData.category]
            );

            for (const carbName of mealData.carbs ?? []) {
                const carb = await db.getFirstAsync<{ id: number }>(
                    `SELECT id FROM global_carbs WHERE carb_name = ? LIMIT 1;`,
                    [carbName]
                );
                if (!carb) continue;

                await db.runAsync(
                    `INSERT OR IGNORE INTO meal_carbs_link (meal_id, carb_id) VALUES (?, ?);`,
                    [meal.lastInsertRowId, carb.id]
                );
            }

            for (const vegetableName of mealData.vegetables ?? []) {
                const vegetable = await db.getFirstAsync<{ id: number }>(
                    `SELECT id FROM global_vegetables WHERE veg_name = ? LIMIT 1;`,
                    [vegetableName]
                );
                if (!vegetable) continue;

                await db.runAsync(
                    `INSERT OR IGNORE INTO meal_vegetables_link (meal_id, veg_id) VALUES (?, ?);`,
                    [meal.lastInsertRowId, vegetable.id]
                );
            }
        }
    }

    const scheduledCount = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM scheduled_days;`
    );
    if ((scheduledCount?.count ?? 0) === 0) {
        const sampleDate = new Date();
        const date = [
            sampleDate.getFullYear(),
            String(sampleDate.getMonth() + 1).padStart(2, '0'),
            String(sampleDate.getDate()).padStart(2, '0'),
        ].join('-');
        await db.runAsync(
            `INSERT INTO scheduled_days (date, meal_id, selected_carb, selected_veg, widget_display_string)
             VALUES (?, NULL, ?, ?, ?);`,
            [date, 'Rice', 'Broccoli', 'Sample Dinner with Rice and Broccoli']
        );
    }
}
