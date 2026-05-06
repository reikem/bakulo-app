/**
 * service/syncService.ts — v4
 *
 * FIX:
 *   ✅ Exporta syncPendingToSupabase() — nombre que usa SyncScreen
 *   ✅ Exporta pullFromSupabase(), startAutoSync(), stopAutoSync()
 *   ✅ upsertDocument agregado al supabaseClient esperado
 */

import {
  supabase,
  upsertGlucoseEntry,
  upsertExerciseEntry,
  upsertMealEntry,
  upsertMedicationEntry,
  getSupabaseUserId,
} from './supabaseClient';
import { db_getPendingSyncItems, db_clearSyncedItems } from './database';
import { Platform } from 'react-native';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncResult {
  success:        boolean;
  status:         SyncStatus;
  lastSynced:     string;
  uploaded:       number;
  errors:         number;
  message:        string;
  devicesUpdated: number;
  recordsSynced:  number;
}

export interface ConnectedDevice {
  id:              string;
  name:            string;
  type:            'cgm' | 'pump' | 'glucometer' | 'wearable';
  battery:         number;
  signalStrength:  number;
  status:          'active' | 'standby' | 'disconnected';
  lastReading?:    number;
  lastReadingTime?: Date;
}

// ─── HELPER RED ───────────────────────────────────────────────────────────────

async function isOnline(): Promise<boolean> {
  if (Platform.OS === 'web') return typeof navigator !== 'undefined' ? navigator.onLine : false;
  try {
    const N = require('@react-native-community/netinfo').default;
    const s = await N.fetch();
    return s.isConnected === true && s.isInternetReachable !== false;
  } catch { return true; }
}

// ─── UPSERT DOCUMENT (helper local para no depender de supabaseClient export) ─

async function _upsertDocument(userId: string, doc: {
  id: string; name: string; type: string; uri: string;
  sizeBytes: number; tags?: string; description?: string; uploadedAt: Date;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('repository_documents').upsert({
      id:          doc.id,
      user_id:     userId,
      name:        doc.name,
      type:        doc.type,
      uri:         doc.uri,
      size_bytes:  doc.sizeBytes,
      tags:        doc.tags ?? null,
      description: doc.description ?? null,
      uploaded_at: doc.uploadedAt.toISOString(),
    }, { onConflict: 'id' });
    if (error) { console.warn('[Sync] upsertDocument:', error.message); return false; }
    return true;
  } catch { return false; }
}

// ─── CLASE SINGLETON ──────────────────────────────────────────────────────────

class SyncServiceClass {
  private devices: ConnectedDevice[] = [
    { id: 'dev_001', name: 'Guardian Connect CGM', type: 'cgm',  battery: 82, signalStrength: 3, status: 'active',  lastReading: 108, lastReadingTime: new Date(Date.now() - 120000) },
    { id: 'dev_002', name: 'Omnipod 5',             type: 'pump', battery: 45, signalStrength: 4, status: 'standby' },
  ];
  private lastSync:  Date | null = null;
  private autoTimer: ReturnType<typeof setInterval> | null = null;
  private _syncing = false;

  getConnectedDevices() { return [...this.devices]; }
  getDeviceById(id: string) { return this.devices.find(d => d.id === id); }
  addDevice(d: ConnectedDevice) { this.devices = [...this.devices.filter(x => x.id !== d.id), d]; }
  removeDevice(id: string) { this.devices = this.devices.filter(d => d.id !== id); }

  getLastSyncTime(): string {
    if (!this.lastSync) return 'Nunca';
    const diff = (Date.now() - this.lastSync.getTime()) / 1000;
    if (diff < 60)   return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    return this.lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async pairNewDevice(name: string, type: ConnectedDevice['type']): Promise<ConnectedDevice | null> {
    await new Promise(r => setTimeout(r, 2000));
    const d: ConnectedDevice = {
      id: `dev_${Date.now()}`, name, type,
      battery: Math.round(70 + Math.random() * 30),
      signalStrength: 3, status: 'active',
    };
    this.devices = [...this.devices, d];
    return d;
  }

  // ── Sync principal ────────────────────────────────────────────────────────
  async performSync(): Promise<SyncResult> {
    if (this._syncing) {
      return { success: false, status: 'syncing', lastSynced: this.getLastSyncTime(), uploaded: 0, errors: 0, message: 'En curso...', devicesUpdated: 0, recordsSynced: 0 };
    }
    this._syncing = true;
    const r = await this._doSync();
    this._syncing = false;
    return r;
  }

  private async _doSync(): Promise<SyncResult> {
    const online = await isOnline();
    if (!online) return { success: false, status: 'offline', lastSynced: this.getLastSyncTime(), uploaded: 0, errors: 0, message: 'Sin conexión. Datos guardados localmente.', devicesUpdated: 0, recordsSynced: 0 };

    const userId = await getSupabaseUserId();
    if (!userId) return { success: false, status: 'error', lastSynced: this.getLastSyncTime(), uploaded: 0, errors: 0, message: 'Inicia sesión para sincronizar.', devicesUpdated: 0, recordsSynced: 0 };

    const { uploaded, errors } = await this._pushPending(userId);

    this.devices = this.devices.map(d => ({
      ...d,
      lastReadingTime: d.status === 'active' ? new Date() : d.lastReadingTime,
      lastReading:     d.status === 'active' ? Math.round(90 + Math.random() * 60) : d.lastReading,
    }));
    const devicesUpdated = this.devices.filter(d => d.status === 'active').length;

    this.lastSync = new Date();
    const success = errors === 0;
    return {
      success,
      status:         success ? 'success' : 'error',
      lastSynced:     this.lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      uploaded,
      errors,
      message:        success ? `✅ ${uploaded} registro(s) sincronizados` : `⚠️ ${uploaded} subidos, ${errors} con error`,
      devicesUpdated,
      recordsSynced:  uploaded,
    };
  }

  private async _pushPending(userId: string): Promise<{ uploaded: number; errors: number }> {
    let uploaded = 0, errors = 0;
    let pending: any[] = [];
    try { pending = db_getPendingSyncItems(); } catch { return { uploaded: 0, errors: 0 }; }

    const done: number[] = [];
    for (const item of pending) {
      try {
        let p: any = {};
        try { p = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload; } catch { continue; }
        let ok = false;
        switch (item.table_name) {
          case 'glucose_entries':
            ok = await upsertGlucoseEntry({ id: p.id, userId, value: p.value, source: p.source ?? 'manual', deviceName: p.deviceName ?? p.device_name, note: p.note, timestamp: new Date(p.timestamp) });
            break;
          case 'exercise_entries':
            ok = await upsertExerciseEntry({ id: p.id, userId, activity: p.activity, durationMinutes: p.durationMinutes ?? p.duration_minutes ?? 0, note: p.note, timestamp: new Date(p.timestamp) });
            break;
          case 'meal_entries':
            ok = await upsertMealEntry({ id: p.id, userId, name: p.name, category: p.category ?? 'Almuerzo', calories: p.calories ?? 0, carbs: p.carbs ?? 0, protein: p.protein ?? 0, fat: p.fat ?? 0, imageUri: p.imageUri ?? p.image_uri, timestamp: new Date(p.timestamp) });
            break;
          case 'medication_entries':
            ok = await upsertMedicationEntry({ id: p.id, userId, medName: p.medName ?? p.med_name, medType: p.medType ?? p.med_type ?? 'pastillas', dosage: p.dosage, zone: p.zone, timestamp: new Date(p.timestamp) });
            break;
          case 'repository_documents':
            ok = await _upsertDocument(userId, { id: p.id, name: p.name, type: p.type ?? 'other', uri: p.uri, sizeBytes: p.sizeBytes ?? p.size_bytes ?? 0, tags: p.tags, description: p.description, uploadedAt: new Date(p.uploadedAt ?? p.uploaded_at ?? Date.now()) });
            break;
          default:
            done.push(item.id); continue;
        }
        if (ok) { done.push(item.id); uploaded++; } else errors++;
      } catch (e) { console.warn(`[Sync] item ${item.id}:`, e); errors++; }
    }
    try { db_clearSyncedItems(done); } catch {}
    return { uploaded, errors };
  }

  // ── Pull desde Supabase ───────────────────────────────────────────────────
  async pullFromSupabase() {
    const empty = { glucose: [], exercise: [], meals: [], medication: [], documents: [] };
    const online = await isOnline(); if (!online) return empty;
    const userId = await getSupabaseUserId(); if (!userId) return empty;
    try {
      const [g, e, m, med, d] = await Promise.all([
        supabase.from('glucose_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(500),
        supabase.from('exercise_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(200),
        supabase.from('meal_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(200),
        supabase.from('medication_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(200),
        supabase.from('repository_documents').select('id,name,type,uri,size_bytes,tags,description,uploaded_at').eq('user_id', userId).order('uploaded_at', { ascending: false }).limit(100),
      ]);
      return { glucose: g.data ?? [], exercise: e.data ?? [], meals: m.data ?? [], medication: med.data ?? [], documents: d.data ?? [] };
    } catch (e) { console.warn('[Sync] pull error:', e); return empty; }
  }

  async saveSosAlert(alert: { alertType: string; glucoseVal?: number; latitude?: number; longitude?: number; mapsUrl?: string; contactName?: string; messageBody?: string }): Promise<boolean> {
    const online = await isOnline(); if (!online) return false;
    const userId = await getSupabaseUserId(); if (!userId) return false;
    try {
      const { error } = await supabase.from('emergency_alerts').insert({ user_id: userId, alert_type: alert.alertType, glucose_val: alert.glucoseVal ?? null, latitude: alert.latitude ?? null, longitude: alert.longitude ?? null, maps_url: alert.mapsUrl ?? null, contact_name: alert.contactName ?? null, message_body: alert.messageBody ?? null });
      return !error;
    } catch { return false; }
  }

  async getGlucoseStats() {
    const userId = await getSupabaseUserId(); if (!userId) return null;
    try {
      const { data, error } = await supabase.from('glucose_stats').select('*').eq('user_id', userId).single();
      if (error || !data) return null;
      return { totalReadings: data.total_readings ?? 0, avgGlucose: data.avg_glucose ?? 0, minGlucose: data.min_glucose ?? 0, maxGlucose: data.max_glucose ?? 0, hypoCount: data.hypo_count ?? 0, hyperCount: data.hyper_count ?? 0, timeInRangePct: data.time_in_range_pct ?? 0, lastReadingAt: data.last_reading_at ?? null };
    } catch { return null; }
  }

  startAutoSync(intervalMinutes = 5) {
    if (this.autoTimer) return;
    this.performSync().catch(() => {});
    this.autoTimer = setInterval(() => this.performSync().catch(() => {}), intervalMinutes * 60_000);
  }

  stopAutoSync() {
    if (this.autoTimer) { clearInterval(this.autoTimer); this.autoTimer = null; }
  }
}

export const SyncService = new SyncServiceClass();

// ─── EXPORTS NOMBRADOS ────────────────────────────────────────────────────────
// SyncScreen importa: syncPendingToSupabase, pullFromSupabase
// _layout.tsx importa: startAutoSync, stopAutoSync

/** Sube datos pendientes de SQLite a Supabase */
export async function syncPendingToSupabase(): Promise<SyncResult> {
  return SyncService.performSync();
}

/** Descarga datos del usuario desde Supabase */
export function pullFromSupabase() {
  return SyncService.pullFromSupabase();
}

export function startAutoSync(intervalMinutes = 5): void {
  SyncService.startAutoSync(intervalMinutes);
}

export function stopAutoSync(): void {
  SyncService.stopAutoSync();
}