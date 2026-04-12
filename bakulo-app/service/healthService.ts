import { Alert } from 'react-native';

export type HealthProvider = 'apple' | 'google' | 'huawei';

export interface HealthConnection {
  id: HealthProvider;
  name: string;
  connected: boolean;
  lastSync?: string;
}

// Simulación de persistencia (Base de Datos Temporal)
let mockDatabase: HealthConnection[] = [
  { id: 'apple', name: 'Apple Health', connected: true, lastSync: '2026-04-11' },
  { id: 'google', name: 'Health Connect', connected: false },
  { id: 'huawei', name: 'HUAWEI Health', connected: false },
];

export const healthService = {
  // Obtener todas las conexiones
  getConnections: async (): Promise<HealthConnection[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockDatabase]), 500); // Simula latencia de red
    });
  },

  // Lógica de conexión/desconexión
  toggleConnection: async (id: HealthProvider): Promise<boolean> => {
    try {
      // AQUÍ: Integrarías los SDKs nativos (HealthKit / Google Fit)
      // Ejemplo: if (id === 'apple') await AppleHealthKit.init(...)

      mockDatabase = mockDatabase.map(conn => 
        conn.id === id 
          ? { ...conn, connected: !conn.connected, lastSync: new Date().toISOString() } 
          : conn
      );
      
      return true;
    } catch (error) {
      console.error("Error en healthService:", error);
      return false;
    }
  }
};