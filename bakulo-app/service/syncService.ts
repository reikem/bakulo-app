/**
 * syncService.ts
 * Sincronización real:
 *   1. Datos locales SQLite → PostgreSQL (vía REST)
 *   2. Datos remotos → SQLite (pull)
 *   3. Estado de dispositivos BLE conectados
 */

import {
  db_getPendingSyncItems,
  db_clearSyncedItems,
  db_getGlucoseEntries,
  PostgresAdapter,
  MongoAdapter,
} from './database';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncResult {
  status: SyncStatus;
  lastSynced: string;
  devicesUpdated: number;
  recordsSynced: number;
  errors: string[];
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'cgm' | 'pump' | 'glucometer' | 'wearable';
  battery: number;    // 0-100
  signalStrength: number; // 0-4
  status: 'active' | 'standby' | 'disconnected';
  lastReading?: number;  // mg/dL
  lastReadingTime?: Date;
}

// ─── DISPOSITIVOS MOCK (reemplazar con BLE real) ──────────────────────────────
const MOCK_DEVICES: ConnectedDevice[] = [
  {
    id: 'dev_001',
    name: 'Guardian Connect CGM',
    type: 'cgm',
    battery: 82,
    signalStrength: 3,
    status: 'active',
    lastReading: 108,
    lastReadingTime: new Date(Date.now() - 120000),
  },
  {
    id: 'dev_002',
    name: 'Omnipod 5',
    type: 'pump',
    battery: 45,
    signalStrength: 4,
    status: 'standby',
  },
];

let lastSyncTime: Date | null = null;
let currentDevices: ConnectedDevice[] = [...MOCK_DEVICES];

export const SyncService = {
  /**
   * Sincronización completa:
   * 1. Push datos pendientes → PostgreSQL
   * 2. Pull datos remotos → local
   * 3. Actualizar estado de dispositivos
   */
  performSync: async (): Promise<SyncResult> => {
    const errors: string[] = [];
    let recordsSynced = 0;
    let devicesUpdated = 0;

    try {
      // ── 1. Push pendientes a PostgreSQL ──
      const pushResult = await PostgresAdapter.syncPendingItems();
      if (pushResult.success) {
        recordsSynced = pushResult.synced;
      } else {
        errors.push('No se pudo conectar al servidor PostgreSQL');
      }

      // ── 2. Simular actualización de dispositivos ──
      currentDevices = currentDevices.map(d => ({
        ...d,
        lastReadingTime: d.status === 'active' ? new Date() : d.lastReadingTime,
        lastReading: d.status === 'active'
          ? Math.round(90 + Math.random() * 60) // 90-150 mg/dL simulado
          : d.lastReading,
      }));
      devicesUpdated = currentDevices.filter(d => d.status === 'active').length;

      // ── 3. Subir documentos pendientes a MongoDB ──
      // (los documentos grandes van a MongoDB)
      // En producción: verificar documentos no sincronizados y subirlos

      lastSyncTime = new Date();

      return {
        status: errors.length === 0 ? 'success' : 'error',
        lastSynced: lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        devicesUpdated,
        recordsSynced,
        errors,
      };
    } catch (e: any) {
      return {
        status: 'error',
        lastSynced: lastSyncTime?.toLocaleTimeString() ?? 'Nunca',
        devicesUpdated: 0,
        recordsSynced: 0,
        errors: [e?.message ?? 'Error desconocido'],
      };
    }
  },

  getLastSyncTime: (): string => {
    if (!lastSyncTime) return 'Nunca';
    const diff = (Date.now() - lastSyncTime.getTime()) / 1000;
    if (diff < 60)   return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff/60)} min`;
    return lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  getConnectedDevices: (): ConnectedDevice[] => [...currentDevices],

  getDeviceById: (id: string): ConnectedDevice | undefined =>
    currentDevices.find(d => d.id === id),

  addDevice: (device: ConnectedDevice) => {
    currentDevices = [...currentDevices.filter(d => d.id !== device.id), device];
  },

  removeDevice: (id: string) => {
    currentDevices = currentDevices.filter(d => d.id !== id);
  },

  /**
   * Simula el pareado BLE de un nuevo dispositivo
   */
  pairNewDevice: async (name: string, type: ConnectedDevice['type']): Promise<ConnectedDevice | null> => {
    await new Promise(r => setTimeout(r, 2000)); // Simula tiempo de pareado
    const newDevice: ConnectedDevice = {
      id: `dev_${Date.now()}`,
      name,
      type,
      battery: Math.round(70 + Math.random() * 30),
      signalStrength: 3,
      status: 'active',
    };
    currentDevices = [...currentDevices, newDevice];
    return newDevice;
  },
};
