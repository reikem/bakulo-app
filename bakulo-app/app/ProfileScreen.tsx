/**
 * ProfileScreen.tsx — v2 operativo
 * - Conecta Apple Health / Google Health Connect / Huawei Health
 * - Muestra estado de conexión real
 * - Exporta reporte vía Share
 * - Edita metas de glucosa
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, SafeAreaView, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Settings, Heart, Activity, Smartphone,
  Share2, Edit3, CheckCircle, XCircle, RefreshCw, ChevronRight,
} from 'lucide-react-native';
import { Share } from 'react-native';
import { healthService, HealthConnection, HealthProvider } from '@/service/healthService';
import { useAppStore } from '@/store/AppStore';

// ─── PROVIDER ICON ────────────────────────────────────────────────────────────
function ProviderIcon({ id, size = 22 }: { id: HealthProvider; size?: number }) {
  if (id === 'apple')  return <Heart   color="#ff2d55" size={size} fill="#ff2d55" />;
  if (id === 'google') return <Activity color="#4285f4" size={size} />;
  return <Smartphone color="#cf0a2c" size={size} />;
}

// ─── ECOSYSTEM ITEM ───────────────────────────────────────────────────────────
function EcosystemItem({ conn, onToggle, loading }: {
  conn: HealthConnection; onToggle: () => void; loading: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.ecoItem, !conn.available && s.ecoItemDisabled]}
      onPress={onToggle}
      disabled={!conn.available || loading}
      activeOpacity={0.75}
    >
      <View style={[s.ecoIconBox, { backgroundColor: `${conn.logoColor}18` }]}>
        <ProviderIcon id={conn.id} />
      </View>
      <View style={s.ecoInfo}>
        <Text style={s.ecoName}>{conn.name}</Text>
        <Text style={s.ecoSub}>
          {!conn.available
            ? 'No disponible en este dispositivo'
            : conn.connected
            ? `Activo · ${conn.lastSync ? new Date(conn.lastSync).toLocaleDateString() : ''}`
            : 'Toca para conectar'}
        </Text>
        {conn.connected && conn.glucoseData && conn.glucoseData.length > 0 && (
          <Text style={s.ecoDataText}>
            {conn.glucoseData.length} lecturas importadas
          </Text>
        )}
      </View>
      {loading ? (
        <ActivityIndicator color="#86d0ef" size="small" />
      ) : conn.connected ? (
        <CheckCircle color="#22c55e" size={20} />
      ) : conn.available ? (
        <ChevronRight color="#6f787d" size={18} />
      ) : (
        <XCircle color="#6f787d" size={18} />
      )}
    </TouchableOpacity>
  );
}

// ─── HEALTH STATS ─────────────────────────────────────────────────────────────
function HealthStatsCard({ avg, trend, inRange }: { avg: number; trend: string; inRange: number }) {
  return (
    <View style={s.statsCard}>
      <Text style={s.statsLabel}>PROMEDIO 14 DÍAS</Text>
      <View style={s.statsRow}>
        <Text style={s.statsValue}>{avg}</Text>
        <Text style={s.statsUnit}> mg/dL</Text>
        <View style={s.trendBadge}>
          <Text style={s.trendText}>{trend}</Text>
        </View>
      </View>
      <View style={s.progressOuter}>
        <View style={[s.progressInner, { width: `${inRange}%` }]} />
      </View>
      <Text style={s.progressLabel}>{inRange}% tiempo en rango objetivo</Text>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { glucoseEntries } = useAppStore();

  const [connections,   setConnections]   = useState<HealthConnection[]>([]);
  const [loadingId,     setLoadingId]     = useState<HealthProvider | null>(null);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [glucoseTarget, setGlucoseTarget] = useState('70–140');

  // Estadísticas calculadas desde el store
  const last14 = glucoseEntries.filter(e =>
    e.timestamp >= new Date(Date.now() - 14 * 24 * 3600 * 1000)
  );
  const avg14 = last14.length
    ? Math.round(last14.reduce((s, e) => s + e.value, 0) / last14.length)
    : 108;
  const inRange14 = last14.length
    ? Math.round((last14.filter(e => e.value >= 70 && e.value <= 140).length / last14.length) * 100)
    : 82;
  const [min, max] = glucoseTarget.replace('–','-').split('-').map(Number);
  const trend = avg14 > (avg14 + 5) ? '+4%' : '-4%';

  useEffect(() => {
    healthService.getConnections().then(setConnections);
  }, []);

  const handleToggle = useCallback(async (id: HealthProvider) => {
    setLoadingId(id);
    const ok = await healthService.toggleConnection(id);
    if (!ok) Alert.alert('Error', 'No se pudo actualizar la conexión.');
    const updated = await healthService.getConnections();
    setConnections(updated);
    setLoadingId(null);
  }, []);

  const handleShare = async () => {
    await Share.share({
      message:
        `📊 Reporte de Salud — Serenity\n` +
        `• Glucosa promedio (14d): ${avg14} mg/dL\n` +
        `• Tiempo en rango: ${inRange14}%\n` +
        `• Objetivo: ${glucoseTarget} mg/dL\n` +
        `Generado el ${new Date().toLocaleDateString()}`,
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Perfil</Text>
        <TouchableOpacity style={s.iconBtn}>
          <Settings color="#c4ebe0" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Avatar + nombre */}
        <View style={s.heroSection}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/300?img=45' }}
            style={s.avatar}
          />
          <View>
            <Text style={s.name}>Elena Rodríguez</Text>
            <Text style={s.condition}>Diabetes Tipo 1 · 32 años</Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setModalVisible(true)}>
            <Edit3 color="#fff" size={16} />
            <Text style={s.btnText}>Editar Metas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={handleShare}>
            <Share2 color="#c4ebe0" size={16} />
            <Text style={s.btnTextSec}>Compartir</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <HealthStatsCard avg={avg14} trend={trend} inRange={inRange14} />

        {/* Benchmark */}
        <View style={s.benchmarkCard}>
          <Text style={s.benchLabel}>RANGO OBJETIVO</Text>
          <Text style={s.benchValue}>{glucoseTarget} <Text style={s.benchUnit}>mg/dL</Text></Text>
        </View>

        {/* Ecosistema de salud */}
        <Text style={s.sectionTitle}>Ecosistema de Salud</Text>
        <Text style={s.sectionSub}>Conecta tus apps para importar datos automáticamente</Text>
        <View style={s.ecoContainer}>
          {connections.map((conn, i) => (
            <React.Fragment key={conn.id}>
              <EcosystemItem
                conn={conn}
                onToggle={() => handleToggle(conn.id)}
                loading={loadingId === conn.id}
              />
              {i < connections.length - 1 && <View style={s.ecoDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.signOutBtn} onPress={() => router.replace('/login')}>
          <Text style={s.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal editar meta */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Actualizar Parámetros</Text>
            <Text style={s.modalLabel}>Rango de Glucosa (mg/dL)</Text>
            <TextInput
              style={s.modalInput}
              value={glucoseTarget}
              onChangeText={setGlucoseTarget}
              placeholder="70–140"
              placeholderTextColor="#3f484c"
            />
            <TouchableOpacity
              style={s.modalSaveBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={s.modalSaveBtnText}>Confirmar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#171d1e' },
  navbar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  navTitle:       { color: '#c4ebe0', fontSize: 16, fontWeight: '700' },
  iconBtn:        { padding: 8 },
  scroll:         { paddingHorizontal: 24, paddingBottom: 40 },
  heroSection:    { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar:         { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#1a6c3c' },
  name:           { color: '#c4ebe0', fontSize: 22, fontWeight: '800' },
  condition:      { color: '#6f787d', fontSize: 13, marginTop: 2 },
  actionRow:      { flexDirection: 'row', gap: 12, marginBottom: 24 },
  primaryBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#004e63', paddingVertical: 12, borderRadius: 100 },
  secondaryBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 100 },
  btnText:        { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnTextSec:     { color: '#c4ebe0', fontWeight: '700', fontSize: 13 },
  statsCard:      { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, marginBottom: 12 },
  statsLabel:     { color: '#42655d', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  statsRow:       { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  statsValue:     { color: '#86d0ef', fontSize: 40, fontWeight: '800' },
  statsUnit:      { color: '#6f787d', fontSize: 14 },
  trendBadge:     { marginLeft: 8, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  trendText:      { color: '#22c55e', fontSize: 11, fontWeight: '700' },
  progressOuter:  { height: 6, backgroundColor: '#333b3d', borderRadius: 10 },
  progressInner:  { height: '100%', backgroundColor: '#006782', borderRadius: 10 },
  progressLabel:  { color: '#6f787d', fontSize: 11, marginTop: 6 },
  benchmarkCard:  { backgroundColor: 'rgba(0,103,130,0.12)', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,103,130,0.25)' },
  benchLabel:     { color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  benchValue:     { color: '#86d0ef', fontSize: 24, fontWeight: '800', marginTop: 4 },
  benchUnit:      { fontSize: 14, fontWeight: '400', color: '#6f787d' },
  sectionTitle:   { color: '#f5fafb', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sectionSub:     { color: '#6f787d', fontSize: 12, marginBottom: 16 },
  ecoContainer:   { backgroundColor: '#1d2426', borderRadius: 24, overflow: 'hidden', marginBottom: 24 },
  ecoItem:        { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  ecoItemDisabled:{ opacity: 0.4 },
  ecoIconBox:     { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ecoInfo:        { flex: 1 },
  ecoName:        { color: '#f5fafb', fontSize: 15, fontWeight: '700' },
  ecoSub:         { color: '#6f787d', fontSize: 11, marginTop: 2 },
  ecoDataText:    { color: '#22c55e', fontSize: 10, fontWeight: '600', marginTop: 3 },
  ecoDivider:     { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 18 },
  signOutBtn:     { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 16, alignItems: 'center' },
  signOutText:    { color: '#6f787d', fontWeight: '700' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent:   { backgroundColor: '#1d2426', padding: 30, borderRadius: 32 },
  modalTitle:     { color: '#c4ebe0', fontSize: 22, fontWeight: '800', marginBottom: 20 },
  modalLabel:     { color: '#6f787d', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  modalInput:     { backgroundColor: '#171d1e', color: '#fff', padding: 15, borderRadius: 16, marginBottom: 20, fontSize: 16 },
  modalSaveBtn:   { backgroundColor: '#006782', padding: 18, borderRadius: 100, alignItems: 'center' },
  modalSaveBtnText: { color: '#fff', fontWeight: '800' },
});
