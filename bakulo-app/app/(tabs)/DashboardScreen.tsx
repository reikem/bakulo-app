/**
 * DashboardScreen.tsx — v3
 * • Muestra nombre del usuario logueado (desde SQLite)
 * • Botón "Registrar Ejercicio" → log-exercise
 * • Botón "Repositorio" → RepositoryScreen
 * • Botón "Ver Historial" (con documentos incluidos)
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, SafeAreaView,
} from 'react-native';
import {
  PlusCircle, ShieldCheck, Target, Utensils,
  Droplets, ChevronRight, History, FileText,
  Settings, Syringe, Lightbulb, Dumbbell, FolderOpen,
  ShieldAlert,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BloodSugarChart } from '@/components/ui/BloodSugarChart';
import { CriticalAlert } from '@/components/ui/CriticalAlert';
import { useGlucose } from '@/store/GlucoseStore';
import { getGlucoseRange } from '@/store/AppStore';
import { db_getCurrentUser, AppUser } from '@/service/database';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [showAlert, setShowAlert] = useState(false);
  const [user,      setUser]      = useState<AppUser | null>(null);
  const router = useRouter();
  const { latestEntry, entries } = useGlucose();

  useEffect(() => {
    setUser(db_getCurrentUser());
  }, []);

  const currentValue = latestEntry?.value ?? 108;
  const range = getGlucoseRange(currentValue);

  const todayEntries = entries.filter(e => {
    const now = new Date();
    const d   = e.timestamp;
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth()    === now.getMonth()    &&
           d.getDate()     === now.getDate();
  });
  const inRange = todayEntries.filter(e => e.value >= 70 && e.value <= 140).length;
  const timeInRangePct = todayEntries.length > 0
    ? Math.round((inRange / todayEntries.length) * 100)
    : 92;

  const lastTime = latestEntry
    ? latestEntry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Greeting ── */}
        {user && (
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingText}>{greeting()},</Text>
              <Text style={styles.greetingName}>{user.displayName} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/NotificationsScreen')}
            >
              <Text style={styles.notifIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Hero Section ── */}
        <View style={styles.heroLayout}>
          <View style={styles.mainGlucoseCard}>
            <View>
              <Text style={styles.label}>GLUCOSA ACTUAL</Text>
              <View style={styles.glucoseRow}>
                <Text style={[styles.glucoseValue, { color: range.color }]}>{currentValue}</Text>
                <Text style={styles.glucoseUnit}>mg/dL</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: range.darkBg }]}>
                <Droplets color={range.color} size={14} fill={range.color} />
                <Text style={[styles.statusText, { color: range.color }]}>{range.label}</Text>
              </View>
              {lastTime && (
                <Text style={styles.lastTimeText}>
                  Último registro · {lastTime}
                  {latestEntry?.deviceName ? ` · ${latestEntry.deviceName}` : ''}
                </Text>
              )}
            </View>

            <View style={styles.logButtonsContainer}>
              <TouchableOpacity
                style={styles.logButton}
                activeOpacity={0.8}
                onPress={() => router.push('/LogGlucoseScreen')}
              >
                <PlusCircle color="#fff" size={18} />
                <Text style={styles.logButtonText}>Registrar Glucosa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logButton, styles.medicationBtn]}
                activeOpacity={0.8}
                onPress={() => router.push('/log-medication')}
              >
                <Syringe color="#9beaae" size={18} />
                <Text style={[styles.logButtonText, { color: '#9beaae' }]}>Registrar Meds</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsColumn}>
            <View style={[styles.miniCard, { backgroundColor: '#c4ebe0' }]}>
              <View style={styles.miniCardHeader}>
                <Text style={styles.miniCardTitle}>Tiempo en Rango</Text>
                <ShieldCheck color="#2a4d46" size={16} />
              </View>
              <Text style={styles.miniCardValue}>{timeInRangePct}%</Text>
              <Text style={styles.miniCardSub}>Hoy</Text>
            </View>
            <TouchableOpacity
              style={styles.miniCardDark}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/DailyTasksScreen')}
            >
              <View style={styles.miniCardHeader}>
                <Text style={[styles.miniCardTitle, { color: '#86d0ef' }]}>Meta Diaria</Text>
                <Target color="#86d0ef" size={16} />
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (todayEntries.length / 8) * 100)}%` }]} />
              </View>
              <Text style={styles.miniCardSub}>{todayEntries.length}/8 registros</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CriticalAlert visible={showAlert} onDismiss={() => setShowAlert(false)} glucoseValue={55} />

        {/* ── Insight card ── */}
        <TouchableOpacity
          style={styles.insightHighlightCard}
          onPress={() => router.push('/(tabs)/InsightsScreen')}
          activeOpacity={0.9}
        >
          <View style={styles.insightContent}>
            <View style={styles.insightIconWrapper}>
              <Lightbulb color="#004e63" size={24} fill="#004e63" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTag}>NUEVO CONSEJO</Text>
              <Text style={styles.insightTitle}>Recomendación Diaria</Text>
              <Text style={styles.insightDesc}>
                Descubre cómo una caminata de 10 min mejora tu estabilidad glucémica.
              </Text>
            </View>
            <ChevronRight color="#c4ebe0" size={20} />
          </View>
        </TouchableOpacity>

        {/* ── Gráfico ── */}
        <BloodSugarChart />

        {/* ── Acciones rápidas ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
        </View>

        <View style={styles.quickGrid}>
          <QuickAction
            icon={<History color="#86d0ef" size={24} />}
            label="Historial"
            onPress={() => router.push('/history')}
          />
          <QuickAction
            icon={<FileText color="#86d0ef" size={24} />}
            label="Reportes"
            onPress={() => router.push('/reports')}
          />
          <QuickAction
            icon={<Utensils color="#86d0ef" size={24} />}
            label="Alimentos"
            onPress={() => router.push('/FoodLogScreen')}
          />
          <QuickAction
            icon={<Settings color="#86d0ef" size={24} />}
            label="Ajustes"
            onPress={() => router.push('/(tabs)/settings')}
          />
        </View>

        {/* ── Nuevos botones destacados ── */}
        <View style={styles.featuredRow}>
          {/* Ejercicio */}
          <TouchableOpacity
            style={[styles.featuredCard, { backgroundColor: 'rgba(164,244,183,0.08)', borderColor: 'rgba(164,244,183,0.2)' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/log-exercise')}
          >
            <View style={[styles.featuredIcon, { backgroundColor: 'rgba(164,244,183,0.12)' }]}>
              <Dumbbell color="#a4f4b7" size={28} />
            </View>
            <Text style={[styles.featuredLabel, { color: '#a4f4b7' }]}>Registrar{'\n'}Ejercicio</Text>
            <ChevronRight color="#a4f4b7" size={18} style={styles.featuredArrow} />
          </TouchableOpacity>

          {/* Repositorio */}
          <TouchableOpacity
            style={[styles.featuredCard, { backgroundColor: 'rgba(134,208,239,0.08)', borderColor: 'rgba(134,208,239,0.2)' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/RepositoryScreen')}
          >
            <View style={[styles.featuredIcon, { backgroundColor: 'rgba(134,208,239,0.12)' }]}>
              <FolderOpen color="#86d0ef" size={28} />
            </View>
            <Text style={[styles.featuredLabel, { color: '#86d0ef' }]}>Mi{'\n'}Repositorio</Text>
            <ChevronRight color="#86d0ef" size={18} style={styles.featuredArrow} />
          </TouchableOpacity>
        </View>

        {/* ── Botón SOS Emergencia ── */}
        <TouchableOpacity
          style={styles.sosCard}
          activeOpacity={0.85}
          onPress={() => router.push('/EmergencySOSScreen')}
        >
          <View style={styles.sosIconWrap}>
            <ShieldAlert color="white" size={28} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>Emergencia SOS</Text>
            <Text style={styles.sosSub}>
              Alerta a tus contactos con ubicación y glucosa en tiempo real
            </Text>
          </View>
          <ChevronRight color="#fda4af" size={18} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const QuickAction = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.quickIconWrapper}>{icon}</View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#121212' },
  scrollContent:  { padding: 20, paddingBottom: 100 },

  greetingRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingText:   { color: '#6f787d', fontSize: 14, fontWeight: '500' },
  greetingName:   { color: '#ecf2f3', fontSize: 22, fontWeight: '800', marginTop: 2 },
  notifBtn:       { width: 42, height: 42, backgroundColor: '#1a1a1a', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  notifIcon:      { fontSize: 20 },

  heroLayout:     { flexDirection: 'row', gap: 12, marginBottom: 20 },
  mainGlucoseCard:{ flex: 1.2, backgroundColor: '#1a1a1a', borderRadius: 32, padding: 20, minHeight: 260, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statsColumn:    { flex: 0.8, gap: 12 },

  label:          { color: '#42655d', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  glucoseRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  glucoseValue:   { fontSize: 44, fontWeight: '800' },
  glucoseUnit:    { color: '#6f787d', fontSize: 14, fontWeight: '600' },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText:     { fontSize: 12, fontWeight: '700' },
  lastTimeText:   { color: '#6f787d', fontSize: 9, marginTop: 4, letterSpacing: 0.3 },

  logButtonsContainer:{ gap: 8, marginTop: 16 },
  logButton:      { backgroundColor: '#004e63', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 100, gap: 8 },
  medicationBtn:  { backgroundColor: 'rgba(26,108,60,0.15)', borderWidth: 1, borderColor: 'rgba(155,234,174,0.2)' },
  logButtonText:  { color: '#fff', fontSize: 13, fontWeight: '700' },

  miniCard:       { flex: 1, borderRadius: 24, padding: 16, justifyContent: 'space-between' },
  miniCardDark:   { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 24, padding: 16, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  miniCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniCardTitle:  { color: '#2a4d46', fontSize: 11, fontWeight: '700' },
  miniCardValue:  { color: '#00201b', fontSize: 24, fontWeight: '800' },
  miniCardSub:    { color: '#6f787d', fontSize: 10, fontWeight: '500' },
  progressContainer:{ height: 6, backgroundColor: '#333b3d', borderRadius: 10, marginTop: 12 },
  progressFill:   { height: '100%', backgroundColor: '#005229', borderRadius: 10 },

  insightHighlightCard:{ backgroundColor: 'rgba(0,78,99,0.2)', borderRadius: 24, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(196,235,224,0.1)' },
  insightContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  insightIconWrapper:{ width: 48, height: 48, backgroundColor: '#c4ebe0', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  insightTag:     { color: '#89d89d', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  insightTitle:   { color: '#c4ebe0', fontSize: 15, fontWeight: '700' },
  insightDesc:    { color: '#6f787d', fontSize: 12, marginTop: 2 },

  sectionHeader:  { marginTop: 8, marginBottom: 16 },
  sectionTitle:   { color: '#86d0ef', fontSize: 20, fontWeight: '800' },
  quickGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickItem:      { width: (width - 52) / 2, aspectRatio: 1.1, backgroundColor: '#1a1a1a', borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quickIconWrapper:{ width: 50, height: 50, backgroundColor: 'rgba(134,208,239,0.05)', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  quickLabel:     { color: '#ecf2f3', fontSize: 13, fontWeight: '600' },

  featuredRow:    { flexDirection: 'row', gap: 12, marginTop: 20 },
  featuredCard:   { flex: 1, borderRadius: 24, borderWidth: 1, padding: 18, gap: 10 },
  featuredIcon:   { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  featuredLabel:  { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  featuredArrow:  { alignSelf: 'flex-end', marginTop: 4 },

  sosCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(186,26,26,0.12)', borderRadius: 24, padding: 18, marginTop: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  sosIconWrap:    { width: 52, height: 52, borderRadius: 16, backgroundColor: '#ba1a1a', alignItems: 'center', justifyContent: 'center' },
  sosTitle:       { color: '#fda4af', fontSize: 16, fontWeight: '800', marginBottom: 3 },
  sosSub:         { color: '#6f787d', fontSize: 11, lineHeight: 16 },
});