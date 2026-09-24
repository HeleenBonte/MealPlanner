import { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
    try{
       await db.execAsync('PRAGMA foreign_keys = ON;');

       await db.execAsync(`
            CREATE TABLE IF NOT EXISTS meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT CHECK(category IN ('italian', 'meat', 'fish', 'international') OR category IS NULL),
                last_cooked TEXT
            );
        `);
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS global_carbs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meal_id INTEGER NOT NULL,
                carb_name TEXT,
                FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
            );
        `);
       await db.execAsync(`
            CREATE TABLE IF NOT EXISTS global_vegetables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meal_id INTEGER NOT NULL,
                veg_name TEXT,
                FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
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

       await db.execAsync(`
            CREATE TABLE IF NOT EXISTS weekday_rules (
                day_index INTEGER PRIMARY KEY,
                day_name TEXT NOT NULL,
                required_category TEXT,
                fixed_meal_name TEXT
            );
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

        const rulesCountResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM weekday_rules;');

        if (rulesCountResult && rulesCountResult.count === 0) {
            console.log('Seeding baseline weekday rules into database...');

            const seedStatement = await db.prepareAsync(`
                INSERT INTO weekday_rules (day_index, day_name, required_category, fixed_meal_name)
                VALUES (?, ?, ?, ?);
            `);
            try {
                seedStatement.executeAsync(0, 'Monday', null, null);
                seedStatement.executeAsync(1, 'Tuesday', null, null);
                seedStatement.executeAsync(2, 'Wednesday', 'italian ', null);
                seedStatement.executeAsync(3, 'Thursday', null, null);
                seedStatement.executeAsync(4, 'Friday', 'fish', null);
                seedStatement.executeAsync(5, 'Saturday', null, 'pizza');
                seedStatement.executeAsync(6, 'Sunday', null, null);
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
