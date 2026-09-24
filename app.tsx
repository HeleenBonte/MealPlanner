import { SQLiteProvider } from 'expo-sqlite';
import { Text, View } from 'react-native';
import { initializeDatabase } from './database/dbInit';

export default function App() {
    return (
        <SQLiteProvider databaseName="meals.db" onInit={initializeDatabase}>
            <View style = {{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Meal Planner Running!</Text>
            </View>
        </SQLiteProvider>   
    );
}