/**
 * DataVerifyScreen.tsx
 *
 * Pantalla de diagnóstico que compara en tiempo real:
 *   • Datos en memoria (AppStore / estado React)
 *   • Datos en SQLite local (dispositivo)
 *   • Datos en Supabase (servidor)
 *
 * Navega a ella desde SyncScreen o Settings.
 * Solo para desarrollo/diagnóstico.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  Database, Cloud, Smartphone, RefreshCw,
} from 'lucide-react-native';
import { useAppStore } from '@/store/AppStore';
import { supabase }    from '@/service/supabaseClient';
import {
  db_getGlucoseEntries,
  db_getPendingSyncItems,
  db_getCurrentUser,
} from '@/service/database';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface LayerCount {
  memory:   number;
  sqlite:   number;
  supabase: number;
  pending:  number;
  match:    boolean;
}

interface VerifyState {
  loading:   boolean;
  glucose:   LayerCount;
  exercise:  LayerCount;
  meals:     LayerCount;
  medication:LayerCount;
  userId:    string | null;
  supabaseOk:boolean;
  lastCheck: Date | null;
}

// ─── ROW COMPONENT ────────────────────────────────────────────────────────────

function DataRow({ label, memory, sqlite, supabase, pending, match }: {
  label: string; memory: number; sqlite: number;
  supabase: number; pending: number; match: boolean;
}) {
  return (
    <View style={[r.row, !match && r.rowMismatch]}>
      <View style={r.labelCol}>
        {match
          ? <CheckCircle2 color="#22c55e" size={14} />
          : <AlertTriangle color="#f59e0b" size={14} />}
        <Text style={r.label}>{label}</Text>
      </View>
      <View style={r.countsRow}>
        <CountBadge icon="📱" value={memory}   color="#86d0ef" tip="Memoria" />
        <CountBadge icon="💾" value={sqlite}   color="#a4f4b7" tip="SQLite"  />
        <CountBadge icon="☁️" value={supabase} color="#c4b5fd" tip="Supabase"/>
        {pending > 0 && (
          <CountBadge icon="⏳" value={pending} color="#f59e0b" tip="Pendiente"/>
        )}
      </View>
    </View>
  );
}

function CountBadge({ icon, value, color, tip }: {
  icon: string; value: number; color: string; tip: string;
}) {
  return (
    <View style={[cb.badge, { borderColor: `${color}44` }]}>
      <Text style={cb.icon}>{icon}</Text>
      <Text style={[cb.val, { color }]}>{value}</Text>
      <Text style={cb.tip}>{tip}</Text>
    </View>
  );
}

const cb = StyleSheet.create({
  badge: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)', minWidth: 56 },
  icon:  { fontSize: 14, marginBottom: 2 },
  val:   { fontSize: 16, fontWeight: '900' },
  tip:   { fontSize: 8, color: '#6f787d', fontWeight: '700', marginTop: 1 },
});

const r = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  rowMismatch:{ borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.04)' },
  labelCol:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label:      { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  countsRow:  { flexDirection: 'row', gap: 6 },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function DataVerifyScreen() {
  const router = useRouter();
  const { glucoseEntries, exerciseEntries, mealEntries, medicationEntries } = useAppStore();

  const [state, setState] = useState<VerifyState>({
    loading: true,
    glucose:    { memory: 0, sqlite: 0, supabase: 0, pending: 0, match: true },
    exercise:   { memory: 0, sqlite: 0, supabase: 0, pending: 0, match: true },
    meals:      { memory: 0, sqlite: 0, supabase: 0, pending: 0, match: true },
    medication: { memory: 0, sqlite: 0, supabase: 0, pending: 0, match: true },
    userId:     null,
    supabaseOk: false,
    lastCheck:  null,
  });

  const verify = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    const user    = db_getCurrentUser();
    const userId  = user?.id ?? null;
    let supabaseOk = false;

    // ── Conteos memoria (AppStore) ─────────────────────────────────────────
    const memG   = glucoseEntries.length;
    const memE   = exerciseEntries.length;
    const memM   = mealEntries.length;
    const memMed = medicationEntries.length;

    // ── Conteos SQLite ─────────────────────────────────────────────────────
    let sqlG = 0, sqlE = 0, sqlM = 0, sqlMed = 0;
    try {
      const { default: SQLite } = await import('expo-sqlite');
      const db = SQLite.openDatabaseSync('serenity.db');
      sqlG   = (db.getFirstSync<{c:number}>('SELECT COUNT(*) as c FROM glucose_entries')?.c    ?? 0);
      sqlE   = (db.getFirstSync<{c:number}>('SELECT COUNT(*) as c FROM exercise_entries')?.c   ?? 0);
      sqlM   = (db.getFirstSync<{c:number}>('SELECT COUNT(*) as c FROM meal_entries')?.c       ?? 0);
      sqlMed = (db.getFirstSync<{c:number}>('SELECT COUNT(*) as c FROM medication_entries')?.c ?? 0);
    } catch (e) {
      console.warn('[Verify] SQLite count error:', e);
    }

    // ── Pendientes en sync_queue ───────────────────────────────────────────
    let pendingTotal = 0;
    try { pendingTotal = db_getPendingSyncItems().length; } catch {}

    // ── Conteos Supabase ───────────────────────────────────────────────────
    let supG = 0, supE = 0, supM = 0, supMed = 0;
    if (userId) {
      try {
        const [rG, rE, rM, rMed] = await Promise.all([
          supabase.from('glucose_entries')    .select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('exercise_entries')   .select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('meal_entries')       .select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('medication_entries') .select('id', { count: 'exact', head: true }).eq('user_id', userId),
        ]);
        if (!rG.error) { supG   = rG.count   ?? 0; supabaseOk = true; }
        if (!rE.error)   supE   = rE.count   ?? 0;
        if (!rM.error)   supM   = rM.count   ?? 0;
        if (!rMed.error) supMed = rMed.count ?? 0;
      } catch (e) {
        console.warn('[Verify] Supabase count error:', e);
      }
    }

    setState({
      loading: false,
      supabaseOk,
      userId,
      lastCheck: new Date(),
      glucose:    { memory: memG,   sqlite: sqlG,   supabase: supG,   pending: pendingTotal, match: sqlG   === supG   },
      exercise:   { memory: memE,   sqlite: sqlE,   supabase: supE,   pending: 0,            match: sqlE   === supE   },
      meals:      { memory: memM,   sqlite: sqlM,   supabase: supM,   pending: 0,            match: sqlM   === supM   },
      medication: { memory: memMed, sqlite: sqlMed, supabase: supMed, pending: 0,            match: sqlMed === supMed },
    });
  }, [glucoseEntries, exerciseEntries, mealEntries, medicationEntries]);

  useEffect(() => { verify(); }, []);

  const allMatch =
    state.glucose.match && state.exercise.match &&
    state.meals.match   && state.medication.match;

  const totalPending = state.glucose.pending;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#c4ebe0" size={22} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Verificar Datos</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={verify} disabled={state.loading}>
          {state.loading
            ? <ActivityIndicator color="#86d0ef" size="small" />
            : <RefreshCw color="#86d0ef" size={18} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={state.loading} onRefresh={verify} tintColor="#86d0ef" />}
      >
        {/* ── Estado general ── */}
        <View style={[
          s.statusCard,
          { borderColor: allMatch ? 'rgba(34,197,94,0.35)' : 'rgba(245,158,11,0.35)' }
        ]}>
          <View style={s.statusLeft}>
            {allMatch
              ? <CheckCircle2 color="#22c55e" size={22} />
              : <AlertTriangle color="#f59e0b" size={22} />}
            <View>
              <Text style={[s.statusTitle, { color: allMatch ? '#22c55e' : '#f59e0b' }]}>
                {allMatch ? 'Datos sincronizados ✓' : 'Diferencias detectadas'}
              </Text>
              <Text style={s.statusSub}>
                {state.lastCheck
                  ? `Verificado: ${state.lastCheck.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Verificando...'}
              </Text>
            </View>
          </View>
          {totalPending > 0 && (
            <View style={s.pendingBadge}>
              <Text style={s.pendingBadgeText}>{totalPending} pendiente{totalPending !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        {/* ── Supabase status ── */}
        <View style={[s.supaCard, { borderColor: state.supabaseOk ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }]}>
          <View style={s.supaLeft}>
            <Cloud color={state.supabaseOk ? '#22c55e' : '#ef4444'} size={18} />
            <View>
              <Text style={s.supaTitle}>Supabase</Text>
              <Text style={s.supaSub}>
                {state.supabaseOk
                  ? `Conectado · User ID: ${state.userId?.slice(0,8)}...`
                  : state.userId
                    ? 'Sin conexión o RLS bloqueando'
                    : 'Usuario no logueado — inicia sesión primero'}
              </Text>
            </View>
          </View>
          <View style={[s.supaDot, { backgroundColor: state.supabaseOk ? '#22c55e' : '#ef4444' }]} />
        </View>

        {/* ── Leyenda ── */}
        <View style={s.legend}>
          {[
            { icon: '📱', label: 'Memoria (React)',  color: '#86d0ef' },
            { icon: '💾', label: 'SQLite local',     color: '#a4f4b7' },
            { icon: '☁️', label: 'Supabase',         color: '#c4b5fd' },
            { icon: '⏳', label: 'En cola (sync)',   color: '#f59e0b' },
          ].map(({ icon, label, color }) => (
            <View key={label} style={s.legendItem}>
              <Text style={s.legendIcon}>{icon}</Text>
              <Text style={[s.legendLabel, { color }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Tabla de comparación ── */}
        <Text style={s.sectionTitle}>Conteo por tabla</Text>

        {state.loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color="#86d0ef" size="large" />
            <Text style={s.loadingText}>Consultando las 3 fuentes...</Text>
          </View>
        ) : (
          <>
            <DataRow label="Glucosa"    {...state.glucose}    />
            <DataRow label="Ejercicio"  {...state.exercise}   />
            <DataRow label="Comidas"    {...state.meals}       />
            <DataRow label="Medicación" {...state.medication}  />
          </>
        )}

        {/* ── Diagnóstico ── */}
        {!state.loading && (
          <View style={s.diagBox}>
            <Text style={s.diagTitle}>Diagnóstico</Text>

            {!state.supabaseOk && !state.userId && (
              <DiagRow icon="🔐" color="#ef4444"
                text="No hay usuario logueado. Inicia sesión para ver datos en Supabase." />
            )}
            {!state.supabaseOk && state.userId && (
              <DiagRow icon="🌐" color="#ef4444"
                text="No se pudo conectar a Supabase. Verifica EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env y reinicia Metro con: npx expo start -c" />
            )}
            {state.supabaseOk && !allMatch && (
              <DiagRow icon="⚠️" color="#f59e0b"
                text="SQLite y Supabase tienen conteos distintos. Los registros más nuevos están en cola. Ve a SyncScreen → 'Subir datos' para sincronizar." />
            )}
            {state.supabaseOk && allMatch && totalPending === 0 && (
              <DiagRow icon="✅" color="#22c55e"
                text="Todo está sincronizado. Los datos del dispositivo coinciden con Supabase." />
            )}
            {totalPending > 0 && (
              <DiagRow icon="⏳" color="#f59e0b"
                text={`${totalPending} registro(s) en sync_queue pendientes de subir. Activa el wifi y ve a Sincronización.`} />
            )}
            {state.glucose.memory > state.glucose.sqlite && (
              <DiagRow icon="💡" color="#86d0ef"
                text="La memoria tiene más entradas que SQLite. Los datos de muestra (seed) no se persisten en disco — solo los que guardas tú." />
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DiagRow({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <View style={[diag.row, { borderLeftColor: color }]}>
      <Text style={diag.icon}>{icon}</Text>
      <Text style={diag.text}>{text}</Text>
    </View>
  );
}

const diag = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, marginBottom: 8 },
  icon: { fontSize: 14, marginTop: 1 },
  text: { flex: 1, color: '#bfc8cd', fontSize: 12, lineHeight: 19 },
});

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#121212' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:      { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  headerTitle:  { color: '#ecf2f3', fontSize: 18, fontWeight: '800' },
  refreshBtn:   { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  scroll:       { paddingHorizontal: 20 },

  statusCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1.5 },
  statusLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusTitle:  { fontSize: 15, fontWeight: '800' },
  statusSub:    { color: '#6f787d', fontSize: 11, marginTop: 2 },
  pendingBadge: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  pendingBadgeText:{ color: '#f59e0b', fontSize: 11, fontWeight: '800' },

  supaCard:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1 },
  supaLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  supaTitle:    { color: '#ecf2f3', fontSize: 13, fontWeight: '700' },
  supaSub:      { color: '#6f787d', fontSize: 11, marginTop: 1, maxWidth: 260 },
  supaDot:      { width: 10, height: 10, borderRadius: 5 },

  legend:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18, backgroundColor: '#1a1a1a', borderRadius: 14, padding: 12 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendIcon:   { fontSize: 13 },
  legendLabel:  { fontSize: 10, fontWeight: '700' },

  sectionTitle: { color: '#ecf2f3', fontSize: 16, fontWeight: '800', marginBottom: 12 },

  loadingBox:   { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText:  { color: '#6f787d', fontSize: 13 },

  diagBox:      { backgroundColor: '#1a1a1a', borderRadius: 18, padding: 16, marginTop: 8 },
  diagTitle:    { color: '#ecf2f3', fontSize: 14, fontWeight: '800', marginBottom: 12 },
});