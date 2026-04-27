/**
 * LogGlucoseScreen.tsx — v3
 * Guarda en AppStore → actualiza Dashboard, Historial, Gráfico y dispara notificación.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings, Bluetooth, Edit3, Save, Wifi, TrendingUp } from 'lucide-react-native';
import { GlucoseScanner } from '@/components/ui/GlucoseScanner';
import { getGlucoseRange, useAppStore } from '@/store/AppStore';



type InputMode = 'bluetooth' | 'nfc' | 'manual';

export default function LogGlucoseScreen() {
  const router = useRouter();
  const { addGlucoseEntry } = useAppStore();

  const [inputMode,       setInputMode]       = useState<InputMode>('bluetooth');
  const [isScanning,      setIsScanning]      = useState(false);
  const [glucoseValue,    setGlucoseValue]    = useState('');
  const [lastDeviceName,  setLastDeviceName]  = useState('');
  const [scanError,       setScanError]       = useState('');

  const handleGlucoseReceived = useCallback((value: string, deviceName: string) => {
    setGlucoseValue(value);
    setLastDeviceName(deviceName);
    setIsScanning(false);
    setScanError('');
  }, []);

  const handleSave = async () => {
    const mg = parseInt(glucoseValue, 10);
    if (!glucoseValue || isNaN(mg) || mg < 20 || mg > 600) {
      Alert.alert('Valor inválido', 'Ingresa un valor entre 20 y 600 mg/dL.');
      return;
    }
    const sourceMap: Record<InputMode, 'ble'|'nfc'|'manual'> = {
      bluetooth: 'ble', nfc: 'nfc', manual: 'manual',
    };
    await addGlucoseEntry({
      value: mg,
      timestamp: new Date(),
      source: sourceMap[inputMode],
      deviceName: lastDeviceName || undefined,
    });
    const range = getGlucoseRange(mg);
    Alert.alert(
      '✓ Registro guardado',
      `${mg} mg/dL · ${range.label}`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const mg      = parseInt(glucoseValue, 10);
  const rangeInfo = glucoseValue && !isNaN(mg) ? getGlucoseRange(mg) : null;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <ArrowLeft color="#006782" size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Registrar Glucosa</Text>
        <TouchableOpacity style={s.iconBtn}>
          <Settings color="#006782" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Toggle de modo */}
        <View style={s.modeSelector}>
          {([
            { id: 'bluetooth', Icon: Bluetooth, label: 'Bluetooth' },
            { id: 'nfc',       Icon: Wifi,      label: 'NFC'       },
            { id: 'manual',    Icon: Edit3,      label: 'Manual'    },
          ] as const).map(({ id, Icon, label }) => (
            <TouchableOpacity
              key={id}
              style={[s.modeTab, inputMode === id && s.modeTabActive]}
              onPress={() => { setInputMode(id); setGlucoseValue(''); setScanError(''); }}
            >
              <Icon size={15} color={inputMode === id ? '#fff' : '#6f787d'} />
              <Text style={[s.modeTabText, inputMode === id && s.modeTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Área central */}
        <View style={s.centralArea}>
          {inputMode !== 'manual' ? (
            <GlucoseScanner
              mode={inputMode === 'nfc' ? 'nfc' : 'ble'}
              isScanning={isScanning}
              onScanPress={() => { setScanError(''); setIsScanning(v => !v); }}
              glucoseValue={glucoseValue}
              onGlucoseReceived={handleGlucoseReceived}
              onError={msg => { setScanError(msg); setIsScanning(false); }}
            />
          ) : (
            <View style={s.manualView}>
              <Text style={s.inputLabel}>MG/DL</Text>
              <TextInput
                style={s.hugeInput}
                placeholder="000"
                placeholderTextColor="rgba(255,255,255,0.08)"
                keyboardType="numeric"
                value={glucoseValue}
                onChangeText={t => setGlucoseValue(t.replace(/[^0-9]/g, ''))}
                maxLength={3}
                autoFocus
              />
            </View>
          )}
        </View>

        {scanError !== '' && (
          <View style={s.errorBanner}>
            <Text style={s.errorBannerText}>{scanError}</Text>
          </View>
        )}

        {rangeInfo && glucoseValue !== '' && (
          <View style={[s.rangeBadge, { backgroundColor: rangeInfo.bg }]}>
            <TrendingUp color={rangeInfo.color} size={13} />
            <Text style={[s.rangeText, { color: rangeInfo.color }]}>{rangeInfo.label}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.saveBtn, !glucoseValue && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!glucoseValue}
        >
          <Save color="white" size={20} />
          <Text style={s.saveBtnText}>Guardar Registro</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#0f1316' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerTitle:       { color: 'white', fontSize: 18, fontWeight: '700' },
  iconBtn:           { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,103,130,0.12)' },
  scroll:            { paddingHorizontal: 20, paddingBottom: 40 },
  modeSelector:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginTop: 24, gap: 4 },
  modeTab:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  modeTabActive:     { backgroundColor: '#006782' },
  modeTabText:       { color: '#6f787d', fontSize: 12, fontWeight: '700' },
  modeTabTextActive: { color: 'white' },
  centralArea:       { minHeight: 320, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  manualView:        { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  inputLabel:        { color: '#6f787d', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  hugeInput:         { color: 'white', fontSize: 96, fontWeight: '800', textAlign: 'center', width: 240, letterSpacing: -2 },
  errorBanner:       { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', padding: 12, marginBottom: 12 },
  errorBannerText:   { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  rangeBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, marginBottom: 16 },
  rangeText:         { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  saveBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#006782', paddingVertical: 18, borderRadius: 100, marginBottom: 32 },
  saveBtnDisabled:   { opacity: 0.35 },
  saveBtnText:       { color: 'white', fontWeight: '800', fontSize: 16 },
});
