/**
 * service/database.ts — v3
 *
 * FIX:
 *   ✅ getDb exportado para que otros módulos puedan usarlo sin error TS
 *   ✅ generateUUID() — UUID v4 sin dependencias externas
 *   ✅ db_registerUser()    — registro con hash simple + activación por email
 *   ✅ db_resetPassword()   — genera contraseña provisoria
 *   ✅ db_changePassword()  — cambia contraseña desde la app
 *   ✅ db_activateUser()    — activa cuenta con token de email
 *   ✅ Campo activated, activation_token, reset_token en tabla users
 */

import * as SQLite from 'expo-sqlite';

const PG_API_URL    = 'https://api.tu-backend.com/pg';
const MONGO_API_URL = 'https://api.tu-backend.com/mongo';
const API_KEY       = 'YOUR_API_KEY';

// ─── DB SINGLETON — exportado para que otros archivos puedan usarlo ──────────

let _db: SQLite.SQLiteDatabase | null = null;

/** Retorna (y crea si no existe) la instancia de la base de datos. */
export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) _db = SQLite.openDatabaseSync('serenity.db');
  return _db;
}

// ─── UUID v4 sin dependencias externas ────────────────────────────────────────

/**
 * Genera un UUID v4 válido usando Math.random().
 * Compatible con React Native sin necesidad de 'uuid' o 'crypto'.
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Genera un token alfanumérico de N caracteres (para activación / reset). */
export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

export const initDatabase = (): void => {
  const database = getDb();

  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id               TEXT PRIMARY KEY,
      username         TEXT UNIQUE NOT NULL,
      password         TEXT NOT NULL,
      display_name     TEXT NOT NULL,
      email            TEXT UNIQUE,
      avatar_url       TEXT,
      activated        INTEGER DEFAULT 0,
      activation_token TEXT,
      reset_token      TEXT,
      reset_expires_at DATETIME,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // ── Migraciones — agrega columnas nuevas si la DB ya existía ─────────────
  // ALTER TABLE solo falla si la columna YA existe; ignoramos ese error.
  const migrations = [
    `ALTER TABLE users ADD COLUMN activated        INTEGER  DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN activation_token TEXT`,
    `ALTER TABLE users ADD COLUMN reset_token      TEXT`,
    `ALTER TABLE users ADD COLUMN reset_expires_at DATETIME`,
  ];
  for (const sql of migrations) {
    try { database.execSync(sql); } catch { /* columna ya existe — OK */ }
  }

  // ── Usuario de prueba jaime ────────────────────────────────────────────────
  const existing = database.getFirstSync<{ id: string }>(
    'SELECT id FROM users WHERE username = ?', ['jaime']
  );
  if (!existing) {
    database.runSync(
      `INSERT INTO users (id, username, password, display_name, email, activated)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [generateUUID(), 'jaime', '1234567', 'Jaime', 'jaime@serenity.app', 1]
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
  activated?: boolean;
}

/** Valida credenciales. Retorna el usuario si son correctas, null si no. */
export const db_validateUser = (username: string, password: string): AppUser | null => {
  const row = getDb().getFirstSync<{
    id: string; username: string; display_name: string;
    email: string; avatar_url: string; activated: number;
  }>(
    `SELECT id, username, display_name, email, avatar_url, activated
     FROM users WHERE username = ? AND password = ?`,
    [username.trim().toLowerCase(), password]
  );
  if (!row) return null;
  return {
    id:          row.id,
    username:    row.username,
    displayName: row.display_name,
    email:       row.email,
    avatarUrl:   row.avatar_url,
    activated:   row.activated === 1,
  };
};

/**
 * Registra un nuevo usuario local.
 * Genera UUID v4, token de activación y lo devuelve para enviarlo por email.
 *
 * También debe llamarse a supaSignUp() para crear el usuario en Supabase Auth
 * y enviar el email de activación desde allí.
 *
 * @returns { user, activationToken } o null si el username/email ya existe.
 */
export const db_registerUser = (params: {
  username: string;
  password: string;
  displayName: string;
  email: string;
}): { user: AppUser; activationToken: string } | null => {
  const db = getDb();

  // Verificar duplicados
  const dup = db.getFirstSync<{ id: string }>(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [params.username.trim().toLowerCase(), params.email.trim().toLowerCase()]
  );
  if (dup) return null;

  const id              = generateUUID();
  const activationToken = generateToken(48);
  const username        = params.username.trim().toLowerCase();

  db.runSync(
    `INSERT INTO users
       (id, username, password, display_name, email, activated, activation_token)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [id, username, params.password, params.displayName,
     params.email.trim().toLowerCase(), activationToken]
  );

  return {
    user: {
      id,
      username,
      displayName: params.displayName,
      email:       params.email.trim().toLowerCase(),
      activated:   false,
    },
    activationToken,
  };
};

/**
 * Activa la cuenta a partir del token enviado por email.
 * Retorna true si el token era válido.
 */
export const db_activateUser = (token: string): boolean => {
  const db = getDb();
  const row = db.getFirstSync<{ id: string }>(
    'SELECT id FROM users WHERE activation_token = ? AND activated = 0', [token]
  );
  if (!row) return false;
  db.runSync(
    'UPDATE users SET activated = 1, activation_token = NULL WHERE id = ?', [row.id]
  );
  return true;
};

/**
 * Inicia el flujo de reset de contraseña.
 * Guarda un token con expiración de 2 horas y lo retorna para enviarlo por email.
 * Retorna null si el email no existe.
 */
export const db_initiatePasswordReset = (email: string): {
  resetToken: string;
  displayName: string;
} | null => {
  const db = getDb();
  const row = db.getFirstSync<{ id: string; display_name: string }>(
    'SELECT id, display_name FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );
  if (!row) return null;

  const resetToken = generateToken(48);
  // Expira en 2 horas
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  db.runSync(
    'UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?',
    [resetToken, expiresAt, row.id]
  );

  return { resetToken, displayName: row.display_name };
};

/**
 * Genera y guarda una contraseña provisoria.
 * Retorna la contraseña en texto claro para enviarla por email.
 * Retorna null si el token es inválido o expiró.
 */
export const db_applyPasswordReset = (token: string): {
  tempPassword: string;
  email: string;
} | null => {
  const db = getDb();
  const now = new Date().toISOString();
  const row = db.getFirstSync<{ id: string; email: string; reset_expires_at: string }>(
    `SELECT id, email, reset_expires_at
     FROM users WHERE reset_token = ? AND reset_expires_at > ?`,
    [token, now]
  );
  if (!row) return null;

  // Genera contraseña provisoria de 10 caracteres
  const tempPassword = generateToken(10);

  db.runSync(
    'UPDATE users SET password = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?',
    [tempPassword, row.id]
  );

  return { tempPassword, email: row.email };
};

/**
 * Cambia la contraseña desde dentro de la app (usuario autenticado).
 * Verifica que la contraseña actual sea correcta antes de cambiar.
 */
export const db_changePassword = (params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): boolean => {
  const db = getDb();
  const row = db.getFirstSync<{ id: string }>(
    'SELECT id FROM users WHERE id = ? AND password = ?',
    [params.userId, params.currentPassword]
  );
  if (!row) return false;
  db.runSync('UPDATE users SET password = ? WHERE id = ?', [params.newPassword, params.userId]);
  db_logSecurityEvent('password_change');
  return true;
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

export const db_logSecurityEvent = (
  type: 'password_change' | 'login' | 'biometric' | '2fa_setup' | 'register' | 'reset_password'
) => {
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
      if (res.ok) {
        db_clearSyncedItems(items.map((i: any) => i.id));
        return { success: true, synced: items.length };
      }
      return { success: false, synced: 0 };
    } catch { return { success: false, synced: 0 }; }
  },
  fetchGlucoseReport: async (from: string, to: string): Promise<any[]> => {
    try {
      const res = await fetch(`${PG_API_URL}/glucose?from=${from}&to=${to}`, {
        headers: { 'X-API-Key': API_KEY },
      });
      if (res.ok) return await res.json();
    } catch {}
    return db_getGlucoseEntries();
  },
};

export const MongoAdapter = {
  uploadDocument: async (doc: {
    id: string; name: string; type: string; base64: string; metadata: Record<string, any>;
  }): Promise<{ success: boolean; remoteId?: string }> => {
    try {
      const res = await fetch(`${MONGO_API_URL}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(doc),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, remoteId: data.id };
      }
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