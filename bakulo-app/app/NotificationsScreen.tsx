/**
 * NotificationsScreen.tsx — v2
 * Lee notificaciones reales del AppStore.
 * Permite configurar umbrales de alerta y activar/desactivar.
 * Marca como leída al tocar. Muestra badge de no leídas.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft, Settings, TrendingUp, TrendingDown, Utensils,
  CheckCheck, Bell, BellOff, AlertTriangle, Info, Zap,
} from 'lucide-react-native';
import { AlertCard, ReminderItem } from '@/components/ui/NotificationComponents';
import { NotificationEntry, useAppStore } from '@/store/AppStore';
import { requestNotificationPermissions } from '@/utils/notificationUtils';


// ─── Colores por tipo ─────────────────────────────────────────────────────────
function notifStyle(type: NotificationEntry['type']): { color: string; bg: string; icon: React.ReactNode } {
  switch (type) {
    case 'alert_high': return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <TrendingUp  color="#ef4444" size={20} /> };
    case 'alert_low':  return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <TrendingDown color="#f59e0b" size={20} /> };
    case 'reminder':   return { color: '#86d0ef', bg: 'rgba(134,208,239,0.12)', icon: <Bell        color="#86d0ef" size={20} /> };
    case 'success':    return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: <Zap         color="#22c55e" size={20} /> };
    default:           return { color: '#6f787d', bg: 'rgba(111,120,125,0.12)', icon: <Info        color="#6f787d" size={20} /> };
  }
}

function timeAgo(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)   return 'Ahora';
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

// ─── Item de notificación ─────────────────────────────────────────────────────
function NotifItem({ n, onPress }: { n: NotificationEntry; onPress: () => void }) {
  const { color, bg, icon } = notifStyle(n.type);
  return (
    <TouchableOpacity
      style={[s.notifCard, !n.read && s.notifCardUnread, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[s.notifIcon, { backgroundColor: bg }]}>{icon}</View>
      <View style={s.notifContent}>
        <View style={s.notifTop}>
          <Text style={s.notifTitle} numberOfLines={1}>{n.title}</Text>
          <Text style={s.notifTime}>{timeAgo(n.timestamp)}</Text>
        </View>
        <Text style={s.notifBody} numberOfLines={2}>{n.body}</Text>
      </View>
      {!n.read && <View style={s.unreadDot} />}
    </TouchableOpacity>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications, unreadCount, markNotificationRead, markAllRead,
    thresholds, updateThresholds,
  } = useAppStore();

  const [tab, setTab] = useState<'inbox'|'settings'>('inbox');

  const handlePermissions = async () => {
    const ok = await requestNotificationPermissions();
    if (!ok) alert('Activa las notificaciones en Configuración del sistema.');
  };

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.safeHeader}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft color="#c4ebe0" size={24} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Clinical Serenity</Text>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/med/men/7.jpg' }}
            style={s.avatar}
          />
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, tab === 'inbox' && s.tabActive]}
            onPress={() => setTab('inbox')}
          >
            <Bell color={tab === 'inbox' ? '#fff' : '#6f787d'} size={15} />
            <Text style={[s.tabText, tab === 'inbox' && s.tabTextActive]}>
              Bandeja
              {unreadCount > 0 && <Text style={s.badge}> {unreadCount}</Text>}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === 'settings' && s.tabActive]}
            onPress={() => setTab('settings')}
          >
            <Settings color={tab === 'settings' ? '#fff' : '#6f787d'} size={15} />
            <Text style={[s.tabText, tab === 'settings' && s.tabTextActive]}>Configurar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── TAB BANDEJA ── */}
        {tab === 'inbox' && (
          <>
            <View style={s.inboxHeader}>
              <View>
                <Text style={s.mainTitle}>Notificaciones</Text>
                <Text style={s.subTitle}>{unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}</Text>
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
                  <CheckCheck color="#c4ebe0" size={15} />
                  <Text style={s.markAllText}>Leer todo</Text>
                </TouchableOpacity>
              )}
            </View>

            {notifications.length === 0 && (
              <View style={s.emptyBox}>
                <BellOff color="#333b3d" size={32} />
                <Text style={s.emptyText}>Sin notificaciones</Text>
              </View>
            )}

            {notifications.map(n => (
              <NotifItem
                key={n.id}
                n={n}
                onPress={() => markNotificationRead(n.id)}
              />
            ))}
          </>
        )}

        {/* ── TAB CONFIGURACIÓN ── */}
        {tab === 'settings' && (
          <>
            <Text style={s.mainTitle}>Configurar Alertas</Text>
            <Text style={s.subTitle}>Personaliza tus umbrales y recordatorios.</Text>

            {/* Alertas de glucosa */}
            <View style={s.section}>
              <AlertCard
                icon={<TrendingUp color="#ef4444" size={28} />}
                title="Glucosa Alta"
                desc="Notifica cuando supera el umbral"
                threshold={thresholds.highGlucose}
                unit="mg/dL"
                isEnabled={thresholds.highEnabled}
                onToggle={(v: boolean) => updateThresholds({ highEnabled: v })}
                iconBg="rgba(239,68,68,0.1)"
              />
              <AlertCard
                icon={<TrendingDown color="#f59e0b" size={28} />}
                title="Glucosa Baja"
                desc="Alerta urgente de hipoglucemia"
                threshold={thresholds.lowGlucose}
                unit="mg/dL"
                isEnabled={thresholds.lowEnabled}
                onToggle={(v: boolean) => updateThresholds({ lowEnabled: v })}
                iconBg="rgba(245,158,11,0.1)"
              />
            </View>

            {/* Recordatorios */}
            <View style={s.section}>
              <ReminderItem
                icon={<Utensils color="#a4f4b7" size={24} />}
                title="Recordatorio de Comidas"
                tags={['1h después', '2h después']}
                isEnabled={thresholds.mealReminders}
                onToggle={(v: boolean) => updateThresholds({ mealReminders: v })}
                iconBg="rgba(26,108,60,0.2)"
              />
              <ReminderItem
                icon={<AlertTriangle color="#c4b5fd" size={24} />}
                title="Recordatorio de Medicación"
                subText="Aviso cuando llegue la hora de tu dosis"
                isEnabled={thresholds.medReminders}
                onToggle={(v: boolean) => updateThresholds({ medReminders: v })}
                iconBg="rgba(196,181,253,0.15)"
              />
            </View>

            {/* Permisos del sistema */}
            <TouchableOpacity style={s.permBtn} onPress={handlePermissions}>
              <Bell color="#006782" size={18} />
              <Text style={s.permBtnText}>Activar notificaciones del sistema</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.saveButton} onPress={() => setTab('inbox')}>
              <Text style={s.saveButtonText}>Guardar Preferencias</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#171d1e' },
  safeHeader:     { backgroundColor: '#171d1e' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  headerTitle:    { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  backBtn:        { padding: 5 },
  avatar:         { width: 34, height: 34, borderRadius: 17 },
  tabRow:         { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  tab:            { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)' },
  tabActive:      { backgroundColor: '#006782' },
  tabText:        { color: '#6f787d', fontSize: 13, fontWeight: '700' },
  tabTextActive:  { color: '#fff' },
  badge:          { color: '#fbbf24', fontWeight: '800' },
  scroll:         { paddingHorizontal: 22, paddingTop: 20 },
  inboxHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  mainTitle:      { color: '#baeaff', fontSize: 28, fontWeight: '800' },
  subTitle:       { color: '#6f787d', fontSize: 13, marginTop: 4, marginBottom: 20 },
  markAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(196,235,224,0.08)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100 },
  markAllText:    { color: '#c4ebe0', fontSize: 12, fontWeight: '700' },
  notifCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d2426', borderRadius: 18, padding: 14, marginBottom: 10, borderLeftWidth: 3, gap: 12 },
  notifCardUnread:{ backgroundColor: 'rgba(29,36,38,0.9)' },
  notifIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifContent:   { flex: 1 },
  notifTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  notifTitle:     { color: '#f5fafb', fontSize: 14, fontWeight: '700', flex: 1 },
  notifTime:      { color: '#6f787d', fontSize: 11 },
  notifBody:      { color: '#bfc8cd', fontSize: 12, lineHeight: 17 },
  unreadDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#86d0ef' },
  emptyBox:       { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText:      { color: '#6f787d', fontSize: 14 },
  section:        { marginBottom: 20 },
  permBtn:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,103,130,0.1)', borderWidth: 1, borderColor: 'rgba(0,103,130,0.3)', borderRadius: 16, padding: 16, marginBottom: 16 },
  permBtnText:    { color: '#86d0ef', fontSize: 14, fontWeight: '700' },
  saveButton:     { backgroundColor: '#006782', padding: 20, borderRadius: 24, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
