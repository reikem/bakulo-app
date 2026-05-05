/**
 * AppStore.tsx — Store central unificado
 *
 * Gestiona:
 *   • GlucoseEntry    → registros de glucosa
 *   • ExerciseEntry   → registros de ejercicio
 *   • MealEntry       → registros de comida
 *   • MedicationEntry → registros de medicación
 *   • NotificationEntry → notificaciones del sistema
 *
 * Flujo:
 *   LogGlucose / LogExercise / FoodLog / LogMedication
 *     → addEntry(...)
 *       → HistoryScreen lo muestra automáticamente
 *       → DashboardScreen se actualiza
 *       → Notificaciones se disparan si hay alertas
 */

import React, {
  createContext, useContext, useState,
  useCallback, useMemo, useRef, useEffect,
} from 'react';
import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── PERSISTENCIA: SQLite + Supabase ─────────────────────────────────────────
import {
  db_saveGlucose,
  db_saveExercise,
  db_saveMeal,
  db_saveMedication,
  db_getCurrentUser,
  AppUser,
} from '@/service/database';
import { authGetCurrentUser } from '@/service/authService';
import {
  upsertGlucoseEntry,
  upsertExerciseEntry,
  upsertMealEntry,
  upsertMedicationEntry,
} from '@/service/supabaseClient';

// ─── CONFIGURACIÓN DE NOTIFICACIONES ─────────────────────────────────────────

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await ExpoNotifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  delaySeconds = 1,
  data: Record<string, any> = {}
) {
  try {
    await ExpoNotifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: delaySeconds <= 0
        ? null
        : { type: ExpoNotifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds, repeats: false },
    });
  } catch (e) {
    console.warn('Notification error:', e);
  }
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type EntrySource = 'ble' | 'nfc' | 'manual';
export type EntryType = 'glucose' | 'exercise' | 'meal' | 'medication';

export interface GlucoseEntry {
  id: string;
  type: 'glucose';
  value: number;           // mg/dL
  timestamp: Date;
  source: EntrySource;
  deviceName?: string;
  note?: string;
  completed: boolean;
}

export interface ExerciseEntry {
  id: string;
  type: 'exercise';
  activity: string;        // 'Running', 'Gym', etc.
  durationMinutes: number;
  timestamp: Date;
  note?: string;
  completed: boolean;
}

export interface MealEntry {
  id: string;
  type: 'meal';
  name: string;
  category: string;        // 'Desayuno', 'Almuerzo', etc.
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  imageUri?: string;
  timestamp: Date;
  completed: boolean;
}

export interface MedicationEntry {
  id: string;
  type: 'medication';
  medName: string;
  medType: 'pastillas' | 'jarabe' | 'inyectables';
  dosage: string;
  zone?: string;           // Para inyectables
  timestamp: Date;
  completed: boolean;
}

export type AnyEntry = GlucoseEntry | ExerciseEntry | MealEntry | MedicationEntry;

export interface NotificationEntry {
  id: string;
  title: string;
  body: string;
  type: 'alert_high' | 'alert_low' | 'reminder' | 'info' | 'success';
  timestamp: Date;
  read: boolean;
  relatedEntryId?: string;
}

// Umbrales de alerta (configurables)
export interface AlertThresholds {
  highGlucose: number;   // default 180
  lowGlucose: number;    // default 70
  highEnabled: boolean;
  lowEnabled: boolean;
  mealReminders: boolean;
  medReminders: boolean;
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

export type TaskFrequency = 'daily' | 'weekly' | 'monthly';
export type TaskCategory  = 'glucose' | 'exercise' | 'meal' | 'medication' | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  frequency: TaskFrequency;
  category: TaskCategory;
  targetTime?: string;      // "08:00" — hora objetivo
  targetValue?: number;     // ej: 8 lecturas/día
  createdAt: Date;
  active: boolean;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  completedAt: Date;
  note?: string;
}

// ─── REWARDS ─────────────────────────────────────────────────────────────────

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;             // emoji
  xpRequired: number;
  unlockedAt?: Date;        // undefined = locked
  category: 'streak' | 'readings' | 'exercise' | 'meals' | 'medication' | 'special';
}

// ─── STREAK ───────────────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;    // días consecutivos con al menos 1 lectura
  longestStreak: number;
  totalReadings: number;
  totalXP: number;
  level: number;            // 1–10
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function normalizeHeight(v: number, min: number, max: number) {
  if (max === min) return 50;
  return Math.round(Math.min(95, Math.max(10, ((v - min) / (max - min)) * 75 + 15)));
}

const makeDate = (daysAgo: number, h = 8, m = 30) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
};

// ─── DATOS INICIALES ─────────────────────────────────────────────────────────
// Vacíos — los datos reales se cargan desde Supabase/SQLite al hacer login.
// Los datos de demo solo aparecen si NO hay usuario logueado.

const DEMO_ENTRIES: AnyEntry[] = [
  { id: 'g1', type: 'glucose', value: 108, timestamp: makeDate(0, 8, 30),  source: 'ble',    deviceName: 'Accu-Chek Instant', completed: true },
  { id: 'g2', type: 'glucose', value: 95,  timestamp: makeDate(0, 13, 0),  source: 'manual', completed: true },
  { id: 'g3', type: 'glucose', value: 122, timestamp: makeDate(1, 7, 45),  source: 'ble',    deviceName: 'Accu-Chek Instant', completed: true },
  { id: 'g4', type: 'glucose', value: 135, timestamp: makeDate(2, 8, 0),   source: 'nfc',    deviceName: 'FreeStyle Libre 1', completed: true },
  { id: 'g5', type: 'glucose', value: 88,  timestamp: makeDate(3, 9, 30),  source: 'manual', completed: true },
  { id: 'g6', type: 'glucose', value: 162, timestamp: makeDate(4, 7, 0),   source: 'manual', completed: true },
  { id: 'g7', type: 'glucose', value: 118, timestamp: makeDate(5, 8, 15),  source: 'ble',    completed: true },
  { id: 'e1', type: 'exercise', activity: 'Running', durationMinutes: 30, timestamp: makeDate(0, 7, 0),  completed: true },
  { id: 'e2', type: 'exercise', activity: 'Gym',     durationMinutes: 45, timestamp: makeDate(2, 18, 0), completed: true },
  { id: 'm1', type: 'meal', name: 'Bowl de Avena',  category: 'Desayuno', calories: 320, carbs: 45, protein: 12, fat: 8, timestamp: makeDate(0, 8, 0),  completed: true },
  { id: 'm2', type: 'meal', name: 'Ensalada Verde', category: 'Almuerzo', calories: 210, carbs: 18, protein: 15, fat: 6, timestamp: makeDate(1, 12, 30), completed: true },
  { id: 'med1', type: 'medication', medName: 'Metformina', medType: 'pastillas',    dosage: '500mg', timestamp: makeDate(0, 8, 0),  completed: true },
  { id: 'med2', type: 'medication', medName: 'Insulina',   medType: 'inyectables', dosage: '10U', zone: 'abdomen', timestamp: makeDate(1, 7, 30), completed: true },
];

const DEMO_NOTIFICATIONS: NotificationEntry[] = [
  { id: 'n1', title: 'Glucosa Elevada',       body: 'Tu nivel fue de 162 mg/dL.',          type: 'alert_high', timestamp: makeDate(4, 7, 1),  read: true  },
  { id: 'n2', title: 'Registro Guardado',     body: 'Glucosa 108 mg/dL registrada.',        type: 'success',    timestamp: makeDate(0, 8, 31), read: false },
  { id: 'n3', title: 'Recordatorio de Comida',body: 'Recuerda registrar tu almuerzo.',      type: 'reminder',   timestamp: makeDate(0, 12, 0), read: false },
];

// Al arrancar: si hay usuario logueado cargamos vacío (se llenará con Supabase pull).
// Si no hay usuario mostramos los datos de demo para que la UI no esté vacía.
const hasLocalUser = !!db_getCurrentUser();
const INITIAL_ENTRIES:        AnyEntry[]           = hasLocalUser ? [] : DEMO_ENTRIES;
const INITIAL_NOTIFICATIONS:  NotificationEntry[]  = hasLocalUser ? [] : DEMO_NOTIFICATIONS;

// ─── INITIAL TASKS ───────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Lectura en ayunas',     description: 'Mide tu glucosa antes del desayuno',     frequency: 'daily',   category: 'glucose',    targetTime: '08:00', createdAt: new Date(), active: true },
  { id: 't2', title: 'Lectura posprandial',   description: 'Mide 2h después del almuerzo',           frequency: 'daily',   category: 'glucose',    targetTime: '14:00', createdAt: new Date(), active: true },
  { id: 't3', title: 'Tomar medicación',      description: 'No olvides tu dosis matutina',           frequency: 'daily',   category: 'medication', targetTime: '08:15', createdAt: new Date(), active: true },
  { id: 't4', title: 'Ejercicio semanal',     description: 'Al menos 30 min de actividad física',    frequency: 'weekly',  category: 'exercise',   targetValue: 3,      createdAt: new Date(), active: true },
  { id: 't5', title: 'Control médico',        description: 'Revisión mensual con tu médico',         frequency: 'monthly', category: 'other',                           createdAt: new Date(), active: true },
  { id: 't6', title: 'Registrar desayuno',    description: 'Anota lo que comiste en el desayuno',    frequency: 'daily',   category: 'meal',       targetTime: '09:00', createdAt: new Date(), active: true },
];

const INITIAL_COMPLETIONS: TaskCompletion[] = [
  { id: 'c1', taskId: 't1', completedAt: makeDate(0, 8, 5)  },
  { id: 'c2', taskId: 't3', completedAt: makeDate(0, 8, 20) },
  { id: 'c3', taskId: 't1', completedAt: makeDate(1, 8, 10) },
  { id: 'c4', taskId: 't3', completedAt: makeDate(1, 8, 15) },
  { id: 'c5', taskId: 't1', completedAt: makeDate(2, 7, 55) },
  { id: 'c6', taskId: 't4', completedAt: makeDate(2, 18, 0) },
  { id: 'c7', taskId: 't1', completedAt: makeDate(3, 8, 30) },
  { id: 'c8', taskId: 't6', completedAt: makeDate(0, 9, 15) },
];

// ─── INITIAL REWARDS ─────────────────────────────────────────────────────────

const INITIAL_REWARDS: Reward[] = [
  { id: 'r1',  title: 'Primera Lectura',    description: 'Registraste tu primera glucosa',                 icon: '🩸', xpRequired: 10,   category: 'readings',    unlockedAt: makeDate(6) },
  { id: 'r2',  title: 'Racha de 3 días',    description: '3 días consecutivos con lecturas',               icon: '🔥', xpRequired: 50,   category: 'streak',      unlockedAt: makeDate(4) },
  { id: 'r3',  title: 'Deportista',         description: 'Registraste 5 ejercicios',                       icon: '🏃', xpRequired: 100,  category: 'exercise',    unlockedAt: makeDate(2) },
  { id: 'r4',  title: 'Racha de 7 días',    description: '7 días consecutivos con lecturas',               icon: '⚡', xpRequired: 150,  category: 'streak',      unlockedAt: undefined   },
  { id: 'r5',  title: 'Nutricionista',      description: 'Registraste 10 comidas',                         icon: '🥗', xpRequired: 200,  category: 'meals',       unlockedAt: undefined   },
  { id: 'r6',  title: 'Constante',          description: '30 días consecutivos con lecturas',               icon: '🏆', xpRequired: 500,  category: 'streak',      unlockedAt: undefined   },
  { id: 'r7',  title: 'En Control',         description: 'Mantén 7 días seguidos en rango 70-140',         icon: '🎯', xpRequired: 300,  category: 'readings',    unlockedAt: undefined   },
  { id: 'r8',  title: 'Medicado Puntual',   description: 'Tomaste tu medicación 14 días seguidos',         icon: '💊', xpRequired: 250,  category: 'medication',  unlockedAt: undefined   },
  { id: 'r9',  title: 'Maestro del Control',description: '100 lecturas registradas',                       icon: '🌟', xpRequired: 1000, category: 'readings',    unlockedAt: undefined   },
  { id: 'r10', title: 'Superhumano',        description: 'Nivel 10 alcanzado',                             icon: '🦸', xpRequired: 2000, category: 'special',     unlockedAt: undefined   },
];

interface AppStoreValue {
  // Entries
  entries: AnyEntry[];
  glucoseEntries: GlucoseEntry[];
  exerciseEntries: ExerciseEntry[];
  mealEntries: MealEntry[];
  medicationEntries: MedicationEntry[];
  latestGlucose: GlucoseEntry | null;

  addGlucoseEntry:    (data: Omit<GlucoseEntry,    'id'|'type'|'completed'>) => void;
  addExerciseEntry:   (data: Omit<ExerciseEntry,   'id'|'type'|'completed'>) => void;
  addMealEntry:       (data: Omit<MealEntry,       'id'|'type'|'completed'>) => void;
  addMedicationEntry: (data: Omit<MedicationEntry, 'id'|'type'|'completed'>) => void;
  markCompleted:      (id: string) => void;
  deleteEntry:        (id: string) => void;

  // Query helpers
  getEntriesForDate:       (date: Date) => AnyEntry[];
  getGlucoseEntriesForDate:(date: Date) => GlucoseEntry[];
  getDaysWithEntries:      (year: number, month: number) => Set<number>;
  getDaysWithoutEntries:   (year: number, month: number) => Set<number>;
  getWeeklyGlucoseData:    () => { label: string; value: number; h: number }[];
  getMonthlyGlucoseData:   () => { label: string; value: number; h: number }[];

  // Notifications
  notifications:       NotificationEntry[];
  unreadCount:         number;
  markNotificationRead:(id: string) => void;
  markAllRead:         () => void;
  addNotification:     (n: Omit<NotificationEntry, 'id'|'timestamp'|'read'>) => void;

  // Alert thresholds
  thresholds: AlertThresholds;
  updateThresholds: (t: Partial<AlertThresholds>) => void;

  // Tasks
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  addTask:        (data: Omit<Task, 'id'|'createdAt'>) => void;
  deleteTask:     (id: string) => void;
  toggleTask:     (id: string) => void;
  completeTask:   (taskId: string, note?: string) => void;
  getTasksForFrequency: (freq: TaskFrequency) => Task[];
  isTaskCompletedToday: (taskId: string) => boolean;
  getStreakForTask:     (taskId: string) => number;
  getCompletionDaysThisMonth: (taskId: string, year: number, month: number) => Set<number>;

  // Streak & XP
  streakData: StreakData;

  // Rewards
  rewards: Reward[];
  unlockedRewards: Reward[];

  // Current authenticated user
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  refreshCurrentUser: () => Promise<void>;
  clearUserData: () => void;
  loadUserData: () => Promise<void>;
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [entries,       setEntries]       = useState<AnyEntry[]>(INITIAL_ENTRIES);
  const [notifications, setNotifications] = useState<NotificationEntry[]>(INITIAL_NOTIFICATIONS);
  const [thresholds,    setThresholds]    = useState<AlertThresholds>({
    highGlucose: 180, lowGlucose: 70,
    highEnabled: true, lowEnabled: true,
    mealReminders: true, medReminders: true,
  });
  const [tasks,       setTasks]       = useState<Task[]>(INITIAL_TASKS);
  const [completions, setCompletions] = useState<TaskCompletion[]>(INITIAL_COMPLETIONS);
  const [currentUser, setCurrentUserState] = useState<AppUser | null>(() => db_getCurrentUser());

  // Cargar usuario al montar (sync local) y luego refrescar desde Supabase
  useEffect(() => {
    refreshCurrentUser();
  }, []);

  const setCurrentUser = useCallback((user: AppUser | null) => {
    setCurrentUserState(user);
  }, []);

  // ── Limpia TODO el estado cuando el usuario cierra sesión ─────────────────
  const clearUserData = useCallback(() => {
    setEntries([]);
    setNotifications([]);
    setTasks(INITIAL_TASKS);
    setCompletions([]);
    setCurrentUserState(null);
  }, []);

  // ── Carga los datos del usuario desde Supabase al hacer login ─────────────
  const loadUserData = useCallback(async () => {
    try {
      const { pullFromSupabase } = await import('@/service/syncService');
      const remote = await pullFromSupabase();

      // Mapear entradas remotas al formato AnyEntry
      const glucoseEntries: AnyEntry[] = (remote.glucose ?? []).map((r: any) => ({
        id:         r.id,
        type:       'glucose' as const,
        value:      r.value,
        source:     r.source,
        deviceName: r.device_name ?? undefined,
        note:       r.note ?? undefined,
        completed:  r.completed ?? true,
        timestamp:  new Date(r.timestamp),
      }));

      const exerciseEntries: AnyEntry[] = (remote.exercise ?? []).map((r: any) => ({
        id:              r.id,
        type:            'exercise' as const,
        activity:        r.activity,
        durationMinutes: r.duration_minutes,
        note:            r.note ?? undefined,
        completed:       r.completed ?? true,
        timestamp:       new Date(r.timestamp),
      }));

      const mealEntries: AnyEntry[] = (remote.meals ?? []).map((r: any) => ({
        id:        r.id,
        type:      'meal' as const,
        name:      r.name,
        category:  r.category,
        calories:  r.calories ?? 0,
        carbs:     r.carbs    ?? 0,
        protein:   r.protein  ?? 0,
        fat:       r.fat      ?? 0,
        imageUri:  r.image_uri ?? undefined,
        completed: r.completed ?? true,
        timestamp: new Date(r.timestamp),
      }));

      const medicationEntries: AnyEntry[] = (remote.medication ?? []).map((r: any) => ({
        id:        r.id,
        type:      'medication' as const,
        medName:   r.med_name,
        medType:   r.med_type,
        dosage:    r.dosage,
        zone:      r.zone ?? undefined,
        completed: r.completed ?? true,
        timestamp: new Date(r.timestamp),
      }));

      const allEntries = [
        ...glucoseEntries,
        ...exerciseEntries,
        ...mealEntries,
        ...medicationEntries,
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (allEntries.length > 0) {
        setEntries(allEntries);
      }
    } catch (e) {
      console.warn('[AppStore] loadUserData error:', e);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const user = await authGetCurrentUser();
      if (user) {
        setCurrentUserState(user);
        // Al refrescar usuario, también cargamos sus datos
        loadUserData();
      }
    } catch {
      const local = db_getCurrentUser();
      if (local) setCurrentUserState(local);
    }
  }, [loadUserData]);

  // UUID v4 compatible con Supabase (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
  const uid = (): string =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

  // ── Agregar notificación interna ──────────────────────────────────────────
  const addNotification = useCallback((n: Omit<NotificationEntry, 'id'|'timestamp'|'read'>) => {
    setNotifications(prev => [{
      ...n, id: uid(), timestamp: new Date(), read: false,
    }, ...prev]);
  }, []);

  // ── Disparar alerta de glucosa si supera umbral ───────────────────────────
  const checkGlucoseAlerts = useCallback(async (value: number, entryId: string) => {
    if (thresholds.highEnabled && value >= thresholds.highGlucose) {
      const title = '⚠️ Glucosa Elevada';
      const body  = `Tu nivel es ${value} mg/dL (umbral: ${thresholds.highGlucose})`;
      addNotification({ title, body, type: 'alert_high', relatedEntryId: entryId });
      await scheduleLocalNotification(title, body, 1, { type: 'alert_high', value });
    } else if (thresholds.lowEnabled && value <= thresholds.lowGlucose) {
      const title = '🚨 Glucosa Baja — Atención';
      const body  = `Tu nivel es ${value} mg/dL (umbral: ${thresholds.lowGlucose})`;
      addNotification({ title, body, type: 'alert_low', relatedEntryId: entryId });
      await scheduleLocalNotification(title, body, 1, { type: 'alert_low', value });
    } else {
      addNotification({
        title: '✓ Registro Guardado',
        body: `Glucosa ${value} mg/dL registrada correctamente.`,
        type: 'success', relatedEntryId: entryId,
      });
    }
  }, [thresholds, addNotification]);

  // ── ADD GLUCOSE — memoria + SQLite + Supabase ─────────────────────────────
  const addGlucoseEntry = useCallback(async (data: Omit<GlucoseEntry, 'id'|'type'|'completed'>) => {
    const id    = uid();
    const entry: GlucoseEntry = { ...data, id, type: 'glucose', completed: true };

    // 1. Estado en memoria (UI reactivo inmediato)
    setEntries(prev => [entry, ...prev]);

    // 2. SQLite local (offline-first + encola en sync_queue)
    try {
      db_saveGlucose({
        id,
        value:      data.value,
        source:     data.source,
        deviceName: data.deviceName,
        note:       data.note,
        timestamp:  data.timestamp,
      });
    } catch (e) {
      console.warn('[AppStore] db_saveGlucose error:', e);
    }

    // 3. Supabase directo (si hay conexión)
    try {
      const user = db_getCurrentUser();
      if (user) {
        await upsertGlucoseEntry({
          id,
          userId:     user.id,
          value:      data.value,
          source:     data.source,
          deviceName: data.deviceName,
          note:       data.note,
          timestamp:  data.timestamp,
        });
        console.log('[Supabase] ✅ Glucosa guardada:', id, data.value, 'mg/dL');
      }
    } catch (e) {
      console.warn('[Supabase] upsertGlucoseEntry falló (se sincronizará después):', e);
    }

    // 4. Alertas
    await checkGlucoseAlerts(data.value, id);
  }, [checkGlucoseAlerts]);

  // ── ADD EXERCISE — memoria + SQLite + Supabase ────────────────────────────
  const addExerciseEntry = useCallback(async (data: Omit<ExerciseEntry, 'id'|'type'|'completed'>) => {
    const id    = uid();
    const entry: ExerciseEntry = { ...data, id, type: 'exercise', completed: true };

    // 1. Memoria
    setEntries(prev => [entry, ...prev]);

    // 2. SQLite
    try {
      db_saveExercise({
        id,
        activity:        data.activity,
        durationMinutes: data.durationMinutes,
        note:            data.note,
        timestamp:       data.timestamp,
      });
    } catch (e) {
      console.warn('[AppStore] db_saveExercise error:', e);
    }

    // 3. Supabase
    try {
      const user = db_getCurrentUser();
      if (user) {
        await upsertExerciseEntry({
          id,
          userId:          user.id,
          activity:        data.activity,
          durationMinutes: data.durationMinutes,
          note:            data.note,
          timestamp:       data.timestamp,
        });
        console.log('[Supabase] ✅ Ejercicio guardado:', id, data.activity);
      }
    } catch (e) {
      console.warn('[Supabase] upsertExerciseEntry falló:', e);
    }

    // 4. Notificación
    addNotification({
      title: '🏃 Ejercicio Registrado',
      body:  `${data.activity} · ${data.durationMinutes} min`,
      type:  'success',
      relatedEntryId: id,
    });
  }, [addNotification]);

  // ── ADD MEAL — memoria + SQLite + Supabase ────────────────────────────────
  const addMealEntry = useCallback(async (data: Omit<MealEntry, 'id'|'type'|'completed'>) => {
    const id    = uid();
    const entry: MealEntry = { ...data, id, type: 'meal', completed: true };

    // 1. Memoria
    setEntries(prev => [entry, ...prev]);

    // 2. SQLite
    try {
      db_saveMeal({
        id,
        name:      data.name,
        category:  data.category,
        calories:  data.calories,
        carbs:     data.carbs,
        protein:   data.protein,
        fat:       data.fat,
        imageUri:  data.imageUri,
        timestamp: data.timestamp,
      });
    } catch (e) {
      console.warn('[AppStore] db_saveMeal error:', e);
    }

    // 3. Supabase
    try {
      const user = db_getCurrentUser();
      if (user) {
        await upsertMealEntry({
          id,
          userId:    user.id,
          name:      data.name,
          category:  data.category,
          calories:  data.calories,
          carbs:     data.carbs,
          protein:   data.protein,
          fat:       data.fat,
          imageUri:  data.imageUri,
          timestamp: data.timestamp,
        });
        console.log('[Supabase] ✅ Comida guardada:', id, data.name);
      }
    } catch (e) {
      console.warn('[Supabase] upsertMealEntry falló:', e);
    }

    // 4. Notificación
    addNotification({
      title: '🍽️ Comida Registrada',
      body:  `${data.name} · ${data.calories} kcal`,
      type:  'success',
      relatedEntryId: id,
    });
  }, [addNotification]);

  // ── ADD MEDICATION — memoria + SQLite + Supabase ──────────────────────────
  const addMedicationEntry = useCallback(async (data: Omit<MedicationEntry, 'id'|'type'|'completed'>) => {
    const id    = uid();
    const entry: MedicationEntry = { ...data, id, type: 'medication', completed: true };

    // 1. Memoria
    setEntries(prev => [entry, ...prev]);

    // 2. SQLite
    try {
      db_saveMedication({
        id,
        medName:   data.medName,
        medType:   data.medType,
        dosage:    data.dosage,
        zone:      data.zone,
        timestamp: data.timestamp,
      });
    } catch (e) {
      console.warn('[AppStore] db_saveMedication error:', e);
    }

    // 3. Supabase
    try {
      const user = db_getCurrentUser();
      if (user) {
        await upsertMedicationEntry({
          id,
          userId:    user.id,
          medName:   data.medName,
          medType:   data.medType,
          dosage:    data.dosage,
          zone:      data.zone,
          timestamp: data.timestamp,
        });
        console.log('[Supabase] ✅ Medicación guardada:', id, data.medName);
      }
    } catch (e) {
      console.warn('[Supabase] upsertMedicationEntry falló:', e);
    }

    // 4. Notificación
    addNotification({
      title: '💊 Medicación Registrada',
      body:  `${data.medName} · ${data.dosage}`,
      type:  'success',
      relatedEntryId: id,
    });
  }, [addNotification]);

  // ── MARK COMPLETED ────────────────────────────────────────────────────────
  const markCompleted = useCallback((id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  }, []);

  // ── DELETE ENTRY — memoria + SQLite + Supabase ────────────────────────────
  const deleteEntry = useCallback(async (id: string) => {
    // 1. Memoria
    setEntries(prev => prev.filter(e => e.id !== id));

    // 2. SQLite — eliminar de la tabla correspondiente
    try {
      const db = (await import('@/service/database')).getDb?.();
      if (db) {
        // Intenta borrar de las 4 tablas posibles (solo afectará la que tiene el id)
        const tables = ['glucose_entries','exercise_entries','meal_entries','medication_entries'];
        for (const t of tables) {
          try { db.runSync(`DELETE FROM ${t} WHERE id = ?`, [id]); } catch {}
        }
      }
    } catch (e) {
      console.warn('[AppStore] deleteEntry SQLite error:', e);
    }

    // 3. Supabase
    try {
      const { supabase } = await import('@/service/supabaseClient');
      const user = db_getCurrentUser();
      if (user) {
        const tables = ['glucose_entries','exercise_entries','meal_entries','medication_entries'];
        for (const t of tables) {
          const { error } = await supabase.from(t).delete().eq('id', id).eq('user_id', user.id);
          if (!error) { console.log('[Supabase] ✅ Eliminado de', t, id); break; }
        }
      }
    } catch (e) {
      console.warn('[Supabase] deleteEntry error:', e);
    }
  }, []);

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // ── QUERY HELPERS ─────────────────────────────────────────────────────────
  const glucoseEntries    = useMemo(() => entries.filter((e): e is GlucoseEntry    => e.type === 'glucose'),    [entries]);
  const exerciseEntries   = useMemo(() => entries.filter((e): e is ExerciseEntry   => e.type === 'exercise'),   [entries]);
  const mealEntries       = useMemo(() => entries.filter((e): e is MealEntry       => e.type === 'meal'),       [entries]);
  const medicationEntries = useMemo(() => entries.filter((e): e is MedicationEntry => e.type === 'medication'), [entries]);
  const latestGlucose     = useMemo(() => glucoseEntries[0] ?? null, [glucoseEntries]);

  const getEntriesForDate = useCallback(
    (date: Date) => entries.filter(e => isSameDay(e.timestamp, date)),
    [entries]
  );
  const getGlucoseEntriesForDate = useCallback(
    (date: Date) => glucoseEntries.filter(e => isSameDay(e.timestamp, date)),
    [glucoseEntries]
  );

  const getDaysWithEntries = useCallback((year: number, month: number): Set<number> => {
    const days = new Set<number>();
    entries.forEach(e => {
      if (e.timestamp.getFullYear() === year && e.timestamp.getMonth() === month)
        days.add(e.timestamp.getDate());
    });
    return days;
  }, [entries]);

  const getDaysWithoutEntries = useCallback((year: number, month: number): Set<number> => {
    const withEntries = getDaysWithEntries(year, month);
    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const missing = new Set<number>();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const lastDay = isCurrentMonth ? today.getDate() - 1 : daysInMonth;
    for (let d = 1; d <= lastDay; d++) {
      if (!withEntries.has(d)) missing.add(d);
    }
    return missing;
  }, [getDaysWithEntries]);

  const getWeeklyGlucoseData = useCallback(() => {
    const labels = ['L','M','X','J','V','S','D'];
    const today = new Date();
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const dayE = glucoseEntries.filter(e => isSameDay(e.timestamp, d));
      values.push(dayE.length > 0 ? Math.round(dayE.reduce((s,e) => s+e.value,0)/dayE.length) : 0);
    }
    const nonZero = values.filter(v=>v>0);
    const min = nonZero.length ? Math.min(...nonZero) : 70;
    const max = nonZero.length ? Math.max(...nonZero) : 180;
    return values.map((v,i) => {
      const d = new Date(today); d.setDate(today.getDate() - (6-i));
      const dow = d.getDay();
      return { label: labels[dow===0?6:dow-1], value: v, h: v>0 ? normalizeHeight(v,min,max) : 8 };
    });
  }, [glucoseEntries]);

  const getMonthlyGlucoseData = useCallback(() => {
    const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const today = new Date();
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth()-i, 1);
      const me = glucoseEntries.filter(e=>e.timestamp.getFullYear()===d.getFullYear()&&e.timestamp.getMonth()===d.getMonth());
      values.push(me.length ? Math.round(me.reduce((s,e)=>s+e.value,0)/me.length) : 0);
    }
    const nonZero = values.filter(v=>v>0);
    const min = nonZero.length ? Math.min(...nonZero) : 70;
    const max = nonZero.length ? Math.max(...nonZero) : 180;
    return values.map((v,i) => {
      const d = new Date(today.getFullYear(), today.getMonth()-(6-i), 1);
      return { label: names[d.getMonth()], value: v, h: v>0?normalizeHeight(v,min,max):8 };
    });
  }, [glucoseEntries]);

  const unreadCount = useMemo(() => notifications.filter(n=>!n.read).length, [notifications]);

  const updateThresholds = useCallback((t: Partial<AlertThresholds>) => {
    setThresholds(prev => ({ ...prev, ...t }));
  }, []);

  // ── TASKS ─────────────────────────────────────────────────────────────────
  const addTask = useCallback((data: Omit<Task, 'id'|'createdAt'>) => {
    setTasks(prev => [{ ...data, id: uid(), createdAt: new Date() }, ...prev]);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  }, []);

  const completeTask = useCallback((taskId: string, note?: string) => {
    const c: TaskCompletion = { id: uid(), taskId, completedAt: new Date(), note };
    setCompletions(prev => [c, ...prev]);
    // XP + notify
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      scheduleLocalNotification('✅ Tarea completada', `"${task.title}" marcada como hecha. +10 XP`, 1);
      addNotification({ title: '✅ Tarea completada', body: `"${task.title}" +10 XP`, type: 'success' });
    }
  }, [tasks, addNotification]);

  const getTasksForFrequency = useCallback((freq: TaskFrequency) =>
    tasks.filter(t => t.frequency === freq && t.active),
  [tasks]);

  const isTaskCompletedToday = useCallback((taskId: string) => {
    const today = new Date();
    return completions.some(c =>
      c.taskId === taskId && isSameDay(c.completedAt, today)
    );
  }, [completions]);

  const getStreakForTask = useCallback((taskId: string) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const done = completions.some(c => c.taskId === taskId && isSameDay(c.completedAt, d));
      if (done) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [completions]);

  const getCompletionDaysThisMonth = useCallback((taskId: string, year: number, month: number): Set<number> => {
    const days = new Set<number>();
    completions
      .filter(c => c.taskId === taskId &&
        c.completedAt.getFullYear() === year &&
        c.completedAt.getMonth() === month)
      .forEach(c => days.add(c.completedAt.getDate()));
    return days;
  }, [completions]);

  // ── STREAK DATA ───────────────────────────────────────────────────────────
  const streakData = useMemo<StreakData>(() => {
    const glucoseEs = entries.filter(e => e.type === 'glucose') as GlucoseEntry[];
    const totalReadings = glucoseEs.length;
    // Current streak: consecutive days with at least one glucose reading
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (glucoseEs.some(e => isSameDay(e.timestamp, d))) currentStreak++;
      else if (i > 0) break;
    }
    // Longest streak
    let longestStreak = 0, run = 0;
    const sortedDays = Array.from(new Set(
      glucoseEs.map(e => {
        const d = e.timestamp;
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    )).sort();
    sortedDays.forEach((day, i) => {
      if (i === 0) { run = 1; return; }
      const [y1,m1,d1] = sortedDays[i-1].split('-').map(Number);
      const [y2,m2,d2] = day.split('-').map(Number);
      const prev = new Date(y1, m1, d1);
      const curr = new Date(y2, m2, d2);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) run++;
      else run = 1;
      if (run > longestStreak) longestStreak = run;
    });
    if (run > longestStreak) longestStreak = run;
    const totalXP = totalReadings * 10 + completions.length * 5 + currentStreak * 15;
    const level = Math.min(10, Math.floor(totalXP / 200) + 1);
    return { currentStreak, longestStreak, totalReadings, totalXP, level };
  }, [entries, completions]);

  // ── REWARDS — auto-unlock based on streakData ─────────────────────────────
  const rewards = useMemo(() => {
    return INITIAL_REWARDS.map(r => {
      if (r.unlockedAt) return r; // already unlocked in seed data
      let shouldUnlock = false;
      if (r.id === 'r4'  && streakData.currentStreak >= 7)   shouldUnlock = true;
      if (r.id === 'r5'  && (entries.filter(e=>e.type==='meal').length >= 10))  shouldUnlock = true;
      if (r.id === 'r6'  && streakData.currentStreak >= 30)  shouldUnlock = true;
      if (r.id === 'r7'  && streakData.currentStreak >= 7 &&
          (entries.filter(e=>e.type==='glucose') as GlucoseEntry[])
            .slice(0,7).every(e=>e.value>=70&&e.value<=140)) shouldUnlock = true;
      if (r.id === 'r8'  && completions.filter(c=>c.taskId==='t3').length >= 14) shouldUnlock = true;
      if (r.id === 'r9'  && streakData.totalReadings >= 100) shouldUnlock = true;
      if (r.id === 'r10' && streakData.level >= 10)          shouldUnlock = true;
      return shouldUnlock ? { ...r, unlockedAt: new Date() } : r;
    });
  }, [streakData, entries, completions]);

  const unlockedRewards = useMemo(() => rewards.filter(r => !!r.unlockedAt), [rewards]);

  const value = useMemo<AppStoreValue>(() => ({
    entries, glucoseEntries, exerciseEntries, mealEntries, medicationEntries, latestGlucose,
    addGlucoseEntry, addExerciseEntry, addMealEntry, addMedicationEntry,
    markCompleted, deleteEntry,
    getEntriesForDate, getGlucoseEntriesForDate,
    getDaysWithEntries, getDaysWithoutEntries,
    getWeeklyGlucoseData, getMonthlyGlucoseData,
    notifications, unreadCount, markNotificationRead, markAllRead, addNotification,
    thresholds, updateThresholds,
    tasks, taskCompletions: completions, addTask, deleteTask, toggleTask, completeTask,
    getTasksForFrequency, isTaskCompletedToday, getStreakForTask, getCompletionDaysThisMonth,
    streakData, rewards, unlockedRewards,
    currentUser, setCurrentUser, refreshCurrentUser, clearUserData, loadUserData,
  }), [
    entries, glucoseEntries, exerciseEntries, mealEntries, medicationEntries, latestGlucose,
    addGlucoseEntry, addExerciseEntry, addMealEntry, addMedicationEntry,
    markCompleted, deleteEntry,
    getEntriesForDate, getGlucoseEntriesForDate,
    getDaysWithEntries, getDaysWithoutEntries,
    getWeeklyGlucoseData, getMonthlyGlucoseData,
    notifications, unreadCount, markNotificationRead, markAllRead, addNotification,
    thresholds, updateThresholds,
    tasks, completions, addTask, deleteTask, toggleTask, completeTask,
    getTasksForFrequency, isTaskCompletedToday, getStreakForTask, getCompletionDaysThisMonth,
    streakData, rewards, unlockedRewards,
    currentUser, setCurrentUser, refreshCurrentUser, clearUserData, loadUserData,
  ]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be inside <AppStoreProvider>');
  return ctx;
}

// ─── UTILIDADES EXPORTADAS ────────────────────────────────────────────────────

export function getGlucoseRange(mg: number) {
  if (mg < 70)   return { label: 'Hipoglucemia',        color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  darkBg: 'rgba(239,68,68,0.08)' };
  if (mg <= 99)  return { label: 'Normal',               color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  darkBg: 'rgba(34,197,94,0.08)' };
  if (mg <= 140) return { label: 'Normal posprandial',   color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  darkBg: 'rgba(34,197,94,0.08)' };
  if (mg <= 199) return { label: 'Prediabetes',           color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', darkBg: 'rgba(245,158,11,0.08)' };
  return           { label: 'Hiperglucemia',              color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  darkBg: 'rgba(239,68,68,0.08)' };
}

export function entryTypeColor(type: EntryType): string {
  return { glucose: '#86d0ef', exercise: '#a4f4b7', meal: '#f9c74f', medication: '#c4b5fd' }[type];
}

export function entryTypeLabel(type: EntryType): string {
  return { glucose: 'Glucosa', exercise: 'Ejercicio', meal: 'Comida', medication: 'Medicación' }[type];
}