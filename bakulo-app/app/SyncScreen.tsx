/**
 * SyncScreen.tsx — v2 operativo
 * Sincronización real con SQLite → PostgreSQL + gestión de dispositivos.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Animated, Easing,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft, Settings, RefreshCw, Plus, ChevronRight,
  Activity, ShieldPlus, HelpCircle, CloudCheck, History,
  BatteryFull, BatteryMedium, BatteryLow, Wifi, WifiOff,
  Trash2,
} from 'lucide-react-native';
import { SyncService, ConnectedDevice, SyncResult } from '@/service/syncService';
import { useAppStore } from '@/store/AppStore';

// ─── SIGNAL BARS ──────────────────────────────────────────────────────────────
function SignalBars({ strength }: { strength: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end' }}>
      {[1,2,3,4].map(i => (
        <View
          key={i}
          style={{
            width: 4,
            height: 4 + i * 3,
            borderRadius: 2,
            backgroundColor: i <= strength ? '#006782' : '#3f484c',
          }}
        />
      ))}
    </View>
  );
}

// ─── BATTERY ICON ─────────────────────────────────────────────────────────────
function BatteryIcon({ level }: { level: number }) {
  const color = level > 50 ? '#22c55e' : level > 20 ? '#f59e0b' : '#ef4444';
  const Icon  = level > 50 ? BatteryFull : level > 20 ? BatteryMedium : BatteryLow;
  return <Icon color={color} size={18} />;
}

// ─── DEVICE CARD ─────────────────────────────────────────────────────────────
function DeviceCard({ device, onRemove }: { device: ConnectedDevice; onRemove: () => void }) {
  const statusColor =
    device.status === 'active' ? '#22c55e' :
    device.status === 'standby' ? '#f59e0b' : '#ef4444';

  return (
    <View style={dc.card}>
      <View style={dc.top}>
        <View style={[dc.iconBox, { backgroundColor: device.type === 'pump' ? 'rgba(26,108,60,0.2)' : 'rgba(0,78,99,0.2)' }]}>
          {device.type === 'pump'
            ? <ShieldPlus color="#a4f4b7" size={26} />
            : <Activity   color="#a9cec4" size={26} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={dc.name}>{device.name}</Text>
          <SignalBars strength={device.signalStrength} />
        </View>
        <View style={dc.batteryCol}>
          <BatteryIcon level={device.battery} />
          <Text style={dc.batteryText}>{device.battery}%</Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={dc.removeBtn}>
          <Trash2 color="#6f787d" size={16} />
        </TouchableOpacity>
      </View>
      <View style={dc.footer}>
        <View style={dc.statusRow}>
          <View style={[dc.dot, { backgroundColor: statusColor }]} />
          <Text style={dc.statusText}>
            {device.status === 'active'   ? 'Transmitiendo datos...' :
             device.status === 'standby'  ? 'Modo espera' : 'Desconectado'}
          </Text>
        </View>
        {device.lastReading && (
          <Text style={dc.lastReading}>
            {device.lastReading} mg/dL
          </Text>
        )}
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  card:        { backgroundColor: '#1d2426', borderRadius: 24, overflow: 'hidden', marginBottom: 14 },
  top:         { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  iconBox:     { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  name:        { color: '#ecf2f3', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  batteryCol:  { alignItems: 'center', gap: 2 },
  batteryText: { color: '#6f787d', fontSize: 9, fontWeight: '800' },
  removeBtn:   { padding: 8 },
  footer:      { backgroundColor: '#171d1e', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  statusText:  { color: '#bfc8ca', fontSize: 12 },
  lastReading: { color: '#86d0ef', fontSize: 13, fontWeight: '700' },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function SyncScreen() {
  const router = useRouter();
  const { entries } = useAppStore();

  const [isSyncing,    setIsSyncing]    = useState(false);
  const [syncResult,   setSyncResult]   = useState<SyncResult | null>(null);
  const [devices,      setDevices]      = useState<ConnectedDevice[]>([]);
  const [lastSyncText, setLastSyncText] = useState('Nunca');

  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnim  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    setDevices(SyncService.getConnectedDevices());
    const t = setInterval(() => {
      setLastSyncText(SyncService.getLastSyncTime());
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const startSpin = () => {
    spinValue.setValue(0);
    spinAnim.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true,
      })
    );
    spinAnim.current.start();
  };

  const stopSpin = () => {
    spinAnim.current?.stop();
    spinValue.setValue(0);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    startSpin();

    const result = await SyncService.performSync();
    setSyncResult(result);
    setDevices(SyncService.getConnectedDevices());
    setLastSyncText(SyncService.getLastSyncTime());

    stopSpin();
    setIsSyncing(false);

    if (result.errors.length > 0) {
      Alert.alert(
        'Sincronización parcial',
        result.errors.join('\n') + '\n\nLos datos se guardaron localmente.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePairDevice = async () => {
    Alert.alert(
      'Parear nuevo dispositivo',
      'Asegúrate de que el dispositivo esté encendido y en modo Bluetooth.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Buscar dispositivos',
          onPress: async () => {
            const newDev = await SyncService.pairNewDevice('Nuevo Glucómetro BLE', 'glucometer');
            if (newDev) setDevices(SyncService.getConnectedDevices());
          },
        },
      ]
    );
  };

  const handleRemoveDevice = (id: string) => {
    Alert.alert('Desconectar', '¿Quitar este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desconectar', style: 'destructive', onPress: () => {
        SyncService.removeDevice(id);
        setDevices(SyncService.getConnectedDevices());
      }},
    ]);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '360deg'],
  });

  const pendingCount = entries.length; // simplificado; en prod: db_getPendingSyncItems().length

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.safeHeader}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ArrowLeft color="#c4ebe0" size={20} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Sincronización</Text>
          </View>
          <TouchableOpacity style={s.iconBtn}>
            <Settings color="#bfc8ca" size={22} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroSection}>
          <Text style={s.heroTitle}>Sync Health</Text>
          <Text style={s.heroSub}>
            {syncResult?.status === 'success'
              ? `✓ ${syncResult.recordsSynced} registros sincronizados`
              : 'Todos los sistemas operativos.'}
          </Text>

          {/* Bento Grid */}
          <View style={s.bentoGrid}>
            {/* Integridad */}
            <View style={[s.bentoMain, { overflow: 'hidden' }]}>
              <View style={s.bentoMainHeader}>
                <View style={s.statusBadge}>
                  <View style={s.statusDot} />
                  <Text style={s.statusBadgeText}>CONEXIÓN ACTIVA</Text>
                </View>
                <CloudCheck color="white" size={26} />
              </View>
              <Text style={s.integrityPct}>
                {syncResult?.status === 'error' ? '—' : '98%'}
              </Text>
              <Text style={s.integrityLabel}>
                Integridad de datos en {devices.length} dispositivos
              </Text>
              <View style={s.decorCircle} />
            </View>

            {/* Sub cards */}
            <View style={s.bentoRow}>
              <View style={s.bentoSmall}>
                <History color="#006782" size={20} />
                <View>
                  <Text style={s.smallLabel}>Última Sync</Text>
                  <Text style={s.smallValue}>{lastSyncText}</Text>
                </View>
              </View>
              <View style={s.bentoSmall}>
                <BatteryFull color="#005229" size={20} />
                <View>
                  <Text style={s.smallLabel}>Pendientes</Text>
                  <Text style={s.smallValue}>{pendingCount} registros</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Dispositivos */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionTitle}>Dispositivos</Text>
              <Text style={s.sectionSub}>{devices.length} conectados</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={handlePairDevice}>
              <Plus color="#c4ebe0" size={15} />
              <Text style={s.addBtnText}>Parear</Text>
            </TouchableOpacity>
          </View>

          {devices.map(d => (
            <DeviceCard
              key={d.id}
              device={d}
              onRemove={() => handleRemoveDevice(d.id)}
            />
          ))}

          {devices.length === 0 && (
            <View style={s.emptyDevices}>
              <WifiOff color="#333b3d" size={28} />
              <Text style={s.emptyText}>Sin dispositivos pareados</Text>
              <Text style={s.emptySub}>Toca "Parear" para agregar uno</Text>
            </View>
          )}
        </View>

        {/* Botón sincronizar */}
        <View style={s.actionSection}>
          <TouchableOpacity
            style={[s.syncBtn, isSyncing && s.syncBtnDisabled]}
            onPress={handleSync}
            disabled={isSyncing}
            activeOpacity={0.85}
          >
            {isSyncing ? (
              <>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <RefreshCw color="white" size={20} />
                </Animated.View>
                <Text style={s.syncBtnText}>Sincronizando...</Text>
              </>
            ) : (
              <>
                <RefreshCw color="white" size={20} />
                <Text style={s.syncBtnText}>Forzar Sincronización</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={s.syncNote}>
            Úsalo si los datos tienen más de 5 minutos de retraso.
          </Text>
        </View>

        {/* Ayuda */}
        <TouchableOpacity style={s.helpCard}>
          <View style={s.helpIcon}><HelpCircle color="#c4ebe0" size={20} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.helpTitle}>¿Problemas para sincronizar?</Text>
            <Text style={s.helpSub}>Verifica que el Bluetooth esté activo y los dispositivos cerca.</Text>
          </View>
          <ChevronRight color="rgba(255,255,255,0.2)" size={18} />
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#171d1e' },
  safeHeader:      { backgroundColor: '#1d2426' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:         { backgroundColor: 'rgba(0,103,130,0.2)', padding: 8, borderRadius: 12 },
  headerTitle:     { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  iconBtn:         { padding: 8 },
  scroll:          { padding: 24, paddingBottom: 60 },
  heroSection:     { marginBottom: 28 },
  heroTitle:       { color: '#baeaff', fontSize: 30, fontWeight: '800', marginBottom: 4 },
  heroSub:         { color: '#bfc8ca', fontSize: 14, marginBottom: 20 },
  bentoGrid:       { gap: 12 },
  bentoMain:       { backgroundColor: '#006782', borderRadius: 24, padding: 22 },
  bentoMainHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  statusBadgeText: { color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  integrityPct:    { color: 'white', fontSize: 46, fontWeight: '800' },
  integrityLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  decorCircle:     { position: 'absolute', right: -40, bottom: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)' },
  bentoRow:        { flexDirection: 'row', gap: 12 },
  bentoSmall:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1d2426', borderRadius: 20, padding: 16 },
  smallLabel:      { color: '#6f787d', fontSize: 10, textTransform: 'uppercase' },
  smallValue:      { color: '#c4ebe0', fontSize: 14, fontWeight: '700' },
  section:         { marginBottom: 20 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle:    { color: '#c4ebe0', fontSize: 20, fontWeight: '700' },
  sectionSub:      { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addBtnText:      { color: '#c4ebe0', fontWeight: '700', fontSize: 13 },
  emptyDevices:    { alignItems: 'center', paddingVertical: 32, gap: 8, backgroundColor: '#1d2426', borderRadius: 20 },
  emptyText:       { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  emptySub:        { color: '#6f787d', fontSize: 12 },
  actionSection:   { alignItems: 'center', marginBottom: 20 },
  syncBtn:         { width: '100%', backgroundColor: '#006782', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText:     { color: 'white', fontSize: 16, fontWeight: '800' },
  syncNote:        { color: '#6f787d', fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 17 },
  helpCard:        { backgroundColor: '#1d2426', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderLeftWidth: 3, borderLeftColor: '#006782' },
  helpIcon:        { backgroundColor: '#004e63', padding: 10, borderRadius: 12 },
  helpTitle:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  helpSub:         { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
});
