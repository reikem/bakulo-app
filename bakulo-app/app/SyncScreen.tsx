/**
 * SyncScreen.tsx — v3
 *
 * ✅ Conectado a syncService.ts (SQLite ↔ Supabase)
 * ✅ Muestra estado de conexión Supabase en tiempo real
 * ✅ Sync manual con un toque
 * ✅ Historial de sincronizaciones
 * ✅ Estado de cada tabla (glucosa, ejercicio, comida, medicación, docs)
 * ✅ Pull remoto (Supabase → app)
 * ✅ NO depende de SyncService.getConnectedDevices() (eliminado)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl, Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock,
  Wifi, WifiOff, Database, CloudUpload, CloudDownload,
  Droplets, Dumbbell, Utensils, Pill, FolderOpen, AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import { useAppStore } from '@/store/AppStore';
import {
  syncPendingToSupabase,
  pullFromSupabase,
  SyncResult,
} from '@/service/syncService';
import { testSupabaseConnection } from '@/service/supabaseClient';
import { db_getPendingSyncItems } from '@/service/database';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface SyncLog {
  id:        string;
  timestamp: Date;
  type:      'upload' | 'download' | 'error' | 'connected' | 'disconnected';
  message:   string;
  count?:    number;
}

interface TableStatus {
  name:    string;
  label:   string;
  icon:    React.ReactNode;
  local:   number;
  pending: number;
  color:   string;
}

// ─── ROTATE ANIMATION ─────────────────────────────────────────────────────────

function useRotateAnim(active: boolean) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const loopRef    = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      loopRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue:         1,
          duration:        900,
          useNativeDriver: true,
        })
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      rotateAnim.setValue(0);
    }
    return () => { loopRef.current?.stop(); };
  }, [active]);

  return rotateAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });
}

// ─── HELPER: formatear tiempo relativo ────────────────────────────────────────

function timeAgo(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 5)    return 'Ahora mismo';
  if (s < 60)   return `Hace ${Math.floor(s)}s`;
  if (s < 3600) return `Hace ${Math.floor(s / 60)} min`;
  if (s < 86400)return `Hace ${Math.floor(s / 3600)}h`;
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function SyncScreen() {
  const router = useRouter();
  const {
    glucoseEntries, exerciseEntries, mealEntries,
    medicationEntries, entries,
  } = useAppStore();

  const [isSyncing,    setIsSyncing]    = useState(false);
  const [isPulling,    setIsPulling]    = useState(false);
  const [isConnected,  setIsConnected]  = useState<boolean | null>(null); // null = checking
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastResult,   setLastResult]   = useState<SyncResult | null>(null);
  const [logs,         setLogs]         = useState<SyncLog[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing,   setRefreshing]   = useState(false);

  const spinUpload   = useRotateAnim(isSyncing);
  const spinDownload = useRotateAnim(isPulling);

  // ── Calcular pendientes de la cola ────────────────────────────────────────
  const refreshPending = useCallback(() => {
    try {
      const items = db_getPendingSyncItems();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  // ── Test de conexión ──────────────────────────────────────────────────────
  const checkConnection = useCallback(async () => {
    setIsConnected(null);
    const ok = await testSupabaseConnection();
    setIsConnected(ok);
    addLog(
      ok ? 'connected' : 'disconnected',
      ok ? '✅ Supabase conectado' : '❌ Sin conexión a Supabase'
    );
  }, []);

  const addLog = (type: SyncLog['type'], message: string, count?: number) => {
    setLogs(prev => [
      {
        id:        `log-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
        timestamp: new Date(),
        type,
        message,
        count,
      },
      ...prev.slice(0, 29), // máximo 30 logs
    ]);
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkConnection();
    refreshPending();
  }, []);

  // ── Upload: SQLite → Supabase ─────────────────────────────────────────────
  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncPendingToSupabase();
      setLastResult(result);
      setLastSyncTime(new Date());
      refreshPending();
      addLog(
        result.success ? 'upload' : 'error',
        result.message,
        result.uploaded
      );
    } catch (e: any) {
      addLog('error', `Error: ${e?.message ?? 'Desconocido'}`);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPending]);

  // ── Download: Supabase → local ────────────────────────────────────────────
  const handlePull = useCallback(async () => {
    if (isPulling) return;
    setIsPulling(true);
    try {
      const data = await pullFromSupabase();
      const total =
        data.glucose.length + data.exercise.length +
        data.meals.length   + data.medication.length + data.documents.length;
      addLog('download', `Descargados ${total} registros del servidor`, total);
    } catch (e: any) {
      addLog('error', `Error al descargar: ${e?.message ?? 'Desconocido'}`);
    } finally {
      setIsPulling(false);
    }
  }, [isPulling]);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkConnection();
    refreshPending();
    setRefreshing(false);
  }, [checkConnection, refreshPending]);

  // ── Table statuses ────────────────────────────────────────────────────────
  const tableStatuses: TableStatus[] = [
    { name: 'glucose',    label: 'Glucosa',    icon: <Droplets color="#86d0ef" size={18}/>,   local: glucoseEntries.length,    pending: 0, color: '#86d0ef' },
    { name: 'exercise',   label: 'Ejercicio',  icon: <Dumbbell color="#a4f4b7" size={18}/>,   local: exerciseEntries.length,   pending: 0, color: '#a4f4b7' },
    { name: 'meals',      label: 'Comidas',    icon: <Utensils color="#f9c74f" size={18}/>,   local: mealEntries.length,       pending: 0, color: '#f9c74f' },
    { name: 'medication', label: 'Medicación', icon: <Pill     color="#c4b5fd" size={18}/>,   local: medicationEntries.length, pending: 0, color: '#c4b5fd' },
  ];

  // ── Status display ────────────────────────────────────────────────────────
  const statusColor =
    isConnected === null  ? '#6f787d' :
    isConnected           ? '#22c55e' : '#ef4444';

  const statusLabel =
    isConnected === null  ? 'Verificando...' :
    isConnected           ? 'Conectado a Supabase' : 'Sin conexión';

  const statusIcon =
    isConnected === null  ? <ActivityIndicator color="#6f787d" size="small" /> :
    isConnected           ? <Wifi   color="#22c55e" size={18} /> :
                            <WifiOff color="#ef4444" size={18} />;

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#c4ebe0" size={22} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Sincronización</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={checkConnection}>
          <RefreshCw color="#86d0ef" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#86d0ef" />
        }
      >

        {/* ── Estado de conexión ── */}
        <View style={[s.statusCard, { borderColor: `${statusColor}44` }]}>
          <View style={s.statusLeft}>
            {statusIcon}
            <View>
              <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
              {lastSyncTime && (
                <Text style={s.statusSub}>Última sync: {timeAgo(lastSyncTime)}</Text>
              )}
              {!lastSyncTime && isConnected !== null && (
                <Text style={s.statusSub}>Toca "Subir datos" para sincronizar</Text>
              )}
            </View>
          </View>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
        </View>

        {/* ── Resultado del último sync ── */}
        {lastResult && (
          <View style={[
            s.resultCard,
            { borderColor: lastResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' },
          ]}>
            {lastResult.success
              ? <CheckCircle2 color="#22c55e" size={16} />
              : <XCircle      color="#ef4444" size={16} />}
            <Text style={[s.resultText, { color: lastResult.success ? '#22c55e' : '#ef4444' }]}>
              {lastResult.message}
            </Text>
          </View>
        )}

        {/* ── Pendientes ── */}
        {pendingCount > 0 && (
          <View style={s.pendingBanner}>
            <AlertTriangle color="#f59e0b" size={15} />
            <Text style={s.pendingText}>
              {pendingCount} registro{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de subir
            </Text>
          </View>
        )}

        {/* ── Botones de acción ── */}
        <View style={s.actionRow}>
          {/* Upload */}
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnPrimary, isSyncing && s.actionBtnDisabled]}
            onPress={handleSync}
            disabled={isSyncing}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: spinUpload }] }}>
              <CloudUpload color="#003746" size={22} />
            </Animated.View>
            <View>
              <Text style={s.actionBtnTitle}>
                {isSyncing ? 'Subiendo...' : 'Subir datos'}
              </Text>
              <Text style={s.actionBtnSub}>SQLite → Supabase</Text>
            </View>
          </TouchableOpacity>

          {/* Download */}
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnSecondary, isPulling && s.actionBtnDisabled]}
            onPress={handlePull}
            disabled={isPulling}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: spinDownload }] }}>
              <CloudDownload color="#86d0ef" size={22} />
            </Animated.View>
            <View>
              <Text style={[s.actionBtnTitle, { color: '#86d0ef' }]}>
                {isPulling ? 'Descargando...' : 'Bajar datos'}
              </Text>
              <Text style={s.actionBtnSub}>Supabase → app</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Estado por tabla ── */}
        <Text style={s.sectionTitle}>Datos locales</Text>
        <View style={s.tableGrid}>
          {tableStatuses.map(ts => (
            <View key={ts.name} style={s.tableCard}>
              <View style={[s.tableIcon, { backgroundColor: `${ts.color}15` }]}>
                {ts.icon}
              </View>
              <Text style={s.tableLabel}>{ts.label}</Text>
              <Text style={[s.tableCount, { color: ts.color }]}>{ts.local}</Text>
              <Text style={s.tableCountLabel}>registros</Text>
            </View>
          ))}
        </View>

        {/* ── Info de Supabase ── */}
        <TouchableOpacity style={s.infoCard} onPress={checkConnection} activeOpacity={0.85}>
          <View style={s.infoLeft}>
            <Database color="#86d0ef" size={18} />
            <View>
              <Text style={s.infoTitle}>Base de datos Supabase</Text>
              <Text style={s.infoSub} numberOfLines={1}>
                {process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('https://', '') ?? 'No configurado'}
              </Text>
            </View>
          </View>
          <ChevronRight color="#3f484c" size={16} />
        </TouchableOpacity>

        {/* ── Log de actividad ── */}
        <Text style={s.sectionTitle}>
          Actividad reciente
          {logs.length > 0 && <Text style={s.sectionCount}> · {logs.length}</Text>}
        </Text>

        {logs.length === 0 ? (
          <View style={s.emptyLog}>
            <Clock color="#333b3d" size={28} />
            <Text style={s.emptyLogText}>Sin actividad todavía</Text>
            <Text style={s.emptyLogSub}>Toca "Subir datos" para empezar</Text>
          </View>
        ) : (
          logs.map(log => (
            <View key={log.id} style={s.logCard}>
              <View style={[s.logIcon, {
                backgroundColor:
                  log.type === 'upload'       ? 'rgba(34,197,94,0.1)'   :
                  log.type === 'download'     ? 'rgba(134,208,239,0.1)' :
                  log.type === 'connected'    ? 'rgba(34,197,94,0.1)'   :
                  log.type === 'disconnected' ? 'rgba(239,68,68,0.1)'   :
                  'rgba(245,158,11,0.1)',
              }]}>
                {log.type === 'upload'       && <CloudUpload   color="#22c55e" size={13} />}
                {log.type === 'download'     && <CloudDownload color="#86d0ef" size={13} />}
                {log.type === 'connected'    && <Wifi          color="#22c55e" size={13} />}
                {log.type === 'disconnected' && <WifiOff       color="#ef4444" size={13} />}
                {log.type === 'error'        && <AlertTriangle color="#f59e0b" size={13} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.logMessage}>{log.message}</Text>
                {log.count !== undefined && log.count > 0 && (
                  <Text style={s.logCount}>{log.count} elemento(s)</Text>
                )}
              </View>
              <Text style={s.logTime}>{timeAgo(log.timestamp)}</Text>
            </View>
          ))
        )}

        {/* ── Ayuda ── */}
        <View style={s.helpBox}>
          <Text style={s.helpTitle}>¿No se sincronizan los datos?</Text>
          <Text style={s.helpText}>
            1. Verifica que tu .env tenga{'\n'}
            {'   '}EXPO_PUBLIC_SUPABASE_URL y{'\n'}
            {'   '}EXPO_PUBLIC_SUPABASE_ANON_KEY{'\n\n'}
            2. Reinicia Metro con caché limpio:{'\n'}
            {'   '}npx expo start -c{'\n\n'}
            3. Comprueba que el proyecto Supabase{'\n'}
            {'   '}está activo en supabase.com
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#121212' },

  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:          { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  headerTitle:      { color: '#ecf2f3', fontSize: 18, fontWeight: '800' },
  refreshBtn:       { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },

  scroll:           { paddingHorizontal: 20 },

  statusCard:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
  statusLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLabel:      { fontSize: 14, fontWeight: '800' },
  statusSub:        { color: '#6f787d', fontSize: 11, marginTop: 2 },
  statusDot:        { width: 10, height: 10, borderRadius: 5 },

  resultCard:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1 },
  resultText:       { fontSize: 13, fontWeight: '600', flex: 1 },

  pendingBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  pendingText:      { color: '#f59e0b', fontSize: 13, fontWeight: '700' },

  actionRow:        { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16 },
  actionBtnPrimary: { backgroundColor: '#c4ebe0' },
  actionBtnSecondary:{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'rgba(134,208,239,0.2)' },
  actionBtnDisabled:{ opacity: 0.5 },
  actionBtnTitle:   { color: '#003746', fontSize: 14, fontWeight: '800' },
  actionBtnSub:     { color: '#2a4d46', fontSize: 10, marginTop: 1 },

  sectionTitle:     { color: '#ecf2f3', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  sectionCount:     { color: '#6f787d', fontWeight: '500' },

  tableGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tableCard:        { width: '47%', backgroundColor: '#1a1a1a', borderRadius: 18, padding: 14, alignItems: 'flex-start', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  tableIcon:        { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tableLabel:       { color: '#6f787d', fontSize: 11, fontWeight: '700' },
  tableCount:       { fontSize: 28, fontWeight: '900' },
  tableCountLabel:  { color: '#3f484c', fontSize: 10 },

  infoCard:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: 18, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  infoLeft:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoTitle:        { color: '#ecf2f3', fontSize: 13, fontWeight: '700' },
  infoSub:          { color: '#6f787d', fontSize: 11, marginTop: 2, maxWidth: 220 },

  emptyLog:         { alignItems: 'center', paddingVertical: 36, gap: 8, backgroundColor: '#1a1a1a', borderRadius: 18, marginBottom: 16 },
  emptyLogText:     { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  emptyLogSub:      { color: '#6f787d', fontSize: 12 },

  logCard:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1a1a', borderRadius: 14, padding: 12, marginBottom: 6 },
  logIcon:          { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  logMessage:       { color: '#ecf2f3', fontSize: 12, fontWeight: '600' },
  logCount:         { color: '#6f787d', fontSize: 10, marginTop: 2 },
  logTime:          { color: '#3f484c', fontSize: 10, minWidth: 60, textAlign: 'right' },

  helpBox:          { backgroundColor: 'rgba(0,103,130,0.08)', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: 'rgba(0,103,130,0.15)' },
  helpTitle:        { color: '#86d0ef', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  helpText:         { color: '#6f787d', fontSize: 12, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});