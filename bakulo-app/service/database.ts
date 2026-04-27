/**
 * database.ts
 * Capa de datos unificada:
 *  - SQLite local (expo-sqlite) para persistencia offline
 *  - Adaptador PostgreSQL (REST API) para sincronización remota
 *  - Adaptador MongoDB/NoSQL (REST API) para documentos/repositorio
 *
 * Instalación:
 *   npx expo install expo-sqlite
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Cambia estas URLs por las de tu backend real
const PG_API_URL    = 'https://api.tu-backend.com/pg';
const MONGO_API_URL = 'https://api.tu-backend.com/mongo';
const API_KEY       = 'YOUR_API_KEY';

// ─── SQLITE (LOCAL) ───────────────────────────────────────────────────────────
let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('serenity.db');
  return db;
}

export const initDatabase = (): void => {
  const database = getDb();
  database.execSync(`
    PRAGMA journal_mode = WAL;

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
      id              TEXT PRIMARY KEY,
      activity        TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      note            TEXT,
      completed       INTEGER DEFAULT 1,
      timestamp       DATETIME NOT NULL,
      synced          INTEGER DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_entries (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      category  TEXT NOT NULL,
      calories  INTEGER DEFAULT 0,
      carbs     INTEGER DEFAULT 0,
      protein   INTEGER DEFAULT 0,
      fat       INTEGER DEFAULT 0,
      image_uri TEXT,
      completed INTEGER DEFAULT 1,
      timestamp DATETIME NOT NULL,
      synced    INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medication_entries (
      id        TEXT PRIMARY KEY,
      med_name  TEXT NOT NULL,
      med_type  TEXT NOT NULL,
      dosage    TEXT NOT NULL,
      zone      TEXT,
      completed INTEGER DEFAULT 1,
      timestamp DATETIME NOT NULL,
      synced    INTEGER DEFAULT 0,
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
};

// ─── GLUCOSE ──────────────────────────────────────────────────────────────────
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

export const db_getGlucoseEntries = (): any[] => {
  return getDb().getAllSync(
    'SELECT * FROM glucose_entries ORDER BY timestamp DESC'
  );
};

// ─── EXERCISE ─────────────────────────────────────────────────────────────────
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

// ─── MEALS ────────────────────────────────────────────────────────────────────
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
  _enqueue('meal_entries', entry.id, 'INSERT', entry);
};

// ─── MEDICATION ───────────────────────────────────────────────────────────────
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
  _enqueue('medication_entries', entry.id, 'INSERT', entry);
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

export const db_getDocuments = (): any[] => {
  return getDb().getAllSync(
    'SELECT id, name, type, uri, size_bytes, tags, description, uploaded_at FROM repository_documents ORDER BY uploaded_at DESC'
  );
};

export const db_deleteDocument = (id: string) => {
  getDb().runSync('DELETE FROM repository_documents WHERE id = ?', [id]);
};

// ─── PREFERENCES ─────────────────────────────────────────────────────────────
export const db_setPreference = (key: string, value: string) => {
  getDb().runSync(
    'INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)',
    [key, value]
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
  getDb().runSync(
    'INSERT INTO security_logs (event_type) VALUES (?)', [type]
  );
};

// ─── SYNC QUEUE (para sincronización posterior) ───────────────────────────────
const _enqueue = (table: string, id: string, op: string, payload: any) => {
  try {
    getDb().runSync(
      `INSERT INTO sync_queue (table_name, record_id, operation, payload)
       VALUES (?, ?, ?, ?)`,
      [table, id, op, JSON.stringify(payload)]
    );
  } catch { /* no interrumpir si falla el enqueue */ }
};

export const db_getPendingSyncItems = (): any[] => {
  return getDb().getAllSync(
    'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 100'
  );
};

export const db_clearSyncedItems = (ids: number[]) => {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  getDb().runSync(`DELETE FROM sync_queue WHERE id IN (${placeholders})`, ids);
};

// ─── POSTGRESQL ADAPTER ───────────────────────────────────────────────────────
export const PostgresAdapter = {
  /**
   * Envía datos pendientes al backend PostgreSQL vía REST API.
   * Tu backend debe exponer POST /pg/batch con array de operaciones.
   */
  syncPendingItems: async (): Promise<{ success: boolean; synced: number }> => {
    const items = db_getPendingSyncItems();
    if (items.length === 0) return { success: true, synced: 0 };

    try {
      const response = await fetch(`${PG_API_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({ operations: items }),
      });

      if (response.ok) {
        db_clearSyncedItems(items.map((i: any) => i.id));
        return { success: true, synced: items.length };
      }
      return { success: false, synced: 0 };
    } catch {
      return { success: false, synced: 0 };
    }
  },

  /**
   * Obtiene reportes históricos del servidor PostgreSQL.
   */
  fetchGlucoseReport: async (from: string, to: string): Promise<any[]> => {
    try {
      const res = await fetch(
        `${PG_API_URL}/glucose?from=${from}&to=${to}`,
        { headers: { 'X-API-Key': API_KEY } }
      );
      if (res.ok) return await res.json();
    } catch { /* offline */ }
    // Fallback: devolver datos locales
    return db_getGlucoseEntries();
  },
};

// ─── MONGODB/NOSQL ADAPTER ────────────────────────────────────────────────────
export const MongoAdapter = {
  /**
   * Guarda un documento en MongoDB (ideal para PDFs, fotos grandes).
   * Tu backend debe exponer POST /mongo/documents.
   */
  uploadDocument: async (doc: {
    id: string; name: string; type: string;
    base64: string; metadata: Record<string, any>;
  }): Promise<{ success: boolean; remoteId?: string }> => {
    try {
      const res = await fetch(`${MONGO_API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(doc),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, remoteId: data.id };
      }
    } catch { /* offline */ }
    return { success: false };
  },

  /**
   * Lista documentos desde MongoDB.
   */
  listDocuments: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${MONGO_API_URL}/documents`, {
        headers: { 'X-API-Key': API_KEY },
      });
      if (res.ok) return await res.json();
    } catch { /* offline */ }
    return db_getDocuments(); // fallback local
  },
};
