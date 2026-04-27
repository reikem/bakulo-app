import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import NfcManager from 'react-native-nfc-manager';

const bleManager = Platform.OS !== 'web' ? new BleManager() : null;

export const GlucoseService = {
  isWeb: Platform.OS === 'web',

  async requestPermissions(): Promise<boolean> {
    if (this.isWeb) return true;

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(granted).every(status => status === 'granted');
    }
    return true; // En iOS se gestiona vía Info.plist automáticamente
  },

  async scanBluetooth(onValueReceived: (val: string) => void, onError: (err: string) => void) {
    if (!bleManager) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return onError("Permisos denegados");

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        onError(error.message);
        return;
      }
      // Filtro para dispositivos conocidos (ej: Accu-Chek, Betachek)
      if (device?.name?.toLowerCase().includes('glucose') || device?.name?.includes('C50')) {
        bleManager.stopDeviceScan();
        onValueReceived("108"); // Valor simulado tras conexión
      }
    });

    // Auto-stop tras 10 segundos
    setTimeout(() => bleManager.stopDeviceScan(), 10000);
  },

  async scanNFC(): Promise<string> {
    if (this.isWeb) throw "No disponible en Web";
    await NfcManager.start();
    // Lógica simplificada de escaneo
    return "112"; 
  }
};