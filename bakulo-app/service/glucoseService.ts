import { Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

const manager = Platform.OS !== 'web' ? new BleManager() : null;

export const GlucoseService = {
  isWeb: Platform.OS === 'web',

  // Escaneo Bluetooth (Para Accu-Chek, Betachek, etc.)
  async scanBluetooth(): Promise<string | null> {
    if (this.isWeb) return null;

    return new Promise((resolve, reject) => {
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          reject(error);
          return;
        }

        // Filtramos por nombres comunes de los dispositivos de tus fotos
        if (device.name?.includes('Accu-Chek') || device.name?.includes('Betachek')) {
          manager.stopDeviceScan();
          // Aquí vendría la lógica de conexión y lectura de características BLE
          // Por simplicidad, retornamos un valor simulado tras conectar
          resolve("112"); 
        }
      });

      // Timeout de búsqueda
      setTimeout(() => {
        manager.stopDeviceScan();
        reject("No se encontró dispositivo Bluetooth");
      }, 10000);
    });
  },

  // Escaneo NFC (Para FreeStyle Libre 1)
  async scanNFC(): Promise<string | null> {
    if (this.isWeb) return null;

    try {
      await NfcManager.requestTechnology(NfcTech.NfcV); // El Libre usa ISO 15693 (NfcV)
      const tag = await NfcManager.getTag();
      // Lógica de decodificación de bloques de memoria del sensor
      return "115"; 
    } catch (ex) {
      throw "Error al leer sensor NFC";
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }
};