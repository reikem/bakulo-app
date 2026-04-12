import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('equilibrium.db');

export const initDatabase = () => {
  // Tabla de registros de salud y archivos
  db.execSync(`
    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      glucose_level INTEGER,
      carbs_intake INTEGER,
      notes TEXT,
      file_base64 TEXT, 
      file_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      carbs INTEGER,
      calories INTEGER,
      meal_type TEXT, -- Breakfast, Lunch, Dinner, Snack
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS security_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT, -- 'password_change', 'login'
      event_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// --- FUNCIONES DE PERSISTENCIA ---

export const saveHealthRecord = (glucose: number, carbs: number, base64: string, type: string) => {
  return db.runSync(
    'INSERT INTO health_records (glucose_level, carbs_intake, file_base64, file_type) VALUES (?, ?, ?, ?)',
    [glucose, carbs, base64, type]
  );
};

export const saveMeal = (name: string, carbs: number, calories: number, type: string) => {
  return db.runSync(
    'INSERT INTO meals (name, carbs, calories, meal_type) VALUES (?, ?, ?, ?)',
    [name, carbs, calories, type]
  );
};

export const updatePreference = (key: string, value: string) => {
  return db.runSync(
    'INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)',
    [key, value]
  );
};

export const logSecurityEvent = (type: 'password_change' | 'login') => {
  return db.runSync('INSERT INTO security_logs (event_type) VALUES (?)', [type]);
};