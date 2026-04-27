/**
 * healthService.ts
 * Integración real con:
 *   - Apple HealthKit (iOS)      → react-native-health
 *   - Google Health Connect (Android) → react-native-health-connect
 *   - Huawei Health (Android)    → @huaweicloud/react-native-hms-health (simulado)
 *
 * Instalación:
 *   npx expo install react-native-health          # iOS
 *   npx expo install react-native-health-connect  # Android
 *
 * app.json (iOS):
 *   "infoPlist": {
 *     "NSHealthShareUsageDescription": "Leer datos de salud",
 *     "NSHealthUpdateUsageDescription": "Escribir datos de salud"
 *   }
 */

import { Platform, Alert } from 'react-native';

export type HealthProvider = 'apple' | 'google' | 'huawei';

export interface HealthConnection {
  id: HealthProvider;
  name: string;
  connected: boolean;
  lastSync?: string;
  logoColor: string;
  available: boolean;   // ¿Disponible en este dispositivo/OS?
  glucoseData?: GlucoseReading[];
}

export interface GlucoseReading {
  value: number;       // mg/dL
  timestamp: Date;
  source: string;
}

// ─── LAZY IMPORTS (no rompen si el módulo no está instalado) ──────────────────
let AppleHealthKit: any = null;
let GoogleHealthConnect: any = null;

try {
  AppleHealthKit = require('react-native-health').default;
} catch { /* módulo no instalado */ }

try {
  GoogleHealthConnect = require('react-native-health-connect');
} catch { /* módulo no instalado */ }

// ─── ESTADO EN MEMORIA ────────────────────────────────────────────────────────
let connections: HealthConnection[] = [
  {
    id: 'apple',
    name: 'Apple Health',
    connected: false,
    logoColor: '#ff2d55',
    available: Platform.OS === 'ios',
  },
  {
    id: 'google',
    name: 'Health Connect',
    connected: false,
    logoColor: '#4285f4',
    available: Platform.OS === 'android',
  },
  {
    id: 'huawei',
    name: 'HUAWEI Health',
    connected: false,
    logoColor: '#cf0a2c',
    available: Platform.OS === 'android',
  },
];

// ─── APPLE HEALTHKIT ─────────────────────────────────────────────────────────
const initAppleHealth = (): Promise<boolean> =>
  new Promise(resolve => {
    if (!AppleHealthKit) { resolve(false); return; }
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.BloodGlucose,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.StepCount,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        ],
        write: [AppleHealthKit.Constants.Permissions.BloodGlucose],
      },
    };
    AppleHealthKit.initHealthKit(permissions, (err: any) => resolve(!err));
  });

const fetchAppleGlucose = (): Promise<GlucoseReading[]> =>
  new Promise(resolve => {
    if (!AppleHealthKit) { resolve([]); return; }
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      limit: 50,
    };
    AppleHealthKit.getBloodGlucoseSamples(options, (err: any, results: any[]) => {
      if (err || !results) { resolve([]); return; }
      resolve(results.map(r => ({
        value: Math.round(r.value * 18.0182), // mmol/L → mg/dL
        timestamp: new Date(r.startDate),
        source: 'Apple Health',
      })));
    });
  });

// ─── GOOGLE HEALTH CONNECT ───────────────────────────────────────────────────
const initGoogleHealth = async (): Promise<boolean> => {
  if (!GoogleHealthConnect) return false;
  try {
    const { initialize, requestPermission, PermissionType } = GoogleHealthConnect;
    const available = await initialize();
    if (!available) return false;
    const granted = await requestPermission([
      { accessType: 'read',  recordType: 'BloodGlucose' },
      { accessType: 'write', recordType: 'BloodGlucose' },
      { accessType: 'read',  recordType: 'Steps'        },
      { accessType: 'read',  recordType: 'ActiveCaloriesBurned' },
    ]);
    return granted.length > 0;
  } catch { return false; }
};

const fetchGoogleGlucose = async (): Promise<GlucoseReading[]> => {
  if (!GoogleHealthConnect) return [];
  try {
    const { readRecords } = GoogleHealthConnect;
    const results = await readRecords('BloodGlucose', {
      timeRangeFilter: {
        operator: 'between',
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
      },
    });
    return (results.records ?? []).map((r: any) => ({
      value: Math.round(r.level.inMillimolesPerLiter * 18.0182),
      timestamp: new Date(r.time),
      source: 'Google Health Connect',
    }));
  } catch { return []; }
};

// ─── HUAWEI HEALTH (Simulado — SDK propietario) ───────────────────────────────
const initHuaweiHealth = async (): Promise<boolean> => {
  // El SDK real requiere cuenta Huawei Developer + build nativo
  // Aquí mostramos el flujo de autorización y devolvemos mock data
  Alert.alert(
    'HUAWEI Health',
    'Abre la app HUAWEI Health en tu dispositivo y concede permisos a Serenity.',
    [{ text: 'Entendido' }]
  );
  // Simular autorización exitosa después de alerta
  return true;
};

const fetchHuaweiGlucose = async (): Promise<GlucoseReading[]> => {
  // Mock data mientras no hay SDK real
  return [
    { value: 112, timestamp: new Date(Date.now() - 3600000), source: 'HUAWEI Health' },
    { value: 98,  timestamp: new Date(Date.now() - 7200000), source: 'HUAWEI Health' },
  ];
};

// ─── SERVICIO PÚBLICO ─────────────────────────────────────────────────────────
export const healthService = {
  getConnections: async (): Promise<HealthConnection[]> => {
    return [...connections];
  },

  toggleConnection: async (id: HealthProvider): Promise<boolean> => {
    const conn = connections.find(c => c.id === id);
    if (!conn) return false;

    if (conn.connected) {
      // Desconectar
      connections = connections.map(c =>
        c.id === id ? { ...c, connected: false, glucoseData: undefined } : c
      );
      return true;
    }

    // Conectar
    let success = false;
    let glucoseData: GlucoseReading[] = [];

    if (id === 'apple') {
      success = await initAppleHealth();
      if (success) glucoseData = await fetchAppleGlucose();
    } else if (id === 'google') {
      success = await initGoogleHealth();
      if (success) glucoseData = await fetchGoogleGlucose();
    } else if (id === 'huawei') {
      success = await initHuaweiHealth();
      if (success) glucoseData = await fetchHuaweiGlucose();
    }

    if (success) {
      connections = connections.map(c =>
        c.id === id
          ? { ...c, connected: true, lastSync: new Date().toISOString(), glucoseData }
          : c
      );
    }
    return success;
  },

  fetchLatestGlucose: async (id: HealthProvider): Promise<GlucoseReading[]> => {
    if (id === 'apple')   return fetchAppleGlucose();
    if (id === 'google')  return fetchGoogleGlucose();
    if (id === 'huawei')  return fetchHuaweiGlucose();
    return [];
  },

  /**
   * Escribe un registro de glucosa en el proveedor conectado
   */
  writeGlucose: async (value: number, timestamp: Date): Promise<boolean> => {
    const connected = connections.filter(c => c.connected);
    let ok = false;

    for (const conn of connected) {
      if (conn.id === 'apple' && AppleHealthKit) {
        const sample = {
          value: value / 18.0182, // mg/dL → mmol/L
          startDate: timestamp.toISOString(),
          endDate: timestamp.toISOString(),
          metadata: {},
        };
        await new Promise<void>(res =>
          AppleHealthKit.saveBloodGlucoseSample(sample, () => res())
        );
        ok = true;
      }
      if (conn.id === 'google' && GoogleHealthConnect) {
        try {
          await GoogleHealthConnect.insertRecords([{
            recordType: 'BloodGlucose',
            level: { unit: 'millimolesPerLiter', value: value / 18.0182 },
            time: timestamp.toISOString(),
          }]);
          ok = true;
        } catch { /* continuar */ }
      }
    }
    return ok;
  },
};
