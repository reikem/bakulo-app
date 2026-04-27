/**
 * GlucoseStore.tsx — Bridge adapter
 *
 * ✅ NO hay lógica duplicada — todo viene de AppStore
 * ✅ Mantiene 100% la API pública de GlucoseStore original:
 *      useGlucose()  →  sigue funcionando en DashboardScreen y demás
 *      GlucoseProvider → sigue funcionando en _layout.tsx
 *      getGlucoseRange() → re-exportado desde AppStore
 *
 * Las pantallas que usan useGlucose() NO necesitan cambios.
 *
 * FLUJO:
 *   useGlucose()
 *     → lee de AppStore (glucoseEntries, addGlucoseEntry, etc.)
 *     → expone la misma interfaz que antes
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAppStore } from '@/store/AppStore';
export { getGlucoseRange } from '@/store/AppStore';

// ─── TIPO PÚBLICO (igual que antes) ──────────────────────────────────────────

export interface GlucoseEntry {
  id: string;
  value: number;
  timestamp: Date;
  source: 'ble' | 'nfc' | 'manual';
  deviceName?: string;
  note?: string;
}

interface GlucoseContextValue {
  entries: GlucoseEntry[];
  latestEntry: GlucoseEntry | null;
  addEntry: (entry: Omit<GlucoseEntry, 'id'>) => GlucoseEntry;
  getEntriesForDate:     (date: Date) => GlucoseEntry[];
  getDaysWithEntries:    (year: number, month: number) => Set<number>;
  getDaysWithoutEntries: (year: number, month: number) => Set<number>;
  getWeeklyData:  () => { label: string; value: number; h: number }[];
  getMonthlyData: () => { label: string; value: number; h: number }[];
}

// ─── CONTEXT (solo para satisfacer el patrón Provider/consumer) ───────────────

const GlucoseContext = createContext<GlucoseContextValue | null>(null);

// ─── PROVIDER ────────────────────────────────────────────────────────────────
// No gestiona estado propio — delega todo a AppStore.
// Úsalo en _layout.tsx igual que antes: <GlucoseProvider>

export function GlucoseProvider({ children }: { children: React.ReactNode }) {
  // Lee todo desde AppStore — GlucoseProvider solo actúa de puente
  const store = useAppStore();

  const addEntry = (data: Omit<GlucoseEntry, 'id'>): GlucoseEntry => {
    // Mapea al formato de AppStore y lo agrega
    store.addGlucoseEntry({
      value:      data.value,
      timestamp:  data.timestamp,
      source:     data.source,
      deviceName: data.deviceName,
      note:       data.note,
    });
    // Retorna la entrada con id generado
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return { ...data, id };
  };

  const value = useMemo<GlucoseContextValue>(() => ({
    // Mapea GlucoseEntry[] de AppStore al tipo público de GlucoseStore
    entries: store.glucoseEntries.map(e => ({
      id:         e.id,
      value:      e.value,
      timestamp:  e.timestamp,
      source:     e.source,
      deviceName: e.deviceName,
      note:       e.note,
    })),

    latestEntry: store.latestGlucose
      ? {
          id:         store.latestGlucose.id,
          value:      store.latestGlucose.value,
          timestamp:  store.latestGlucose.timestamp,
          source:     store.latestGlucose.source,
          deviceName: store.latestGlucose.deviceName,
          note:       store.latestGlucose.note,
        }
      : null,

    addEntry,

    // Helpers — delegan directamente a AppStore
    getEntriesForDate: (date: Date) =>
      store.getGlucoseEntriesForDate(date).map(e => ({
        id: e.id, value: e.value, timestamp: e.timestamp,
        source: e.source, deviceName: e.deviceName, note: e.note,
      })),

    getDaysWithEntries:    store.getDaysWithEntries,
    getDaysWithoutEntries: store.getDaysWithoutEntries,
    getWeeklyData:         store.getWeeklyGlucoseData,
    getMonthlyData:        store.getMonthlyGlucoseData,
  }), [store]);

  return (
    <GlucoseContext.Provider value={value}>
      {children}
    </GlucoseContext.Provider>
  );
}

// ─── HOOK PÚBLICO ─────────────────────────────────────────────────────────────

export function useGlucose() {
  const ctx = useContext(GlucoseContext);
  if (!ctx) throw new Error('useGlucose must be used inside <GlucoseProvider>');
  return ctx;
}
