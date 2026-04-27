/**
 * useNfcGlucose.ts
 *
 * Hook para leer glucosa vía NFC (ISO 15693 / NfcV).
 * Compatible con Abbott FreeStyle Libre 1 y dispositivos similares.
 *
 * Instalación:
 *   npx expo install react-native-nfc-manager
 *
 * app.json plugins:
 *   ["react-native-nfc-manager"]
 *
 * iOS Info.plist (vía app.json expo.ios.infoPlist):
 *   NFCReaderUsageDescription: "Leer sensor de glucosa FreeStyle Libre"
 *
 * AndroidManifest.xml (automático con el plugin):
 *   <uses-permission android:name="android.permission.NFC" />
 *   <uses-feature android:name="android.hardware.nfc" android:required="false" />
 */

import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

// react-native-nfc-manager se importa dinámicamente para no romper
// si el módulo no está instalado en el proyecto.
let NfcManager: any = null;
let NfcTech: any = null;
let NfcEvents: any = null;

try {
  const nfcModule = require('react-native-nfc-manager');
  NfcManager = nfcModule.default;
  NfcTech = nfcModule.NfcTech;
  NfcEvents = nfcModule.NfcEvents;
} catch {
  // Módulo no instalado — el hook reportará nfcSupported = false
}

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export type NfcStatus =
  | 'idle'
  | 'checking'
  | 'waiting_tap'
  | 'reading'
  | 'success'
  | 'error'
  | 'unsupported';

export interface NfcGlucoseState {
  status: NfcStatus;
  glucoseValue: string;       // mg/dL como string
  rawBytes: number[] | null;  // bytes crudos para debug
  errorMsg: string;
  deviceName: string;
  nfcSupported: boolean;
  nfcEnabled: boolean;
}

// ─── PARSERS POR DISPOSITIVO ──────────────────────────────────────────────────

/**
 * Abbott FreeStyle Libre 1
 * Usa NfcV (ISO 15693). Los datos de glucosa están en el bloque 3 (índice 3).
 * Bytes del bloque: [status, glucose_lo, glucose_hi, ...padding]
 * El valor raw se convierte a mg/dL multiplicando por 0.0954 aprox.
 * Referencia: https://github.com/NightscoutFoundation/xDrip (LibreReceiver)
 */
function parseFreestyleLibre1(blocks: number[][]): number | null {
  try {
    // Bloque 3: contiene glucosa actual
    // blocks[3] = [flags, low_byte, high_byte, ...]
    if (blocks.length < 4) return null;
    const block = blocks[3];
    if (block.length < 3) return null;

    const rawGlucose = (block[1] & 0xff) | ((block[2] & 0xff) << 8);
    // Factor de calibración FreeStyle Libre 1
    const mgdl = Math.round(rawGlucose * 0.0954);

    // Valores válidos
    if (mgdl < 20 || mgdl > 600) return null;
    return mgdl;
  } catch {
    return null;
  }
}

/**
 * Parseo genérico para dispositivos NFC de glucosa con perfil estándar.
 * Asume: bloque 0 = header, bloque 1 = datos, bytes 0-1 = glucosa en mg/dL
 */
function parseGenericNfcGlucose(blocks: number[][]): number | null {
  try {
    if (blocks.length < 2) return null;
    const dataBlock = blocks[1];
    if (dataBlock.length < 2) return null;

    const mgdl = (dataBlock[0] & 0xff) | ((dataBlock[1] & 0xff) << 8);
    if (mgdl < 20 || mgdl > 600) return null;
    return mgdl;
  } catch {
    return null;
  }
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useNfcGlucose() {
  const [state, setState] = useState<NfcGlucoseState>({
    status: 'idle',
    glucoseValue: '',
    rawBytes: null,
    errorMsg: '',
    deviceName: '',
    nfcSupported: false,
    nfcEnabled: false,
  });

  // ── Verificar soporte NFC al montar ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!NfcManager) {
        setState((s) => ({ ...s, status: 'unsupported', nfcSupported: false }));
        return;
      }

      setState((s) => ({ ...s, status: 'checking' }));

      try {
        const supported = await NfcManager.isSupported();
        if (!supported) {
          setState((s) => ({
            ...s,
            status: 'unsupported',
            nfcSupported: false,
            errorMsg: 'Este dispositivo no tiene NFC',
          }));
          return;
        }

        await NfcManager.start();
        const enabled = await NfcManager.isEnabled();

        setState((s) => ({
          ...s,
          status: 'idle',
          nfcSupported: true,
          nfcEnabled: enabled,
          errorMsg: enabled ? '' : 'NFC está desactivado. Actívalo en Configuración.',
        }));
      } catch (e: any) {
        setState((s) => ({
          ...s,
          status: 'error',
          nfcSupported: false,
          errorMsg: e?.message ?? 'Error al inicializar NFC',
        }));
      }
    })();

    return () => {
      // Cancelar sesión NFC al desmontar
      NfcManager?.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  // ── Leer sensor NFC ───────────────────────────────────────────────────────
  const readNfc = useCallback(async () => {
    if (!NfcManager || !NfcTech) {
      setState((s) => ({
        ...s,
        status: 'unsupported',
        errorMsg: 'react-native-nfc-manager no está instalado',
      }));
      return;
    }

    setState((s) => ({
      ...s,
      status: 'waiting_tap',
      glucoseValue: '',
      rawBytes: null,
      errorMsg: '',
      deviceName: '',
    }));

    try {
      // Solicitar tecnología NfcV (ISO 15693) — usada por FreeStyle Libre
      await NfcManager.requestTechnology([NfcTech.NfcV, NfcTech.Ndef]);

      setState((s) => ({ ...s, status: 'reading' }));

      const tag = await NfcManager.getTag();
      const techType = tag?.techTypes?.find(
        (t: string) =>
          t.includes('NfcV') ||
          t.includes('IsoDep') ||
          t.includes('NdefFormatable')
      );

      let glucoseMg: number | null = null;
      let detectedDevice = 'Sensor NFC desconocido';
      let allRawBytes: number[] = [];

      if (techType?.includes('NfcV') || true) {
        // Leer múltiples bloques con READ_MULTIPLE_BLOCKS (comando 0x23)
        // Flag: 0x02 = direccionado, 0x00 = sin UID, bloques 0..15
        const blocks: number[][] = [];

        for (let i = 0; i < 16; i++) {
          try {
            // READ_SINGLE_BLOCK: [flags=0x02, cmd=0x20, blockNum]
            const response = await NfcManager.transceive([0x02, 0x20, i]);
            if (response && response.length > 0) {
              // response[0] = status byte (0x00 = OK), response[1..] = datos
              const dataBytes = response.slice(1);
              blocks.push(Array.from(dataBytes));
              allRawBytes = allRawBytes.concat(Array.from(response));
            }
          } catch {
            // Algunos bloques pueden fallar; continuar
            blocks.push([]);
          }
        }

        // Intentar parsear como FreeStyle Libre 1
        glucoseMg = parseFreestyleLibre1(blocks);
        if (glucoseMg !== null) {
          detectedDevice = 'Abbott FreeStyle Libre 1';
        } else {
          // Intentar parseo genérico
          glucoseMg = parseGenericNfcGlucose(blocks);
          if (glucoseMg !== null) {
            detectedDevice = 'Sensor NFC de glucosa';
          }
        }
      }

      await NfcManager.cancelTechnologyRequest();

      if (glucoseMg !== null) {
        setState((s) => ({
          ...s,
          status: 'success',
          glucoseValue: String(glucoseMg),
          rawBytes: allRawBytes,
          deviceName: detectedDevice,
          errorMsg: '',
        }));
      } else {
        setState((s) => ({
          ...s,
          status: 'error',
          rawBytes: allRawBytes,
          errorMsg:
            'No se pudo leer el valor de glucosa. Verifica que el sensor esté activo y acércalo lentamente.',
        }));
      }
    } catch (e: any) {
      await NfcManager.cancelTechnologyRequest().catch(() => {});

      const msg = e?.message ?? '';
      const isUserCancel =
        msg.includes('cancelled') ||
        msg.includes('canceled') ||
        msg.includes('UserCancel');

      setState((s) => ({
        ...s,
        status: isUserCancel ? 'idle' : 'error',
        errorMsg: isUserCancel
          ? ''
          : msg || 'Error al leer el sensor NFC',
      }));
    }
  }, []);

  const cancelNfc = useCallback(async () => {
    await NfcManager?.cancelTechnologyRequest().catch(() => {});
    setState((s) => ({ ...s, status: 'idle', errorMsg: '' }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({
      ...s,
      status: 'idle',
      glucoseValue: '',
      rawBytes: null,
      errorMsg: '',
      deviceName: '',
    }));
  }, []);

  return { ...state, readNfc, cancelNfc, reset };
}
