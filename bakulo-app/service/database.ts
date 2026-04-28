/**
 * database.ts — v2
 * Agrega:
 *   • Tabla users con autenticación
 *   • Usuario de prueba: jaime / 1234567
 *   • db_validateUser, db_getCurrentUser, db_setCurrentUser
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const PG_API_URL    = 'https://api.tu-backend.com/pg';
const MONGO_API_URL = 'https://api.tu-backend.com/mongo';
const API_KEY       = 'YOUR_API_KEY';

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('serenity.db');
  return db;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export const initDatabase = (): void => {
  const database = getDb();
  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      display_name TEXT NOT NULL,
      email        TEXT,
      avatar_url   TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS glucose_entries (
      id          TEXT PRIMARY KEY,
      value       INTEGER NOT NULL,
      source      TEXT NOT NULL,
      device_name TEXT,
      note        TEXT,
      completed   INTEGER DEFAULT 1,
      timestamp   DATETIME NOT NULL,
      synced      INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exercise_entries (
      id               TEXT PRIMARY KEY,
      activity         TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      note             TEXT,
      completed        INTEGER DEFAULT 1,
      timestamp        DATETIME NOT NULL,
      synced           INTEGER DEFAULT 0,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_entries (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      category   TEXT NOT NULL,
      calories   INTEGER DEFAULT 0,
      carbs      INTEGER DEFAULT 0,
      protein    INTEGER DEFAULT 0,
      fat        INTEGER DEFAULT 0,
      image_uri  TEXT,
      completed  INTEGER DEFAULT 1,
      timestamp  DATETIME NOT NULL,
      synced     INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medication_entries (
      id         TEXT PRIMARY KEY,
      med_name   TEXT NOT NULL,
      med_type   TEXT NOT NULL,
      dosage     TEXT NOT NULL,
      zone       TEXT,
      completed  INTEGER DEFAULT 1,
      timestamp  DATETIME NOT NULL,
      synced     INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS repository_documents (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      uri         TEXT NOT NULL,
      base64      TEXT,
      size_bytes  INTEGER DEFAULT 0,
      tags        TEXT,
      description TEXT,
      uploaded_at DATETIME NOT NULL,
      synced      INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS security_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id  TEXT NOT NULL,
      operation  TEXT NOT NULL,
      payload    TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ── Insertar usuario de prueba jaime si no existe ──────────────────────────
  const existing = database.getFirstSync<{ id: string }>(
    'SELECT id FROM users WHERE username = ?', ['jaime']
  );
  if (!existing) {
    database.runSync(
      `INSERT INTO users (id, username, password, display_name, email)
       VALUES (?, ?, ?, ?, ?)`,
      ['user-jaime-001', 'jaime', '1234567', 'Jaime', 'jaime@serenity.app']
    );
  }
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * Valida credenciales. Retorna el usuario si son correctas, null si no.
 */
export const db_validateUser = (username: string, password: string): AppUser | null => {
  const row = getDb().getFirstSync<{
    id: string; username: string; display_name: string; email: string; avatar_url: string;
  }>(
    'SELECT id, username, display_name, email, avatar_url FROM users WHERE username = ? AND password = ?',
    [username.trim().toLowerCase(), password]
  );
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
  };
};

/** Guarda el usuario logueado en preferences */
export const db_setCurrentUser = (user: AppUser): void => {
  getDb().runSync(
    'INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)',
    ['current_user', JSON.stringify(user)]
  );
};

/** Lee el usuario logueado */
export const db_getCurrentUser = (): AppUser | null => {
  const row = getDb().getFirstSync<{ value: string }>(
    'SELECT value FROM user_preferences WHERE key = ?', ['current_user']
  );
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
};

/** Cierra sesión */
export const db_logout = (): void => {
  getDb().runSync('DELETE FROM user_preferences WHERE key = ?', ['current_user']);
};

// ─── GLUCOSE ─────────────────────────────────────────────────────────────────

export const db_saveGlucose = (entry: {
  id: string; value: number; source: string;
  deviceName?: string; note?: string; timestamp: Date;
}) => {
  getDb().runSync(
    `INSERT OR REPLACE INTO glucose_entries
     (id, value, source, device_name, note, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.value, entry.source,
     entry.deviceName ?? null, entry.note ?? null,
     entry.timestamp.toISOString()]
  );
  _enqueue('glucose_entries', entry.id, 'INSERT', entry);
};

export const db_getGlucoseEntries = (): any[] =>
  getDb().getAllSync('SELECT * FROM glucose_entries ORDER BY timestamp DESC');

// ─── EXERCISE ────────────────────────────────────────────────────────────────

export const db_saveExercise = (entry: {
  id: string; activity: string; durationMinutes: number;
  note?: string; timestamp: Date;
}) => {
  getDb().runSync(
    `INSERT OR REPLACE INTO exercise_entries
     (id, activity, duration_minutes, note, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [entry.id, entry.activity, entry.durationMinutes,
     entry.note ?? null, entry.timestamp.toISOString()]
  );
  _enqueue('exercise_entries', entry.id, 'INSERT', entry);
};

// ─── MEALS ───────────────────────────────────────────────────────────────────

export const db_saveMeal = (entry: {
  id: string; name: string; category: string;
  calories: number; carbs: number; protein: number; fat: number;
  imageUri?: string; timestamp: Date;
}) => {
  getDb().runSync(
    `INSERT OR REPLACE INTO meal_entries
     (id, name, category, calories, carbs, protein, fat, image_uri, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.name, entry.category,
     entry.calories, entry.carbs, entry.protein, entry.fat,
     entry.imageUri ?? null, entry.timestamp.toISOString()]
  );
};

// ─── MEDICATION ──────────────────────────────────────────────────────────────

export const db_saveMedication = (entry: {
  id: string; medName: string; medType: string;
  dosage: string; zone?: string; timestamp: Date;
}) => {
  getDb().runSync(
    `INSERT OR REPLACE INTO medication_entries
     (id, med_name, med_type, dosage, zone, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.medName, entry.medType,
     entry.dosage, entry.zone ?? null, entry.timestamp.toISOString()]
  );
};

// ─── REPOSITORY DOCUMENTS ────────────────────────────────────────────────────

export const db_saveDocument = (doc: {
  id: string; name: string; type: string; uri: string;
  base64?: string; sizeBytes?: number; tags?: string; description?: string;
  uploadedAt: Date;
}) => {
  getDb().runSync(
    `INSERT OR REPLACE INTO repository_documents
     (id, name, type, uri, base64, size_bytes, tags, description, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [doc.id, doc.name, doc.type, doc.uri,
     doc.base64 ?? null, doc.sizeBytes ?? 0,
     doc.tags ?? null, doc.description ?? null,
     doc.uploadedAt.toISOString()]
  );
  _enqueue('repository_documents', doc.id, 'INSERT', { ...doc, base64: null });
};

export const db_getDocuments = (): any[] =>
  getDb().getAllSync(
    'SELECT id, name, type, uri, size_bytes, tags, description, uploaded_at FROM repository_documents ORDER BY uploaded_at DESC'
  );

export const db_deleteDocument = (id: string) => {
  getDb().runSync('DELETE FROM repository_documents WHERE id = ?', [id]);
};

// ─── PREFERENCES ─────────────────────────────────────────────────────────────

export const db_setPreference = (key: string, value: string) => {
  getDb().runSync(
    'INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)', [key, value]
  );
};

export const db_getPreference = (key: string): string | null => {
  const row = getDb().getFirstSync<{ value: string }>(
    'SELECT value FROM user_preferences WHERE key = ?', [key]
  );
  return row?.value ?? null;
};

// ─── SECURITY ────────────────────────────────────────────────────────────────

export const db_logSecurityEvent = (type: 'password_change' | 'login' | 'biometric' | '2fa_setup') => {
  getDb().runSync('INSERT INTO security_logs (event_type) VALUES (?)', [type]);
};

// ─── SYNC QUEUE ──────────────────────────────────────────────────────────────

const _enqueue = (table: string, id: string, op: string, payload: any) => {
  try {
    getDb().runSync(
      `INSERT INTO sync_queue (table_name, record_id, operation, payload)
       VALUES (?, ?, ?, ?)`,
      [table, id, op, JSON.stringify(payload)]
    );
  } catch { /* no interrumpir */ }
};

export const db_getPendingSyncItems = (): any[] =>
  getDb().getAllSync('SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 100');

export const db_clearSyncedItems = (ids: number[]) => {
  if (ids.length === 0) return;
  const ph = ids.map(() => '?').join(',');
  getDb().runSync(`DELETE FROM sync_queue WHERE id IN (${ph})`, ids);
};

// ─── ADAPTERS ────────────────────────────────────────────────────────────────

export const PostgresAdapter = {
  syncPendingItems: async (): Promise<{ success: boolean; synced: number }> => {
    const items = db_getPendingSyncItems();
    if (items.length === 0) return { success: true, synced: 0 };
    try {
      const res = await fetch(`${PG_API_URL}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify({ operations: items }),
      });
      if (res.ok) { db_clearSyncedItems(items.map((i: any) => i.id)); return { success: true, synced: items.length }; }
      return { success: false, synced: 0 };
    } catch { return { success: false, synced: 0 }; }
  },
  fetchGlucoseReport: async (from: string, to: string): Promise<any[]> => {
    try {
      const res = await fetch(`${PG_API_URL}/glucose?from=${from}&to=${to}`, { headers: { 'X-API-Key': API_KEY } });
      if (res.ok) return await res.json();
    } catch {}
    return db_getGlucoseEntries();
  },
};

export const MongoAdapter = {
  uploadDocument: async (doc: { id: string; name: string; type: string; base64: string; metadata: Record<string, any> }): Promise<{ success: boolean; remoteId?: string }> => {
    try {
      const res = await fetch(`${MONGO_API_URL}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(doc),
      });
      if (res.ok) { const data = await res.json(); return { success: true, remoteId: data.id }; }
    } catch {}
    return { success: false };
  },
  listDocuments: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${MONGO_API_URL}/documents`, { headers: { 'X-API-Key': API_KEY } });
      if (res.ok) return await res.json();
    } catch {}
    return db_getDocuments();
  },
};