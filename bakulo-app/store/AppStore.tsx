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
  useCallback, useMemo, useRef,
} from 'react';
import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

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
        : { seconds: delaySeconds } as any,
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

const INITIAL_ENTRIES: AnyEntry[] = [
  { id: 'g1', type: 'glucose', value: 108, timestamp: makeDate(0, 8, 30),  source: 'ble',    deviceName: 'Accu-Chek Instant', completed: true },
  { id: 'g2', type: 'glucose', value: 95,  timestamp: makeDate(0, 13, 0),  source: 'manual', completed: true },
  { id: 'g3', type: 'glucose', value: 122, timestamp: makeDate(1, 7, 45),  source: 'ble',    deviceName: 'Accu-Chek Instant', completed: true },
  { id: 'g4', type: 'glucose', value: 135, timestamp: makeDate(2, 8, 0),   source: 'nfc',    deviceName: 'FreeStyle Libre 1', completed: true },
  { id: 'g5', type: 'glucose', value: 88,  timestamp: makeDate(3, 9, 30),  source: 'manual', completed: true },
  { id: 'g6', type: 'glucose', value: 162, timestamp: makeDate(4, 7, 0),   source: 'manual', completed: true },
  { id: 'g7', type: 'glucose', value: 118, timestamp: makeDate(5, 8, 15),  source: 'ble',    completed: true },
  { id: 'e1', type: 'exercise', activity: 'Running',    durationMinutes: 30, timestamp: makeDate(0, 7, 0),  completed: true },
  { id: 'e2', type: 'exercise', activity: 'Gym',        durationMinutes: 45, timestamp: makeDate(2, 18, 0), completed: true },
  { id: 'm1', type: 'meal',     name: 'Bowl de Avena',  category: 'Desayuno', calories: 320, carbs: 45, protein: 12, fat: 8,  timestamp: makeDate(0, 8, 0),  completed: true },
  { id: 'm2', type: 'meal',     name: 'Ensalada Verde', category: 'Almuerzo', calories: 210, carbs: 18, protein: 15, fat: 6,  timestamp: makeDate(1, 12, 30), completed: true },
  { id: 'med1', type: 'medication', medName: 'Metformina', medType: 'pastillas', dosage: '500mg', timestamp: makeDate(0, 8, 0),  completed: true },
  { id: 'med2', type: 'medication', medName: 'Insulina',   medType: 'inyectables', dosage: '10U', zone: 'abdomen', timestamp: makeDate(1, 7, 30), completed: true },
];

const INITIAL_NOTIFICATIONS: NotificationEntry[] = [
  { id: 'n1', title: 'Glucosa Elevada', body: 'Tu nivel fue de 162 mg/dL. Por encima del umbral de 140.', type: 'alert_high', timestamp: makeDate(4, 7, 1),  read: true },
  { id: 'n2', title: 'Registro Guardado', body: 'Glucosa 108 mg/dL registrada correctamente.', type: 'success', timestamp: makeDate(0, 8, 31), read: false },
  { id: 'n3', title: 'Recordatorio de Comida', body: 'Recuerda registrar tu almuerzo.', type: 'reminder', timestamp: makeDate(0, 12, 0), read: false },
];

// ─── CONTEXT VALUE TYPE ───────────────────────────────────────────────────────

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

  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

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

  // ── ADD GLUCOSE ───────────────────────────────────────────────────────────
  const addGlucoseEntry = useCallback(async (data: Omit<GlucoseEntry, 'id'|'type'|'completed'>) => {
    const entry: GlucoseEntry = { ...data, id: uid(), type: 'glucose', completed: true };
    setEntries(prev => [entry, ...prev]);
    await checkGlucoseAlerts(data.value, entry.id);
  }, [checkGlucoseAlerts]);

  // ── ADD EXERCISE ──────────────────────────────────────────────────────────
  const addExerciseEntry = useCallback((data: Omit<ExerciseEntry, 'id'|'type'|'completed'>) => {
    const entry: ExerciseEntry = { ...data, id: uid(), type: 'exercise', completed: true };
    setEntries(prev => [entry, ...prev]);
    addNotification({
      title: '🏃 Ejercicio Registrado',
      body: `${data.activity} · ${data.durationMinutes} min`,
      type: 'success', relatedEntryId: entry.id,
    });
  }, [addNotification]);

  // ── ADD MEAL ──────────────────────────────────────────────────────────────
  const addMealEntry = useCallback((data: Omit<MealEntry, 'id'|'type'|'completed'>) => {
    const entry: MealEntry = { ...data, id: uid(), type: 'meal', completed: true };
    setEntries(prev => [entry, ...prev]);
    addNotification({
      title: '🍽️ Comida Registrada',
      body: `${data.name} · ${data.calories} kcal`,
      type: 'success', relatedEntryId: entry.id,
    });
  }, [addNotification]);

  // ── ADD MEDICATION ────────────────────────────────────────────────────────
  const addMedicationEntry = useCallback((data: Omit<MedicationEntry, 'id'|'type'|'completed'>) => {
    const entry: MedicationEntry = { ...data, id: uid(), type: 'medication', completed: true };
    setEntries(prev => [entry, ...prev]);
    addNotification({
      title: '💊 Medicación Registrada',
      body: `${data.medName} · ${data.dosage}`,
      type: 'success', relatedEntryId: entry.id,
    });
  }, [addNotification]);

  // ── MARK COMPLETED ────────────────────────────────────────────────────────
  const markCompleted = useCallback((id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  }, []);

  // ── DELETE ENTRY ──────────────────────────────────────────────────────────
  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
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

  const value = useMemo<AppStoreValue>(() => ({
    entries, glucoseEntries, exerciseEntries, mealEntries, medicationEntries, latestGlucose,
    addGlucoseEntry, addExerciseEntry, addMealEntry, addMedicationEntry,
    markCompleted, deleteEntry,
    getEntriesForDate, getGlucoseEntriesForDate,
    getDaysWithEntries, getDaysWithoutEntries,
    getWeeklyGlucoseData, getMonthlyGlucoseData,
    notifications, unreadCount, markNotificationRead, markAllRead, addNotification,
    thresholds, updateThresholds,
  }), [
    entries, glucoseEntries, exerciseEntries, mealEntries, medicationEntries, latestGlucose,
    addGlucoseEntry, addExerciseEntry, addMealEntry, addMedicationEntry,
    markCompleted, deleteEntry,
    getEntriesForDate, getGlucoseEntriesForDate,
    getDaysWithEntries, getDaysWithoutEntries,
    getWeeklyGlucoseData, getMonthlyGlucoseData,
    notifications, unreadCount, markNotificationRead, markAllRead, addNotification,
    thresholds, updateThresholds,
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
