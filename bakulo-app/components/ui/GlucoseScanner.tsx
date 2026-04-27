/**
 * GlucoseScanner.tsx  — v2
 *
 * Componente de escaneo con soporte real de:
 *   • BLE  → BETACHEK C50, Enlite, Dcont NEMERE, MÉRYkék QKY, Accu-Chek Instant, Amazfit Bip
 *   • NFC  → Abbott FreeStyle Libre 1 (ISO 15693 / NfcV)
 *
 * Detecta automáticamente si el dispositivo tiene NFC y lo muestra en la UI.
 *
 * Dependencias:
 *   npx expo install react-native-ble-plx react-native-nfc-manager expo-location
 *
 * app.json:
 *   "plugins": [
 *     ["react-native-ble-plx", { "isBackgroundEnabled": false, "modes": ["central"],
 *       "bluetoothAlwaysPermission": "Conectar glucómetros Bluetooth" }],
 *     ["react-native-nfc-manager"]
 *   ]
 *   "ios": { "infoPlist": { "NFCReaderUsageDescription": "Leer sensor FreeStyle Libre" } }
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  BleManager,
  Device,
  State as BleState,
  BleError,
} from 'react-native-ble-plx';
import {
  Radio,
  Bluetooth,
  Wifi,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react-native';
import { useNfcGlucose } from '@/hooks/useNFCGlucose';


// ─── BLE UUIDs (Bluetooth SIG) ────────────────────────────────────────────────
const GLUCOSE_SERVICE_UUID   = '00001808-0000-1000-8000-00805f9b34fb';
const GLUCOSE_MEASURE_UUID   = '00002a18-0000-1000-8000-00805f9b34fb';
const RACP_UUID              = '00002a52-0000-1000-8000-00805f9b34fb';
const AMAZFIT_HEALTH_SERVICE = '0000fee0-0000-1000-8000-00805f9b34fb';

// ─── PERFIL DE DISPOSITIVOS CONOCIDOS ────────────────────────────────────────
interface DeviceProfile {
  namePattern: RegExp;
  label: string;
  connectionType: 'ble' | 'nfc';
  serviceUUIDs: string[];
}

const KNOWN_DEVICES: DeviceProfile[] = [
  { namePattern: /betachek|c50/i,          label: 'BETACHEK® C50',    connectionType: 'ble', serviceUUIDs: [GLUCOSE_SERVICE_UUID] },
  { namePattern: /enlite/i,                 label: 'Sensor Enlite™',   connectionType: 'ble', serviceUUIDs: [GLUCOSE_SERVICE_UUID] },
  { namePattern: /dcont|nemere/i,           label: 'Dcont® NEMERE',    connectionType: 'ble', serviceUUIDs: [GLUCOSE_SERVICE_UUID] },
  { namePattern: /m[eé]ry|merykek|qky/i,   label: 'MÉRYkék QKY',     connectionType: 'ble', serviceUUIDs: [GLUCOSE_SERVICE_UUID] },
  { namePattern: /accu.?chek/i,            label: 'Accu-Chek Instant', connectionType: 'ble', serviceUUIDs: [GLUCOSE_SERVICE_UUID, RACP_UUID] },
  { namePattern: /amazfit|bip/i,           label: 'Amazfit Bip',       connectionType: 'ble', serviceUUIDs: [AMAZFIT_HEALTH_SERVICE] },
  { namePattern: /freestyle|libre|abbott/i,label: 'FreeStyle Libre 1', connectionType: 'nfc', serviceUUIDs: [] },
];

// ─── BLE GLUCOSE PARSER (Bluetooth SIG spec) ─────────────────────────────────
function parseGlucoseBle(base64: string): number | null {
  try {
    const bytes = Buffer.from(base64, 'base64');
    const flags = bytes[0];
    const timeOffsetPresent = (flags & 0x01) !== 0;
    const concPresent       = (flags & 0x02) !== 0;
    const isMmol            = (flags & 0x04) !== 0;
    if (!concPresent) return null;

    let offset = 10;
    if (timeOffsetPresent) offset += 2;

    const sfloat   = bytes.readUInt16LE(offset);
    const exp      = sfloat >> 12;
    let   mantissa = sfloat & 0x0fff;
    if (mantissa >= 0x0800) mantissa -= 0x1000;
    const signedExp = exp >= 8 ? exp - 16 : exp;
    const value     = mantissa * Math.pow(10, signedExp);

    const mg = isMmol ? Math.round(value * 18.0182) : Math.round(value);
    return mg > 0 && mg < 700 ? mg : null;
  } catch {
    return null;
  }
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type BleStatus =
  | 'idle' | 'requesting' | 'scanning'
  | 'connecting' | 'reading' | 'success' | 'error';

export interface GlucoseScannerProps {
  mode?: 'ble' | 'nfc';
  isScanning: boolean;
  onScanPress: () => void;
  glucoseValue?: string;
  onGlucoseReceived?: (value: string, deviceName: string, mode: 'ble' | 'nfc') => void;
  onError?: (msg: string) => void;
}

// ─── HOOK: useBleGlucose ─────────────────────────────────────────────────────
function useBleGlucose(
  onReceived: (value: string, name: string) => void,
  onErr: (msg: string) => void
) {
  const managerRef = useRef<BleManager | null>(null);
  const [status, setStatus]             = useState<BleStatus>('idle');
  const [foundDevices, setFoundDevices] = useState<Array<{ id: string; label: string; rssi: number | null }>>([]);
  const [connDev, setConnDev]           = useState<Device | null>(null);
  const [deviceName, setDeviceName]     = useState('');

  // BleManager se crea de forma lazy (solo al iniciar el primer escaneo).
  // Crearlo en useEffect al montar falla en simulador iOS porque el módulo
  // nativo BLE no existe en el simulador → NativeEventEmitter null crash.
  const getManager = useCallback((): BleManager | null => {
    if (managerRef.current) return managerRef.current;
    try {
      managerRef.current = new BleManager();
      return managerRef.current;
    } catch (e) {
      console.warn('[BLE] No se pudo crear BleManager (simulador?):', e);
      return null;
    }
  }, []);

  useEffect(() => {
    return () => { managerRef.current?.destroy(); managerRef.current = null; };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 31) {
      const res = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(res).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
    }
    const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return r === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const connectAndRead = useCallback(async (device: Device, profile: DeviceProfile) => {
    const mgr = getManager();
    if (!mgr) return;
    setStatus('connecting');
    setDeviceName(profile.label);
    mgr.stopDeviceScan();

    try {
      const conn = await device.connect({ autoConnect: false });
      setConnDev(conn);
      await conn.discoverAllServicesAndCharacteristics();
      setStatus('reading');

      conn.monitorCharacteristicForService(
        GLUCOSE_SERVICE_UUID,
        GLUCOSE_MEASURE_UUID,
        (err: BleError | null, ch) => {
          if (err) { setStatus('error'); onErr(err.message); return; }
          if (ch?.value) {
            const mg = parseGlucoseBle(ch.value);
            if (mg !== null) {
              setStatus('success');
              onReceived(String(mg), profile.label);
              conn.cancelConnection();
            }
          }
        }
      );

      try {
        await conn.writeCharacteristicWithResponseForService(
          GLUCOSE_SERVICE_UUID, RACP_UUID,
          btoa(String.fromCharCode(0x01, 0x01))
        );
      } catch { /* opcional */ }

      setTimeout(() => {
        if (status === 'reading' || status === 'connecting') {
          conn.cancelConnection();
          setStatus('error');
          onErr('Tiempo agotado — el dispositivo no respondió');
        }
      }, 15000);
    } catch (e: any) {
      setStatus('error');
      setConnDev(null);
      onErr(e?.message ?? 'Error de conexión BLE');
    }
  }, [onReceived, onErr, getManager]);

  const startScan = useCallback(async () => {
    const mgr = getManager();
    if (!mgr) {
      setStatus('error');
      onErr('Bluetooth no disponible en este dispositivo');
      return;
    }
    setFoundDevices([]);
    setStatus('requesting');

    const ok = await requestPermissions();
    if (!ok) { setStatus('error'); onErr('Permisos Bluetooth denegados'); return; }

    const bleState = await mgr.state();
    if (bleState !== BleState.PoweredOn) {
      setStatus('error');
      onErr('Bluetooth apagado — actívalo en Configuración');
      return;
    }

    setStatus('scanning');
    mgr.startDeviceScan(null, { allowDuplicates: false }, (err, dev) => {
      if (err) { setStatus('error'); onErr(err.message); return; }
      if (!dev?.name) return;
      const profile = KNOWN_DEVICES.find(k => k.connectionType === 'ble' && k.namePattern.test(dev.name!));
      if (!profile) return;
      setFoundDevices(prev =>
        prev.find(d => d.id === dev.id)
          ? prev
          : [...prev, { id: dev.id, label: profile.label, rssi: dev.rssi }]
      );
      connectAndRead(dev, profile);
    });

    setTimeout(() => {
      if (status === 'scanning') {
        mgr.stopDeviceScan();
        if (foundDevices.length === 0) {
          setStatus('error');
          onErr('No se encontraron dispositivos. ¿Está el glucómetro encendido?');
        } else {
          setStatus('idle');
        }
      }
    }, 30000);
  }, [requestPermissions, connectAndRead, onErr, getManager]);

  const stopScan = useCallback(() => {
    managerRef.current?.stopDeviceScan();
    connDev?.cancelConnection();
    setConnDev(null);
    setStatus('idle');
    setFoundDevices([]);
  }, [connDev]);

  return { status, foundDevices, deviceName, startScan, stopScan };
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export const GlucoseScanner = ({
  mode = 'ble',
  isScanning,
  onScanPress,
  glucoseValue = '',
  onGlucoseReceived,
  onError,
}: GlucoseScannerProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const ble = useBleGlucose(
    (v, n) => onGlucoseReceived?.(v, n, 'ble'),
    msg => onError?.(msg)
  );

  const nfc = useNfcGlucose();

  // Sincronizar isScanning con acciones internas
  useEffect(() => {
    if (!isScanning) {
      if (mode === 'ble') ble.stopScan();
      if (mode === 'nfc') nfc.cancelNfc();
      return;
    }
    if (mode === 'ble' && ble.status === 'idle') ble.startScan();
    if (mode === 'nfc' && nfc.status === 'idle' && nfc.nfcSupported && nfc.nfcEnabled) {
      nfc.readNfc();
    }
  }, [isScanning, mode]);

  // Propagar valor NFC al padre
  useEffect(() => {
    if (nfc.status === 'success' && nfc.glucoseValue) {
      onGlucoseReceived?.(nfc.glucoseValue, nfc.deviceName, 'nfc');
    }
    if (nfc.status === 'error' && nfc.errorMsg) {
      onError?.(nfc.errorMsg);
    }
  }, [nfc.status, nfc.glucoseValue]);

  // Animación de pulso
  const isActive = mode === 'ble'
    ? ['requesting', 'scanning', 'connecting', 'reading'].includes(ble.status)
    : ['waiting_tap', 'reading'].includes(nfc.status);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.14, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [isActive]);

  // Estados derivados
  const isSuccess = mode === 'ble' ? ble.status === 'success' : nfc.status === 'success';
  const isError   = mode === 'ble' ? ble.status === 'error'   : nfc.status === 'error';
  const displayValue = mode === 'nfc' ? (nfc.glucoseValue || glucoseValue) : glucoseValue;

  const statusMap: Record<string, string> = {
    // BLE
    idle:       'LISTO PARA SINCRONIZAR',
    requesting: 'SOLICITANDO PERMISOS...',
    scanning:   'BUSCANDO DISPOSITIVOS...',
    connecting: `CONECTANDO A ${ble.deviceName.toUpperCase() || '...'}`,
    reading:    'LEYENDO DATOS...',
    success:    'LECTURA EXITOSA',
    error:      'ERROR DE CONEXIÓN',
    // NFC
    checking:    'VERIFICANDO NFC...',
    waiting_tap: 'ACERCA EL SENSOR...',
    unsupported: 'NFC NO DISPONIBLE',
  };

  const currentStatusKey = mode === 'ble' ? ble.status : nfc.status;
  const statusText = statusMap[currentStatusKey] ?? 'LISTO';

  const nfcWarning = mode === 'nfc' && !nfc.nfcSupported
    ? 'Este dispositivo no tiene NFC'
    : mode === 'nfc' && !nfc.nfcEnabled
    ? 'NFC desactivado — actívalo en Configuración'
    : null;

  const circleColor = isSuccess
    ? 'rgba(34,197,94,0.4)'
    : isError  ? 'rgba(239,68,68,0.3)'
    : isActive ? 'rgba(134,208,239,0.35)'
    : mode === 'nfc' ? 'rgba(59,130,246,0.25)'
    : 'rgba(0,103,130,0.2)';

  const circleBg = isSuccess
    ? 'rgba(34,197,94,0.06)'
    : isError  ? 'rgba(239,68,68,0.05)'
    : isActive ? 'rgba(0,103,130,0.1)'
    : 'rgba(0,103,130,0.03)';

  const iconColor = isSuccess ? '#22c55e'
    : isError  ? '#ef4444'
    : isActive ? '#86d0ef'
    : mode === 'nfc' ? '#3b82f6'
    : '#006782';

  const handlePress = () => {
    if (mode === 'ble') {
      if (isActive) ble.stopScan();
      onScanPress();
    } else {
      if (isActive) { nfc.cancelNfc(); onScanPress(); }
      else if (isSuccess) { nfc.reset(); onScanPress(); }
      else onScanPress();
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* ── Badge de modo ── */}
      <View style={[styles.modeBadge, mode === 'nfc' && styles.modeBadgeNfc]}>
        {mode === 'nfc'
          ? <Wifi color="#3b82f6" size={11} />
          : <Bluetooth color="#006782" size={11} />}
        <Text style={[styles.modeBadgeText, mode === 'nfc' && styles.modeBadgeTextNfc]}>
          {mode === 'nfc' ? 'NFC' : 'BLUETOOTH'}
        </Text>
        {/* Punto verde si NFC está activo y disponible */}
        {mode === 'nfc' && nfc.nfcSupported && nfc.nfcEnabled && (
          <View style={styles.nfcActiveDot} />
        )}
      </View>

      {/* ── Círculo animado ── */}
      <Animated.View style={[
        styles.pulseCircle,
        { transform: [{ scale: pulseAnim }], borderColor: circleColor, backgroundColor: circleBg },
      ]}>
        <View style={styles.innerCircle}>
          {/* Icono central */}
          {isSuccess ? (
            <CheckCircle color="#22c55e" size={52} strokeWidth={1.5} />
          ) : isError ? (
            <AlertCircle color="#ef4444" size={52} strokeWidth={1.5} />
          ) : mode === 'nfc' ? (
            <Wifi color={iconColor} size={48} strokeWidth={1.5} />
          ) : (
            <Radio color={iconColor} size={48} strokeWidth={1.5} />
          )}

          {/* Estado textual */}
          <Text style={[styles.statusLabel, isError && styles.statusError]}>
            {statusText}
          </Text>

          {/* Pills BLE durante escaneo */}
          {mode === 'ble' && ble.status === 'scanning' && ble.foundDevices.length > 0 && (
            <View style={styles.pillsRow}>
              {ble.foundDevices.slice(0, 2).map((d) => (
                <View key={d.id} style={styles.devicePill}>
                  <Bluetooth color="#006782" size={9} />
                  <Text style={styles.pillText} numberOfLines={1}>{d.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* NFC: anillos de animación durante espera */}
          {mode === 'nfc' && nfc.status === 'waiting_tap' && (
            <View style={styles.nfcRings}>
              <View style={styles.nfcRing1}>
                <View style={styles.nfcRing2}>
                  <View style={styles.nfcCore} />
                </View>
              </View>
            </View>
          )}

          {/* Valor de glucosa */}
          {displayValue !== '' && !isError && (
            <View style={styles.valueBox}>
              <Text style={styles.valueLarge}>{displayValue}</Text>
              <Text style={styles.valueUnit}>mg/dL</Text>
            </View>
          )}

          {/* Raw bytes NFC (debug) */}
          {mode === 'nfc' && nfc.rawBytes && nfc.rawBytes.length > 0 && (
            <Text style={styles.rawBytes} numberOfLines={2}>
              RAW: {nfc.rawBytes.slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join(' ')}
              {nfc.rawBytes.length > 12 ? '…' : ''}
            </Text>
          )}

          {/* Mensaje de error */}
          {isError && (
            <Text style={styles.errorText} numberOfLines={2}>
              {mode === 'nfc' ? nfc.errorMsg : ''}
            </Text>
          )}
        </View>
      </Animated.View>

      {/* ── Botón de acción ── */}
      <TouchableOpacity
        activeOpacity={0.82}
        style={[
          styles.actionBtn,
          isActive    && styles.btnActive,
          isSuccess   && styles.btnSuccess,
          isError     && styles.btnRetry,
          (mode === 'nfc' && !isActive && !isSuccess && !isError) && styles.btnNfc,
        ]}
        onPress={handlePress}
        disabled={!!nfcWarning}
      >
        {isError ? (
          <RefreshCw color="white" size={17} />
        ) : isActive ? (
          <X color="white" size={17} />
        ) : isSuccess ? (
          <Zap color="white" size={17} />
        ) : mode === 'nfc' ? (
          <Wifi color="white" size={17} />
        ) : (
          <Bluetooth color="white" size={17} />
        )}
        <Text style={styles.actionText}>
          {isError    ? 'Reintentar'
          : isActive  ? 'Cancelar'
          : isSuccess ? 'Nueva lectura'
          : mode === 'nfc' ? 'Leer con NFC'
          : 'Sincronizar'}
        </Text>
      </TouchableOpacity>

      {/* ── Aviso NFC no disponible/habilitado ── */}
      {nfcWarning && (
        <View style={styles.warnBox}>
          <AlertCircle color="#f59e0b" size={13} />
          <Text style={styles.warnText}>{nfcWarning}</Text>
        </View>
      )}

      {/* ── Nota de pie ── */}
      {!nfcWarning && !isError && !isSuccess && (
        <Text style={styles.footNote}>
          {mode === 'nfc'
            ? 'ISO 15693 · FreeStyle Libre 1 · Acerca el sensor al lomo del teléfono'
            : 'Enciende el glucómetro y activa su Bluetooth antes de sincronizar'}
        </Text>
      )}
    </View>
  );
};

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },

  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,103,130,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    marginBottom: 18,
  },
  modeBadgeNfc: { backgroundColor: 'rgba(59,130,246,0.12)' },
  modeBadgeText: {
    color: '#006782', fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
  },
  modeBadgeTextNfc: { color: '#3b82f6' },
  nfcActiveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginLeft: 2,
  },

  pulseCircle: {
    width: 244, height: 244, borderRadius: 122, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  innerCircle: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22,
  },

  statusLabel: {
    color: '#6f787d', fontSize: 10, fontWeight: '800', marginTop: 13,
    letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center',
  },
  statusError: { color: '#ef4444' },

  pillsRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 5, marginTop: 7,
  },
  devicePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,103,130,0.1)', paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 100,
  },
  pillText: { color: '#006782', fontSize: 9, fontWeight: '700', maxWidth: 82 },

  nfcRings: { alignItems: 'center', marginTop: 8 },
  nfcRing1: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  nfcRing2: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  nfcCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6' },

  valueBox: { alignItems: 'center', marginTop: 5 },
  valueLarge: { color: 'white', fontSize: 52, fontWeight: '800', lineHeight: 58 },
  valueUnit: { fontSize: 13, color: '#006782', fontWeight: '700' },

  rawBytes: {
    color: 'rgba(255,255,255,0.22)', fontSize: 9, marginTop: 6, textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 0.5,
  },

  errorText: {
    color: '#ef4444', fontSize: 10, textAlign: 'center',
    marginTop: 7, paddingHorizontal: 8, lineHeight: 15,
  },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    marginTop: 34, backgroundColor: '#006782',
    paddingHorizontal: 38, paddingVertical: 16, borderRadius: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 6,
  },
  btnActive:   { backgroundColor: '#1d2426', borderWidth: 1, borderColor: '#ef4444' },
  btnSuccess:  { backgroundColor: '#15803d' },
  btnRetry:    { backgroundColor: '#006782' },
  btnNfc:      { backgroundColor: '#1d4ed8' },
  actionText:  { color: 'white', fontWeight: '800', fontSize: 15, letterSpacing: 0.4 },

  warnBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 16, maxWidth: 280,
  },
  warnText: { color: '#f59e0b', fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 16 },

  footNote: {
    marginTop: 16, color: 'rgba(111,120,125,0.7)',
    fontSize: 10, textAlign: 'center', letterSpacing: 0.2,
    paddingHorizontal: 20, lineHeight: 15,
  },
});