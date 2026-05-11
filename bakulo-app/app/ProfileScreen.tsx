/**
 * ProfileScreen.tsx — v4
 *
 * CAMBIOS vs v3:
 *   ✅ Sección "Próximo y alarmas" MOVIDA aquí desde explore
 *   ✅ Logros reales desde GamificationService (no AppStore mock)
 *   ✅ Racha real desde Supabase
 *   ✅ Botón "Ver todos los logros" → AchievementsScreen
 *   ✅ Logout se mantiene en Profile (quitado de Settings)
 *   ✅ Notificaciones pendientes del día mostradas aquí
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, SafeAreaView, Image, ActivityIndicator,
} from 'react-native';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Heart, Activity, Smartphone, Share2,
  Edit3, CheckCircle, XCircle, ChevronRight,
  Flame, Trophy, Zap, Star, RefreshCw, LogOut,
  Bell, Calendar, Pill, Droplets, Dumbbell,
} from 'lucide-react-native';
import { healthService, HealthConnection, HealthProvider } from '@/service/healthService';
import { useAppStore } from '@/store/AppStore';
import { authLogout } from '@/service/authService';
import { GamificationService, ALL_ACHIEVEMENTS, type StreakData } from '@/service/gamificationService';
import { db_getCurrentUser } from '@/service/database';
import { supabase } from '@/service/supabaseClient';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function ProviderIcon({ id, size = 22 }: { id: HealthProvider; size?: number }) {
  if (id === 'apple')  return <Heart    color="#ff2d55" size={size} fill="#ff2d55"/>;
  if (id === 'google') return <Activity color="#4285f4" size={size}/>;
  return <Smartphone color="#cf0a2c" size={size}/>;
}

function EcosystemItem({ conn, onToggle, loading }: {
  conn: HealthConnection; onToggle: ()=>void; loading: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.ecoItem, !conn.available && s.ecoItemDisabled]}
      onPress={onToggle} disabled={!conn.available || loading} activeOpacity={0.75}
    >
      <View style={[s.ecoIconBox, { backgroundColor: `${conn.logoColor}18` }]}>
        <ProviderIcon id={conn.id}/>
      </View>
      <View style={s.ecoInfo}>
        <Text style={s.ecoName}>{conn.name}</Text>
        <Text style={s.ecoSub}>
          {!conn.available ? 'No disponible en este dispositivo' :
           conn.connected  ? `Activo · ${conn.lastSync ? new Date(conn.lastSync).toLocaleDateString() : ''}` :
           'Toca para conectar'}
        </Text>
        {conn.connected && conn.glucoseData && conn.glucoseData.length > 0 && (
          <Text style={s.ecoDataText}>{conn.glucoseData.length} lecturas importadas</Text>
        )}
      </View>
      {loading ? <ActivityIndicator color="#86d0ef" size="small"/> :
       conn.connected ? <CheckCircle color="#22c55e" size={20}/> :
       conn.available ? <ChevronRight color="#6f787d" size={18}/> :
       <XCircle color="#6f787d" size={18}/>}
    </TouchableOpacity>
  );
}

// ─── TARJETA DE PRÓXIMOS EVENTOS (movida desde explore) ───────────────────────

function UpcomingCard() {
  const now     = new Date();
  const hourStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  const UPCOMING = [
    { emoji:'💉', title:'Insulina',           sub:`Hoy · ${hourStr}`,           color:'#86d0ef', type:'med'  },
    { emoji:'🩸', title:'Glucosa en ayunas',  sub:'Mañana · 07:00 am',           color:'#f59e0b', type:'glu'  },
    { emoji:'🏃', title:'Ejercicio',          sub:'Hoy · 18:00 pm',              color:'#22c55e', type:'ex'   },
    { emoji:'🩺', title:'Control médico',     sub:'Próximamente',                 color:'#c4b5fd', type:'doc'  },
  ];

  return (
    <View style={s.upcomingCard}>
      <View style={s.upcomingHeader}>
        <Bell color="#86d0ef" size={16}/>
        <Text style={s.upcomingTitle}>Próximas actividades del día</Text>
      </View>
      {UPCOMING.map((item, i) => (
        <View key={i} style={s.upcomingRow}>
          <View style={[s.upcomingDot, { backgroundColor: item.color }]}/>
          <Text style={s.upcomingEmoji}>{item.emoji}</Text>
          <View style={s.upcomingInfo}>
            <Text style={s.upcomingName}>{item.title}</Text>
            <Text style={s.upcomingSub}>{item.sub}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { glucoseEntries, clearUserData } = useAppStore();

  const [connections,    setConnections]    = useState<HealthConnection[]>([]);
  const [loadingId,      setLoadingId]      = useState<HealthProvider | null>(null);
  const [modalVisible,   setModalVisible]   = useState(false);
  const [glucoseTarget,  setGlucoseTarget]  = useState('70–140');
  const [refreshing,     setRefreshing]     = useState(false);
  const [streak,         setStreak]         = useState<StreakData>({ currentStreak:0, longestStreak:0, lastActivityDate:'', streakFrozen:false });
  const [achievements,   setAchievements]   = useState<any[]>([]);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [totalXP,        setTotalXP]        = useState(0);
  const [level,          setLevel]          = useState(1);

  const localUser    = db_getCurrentUser();
  const displayName  = localUser?.displayName ?? localUser?.username ?? 'Usuario';
  const displayEmail = localUser?.email ?? '';
  const displayAvatar= localUser?.avatarUrl ?? null;
  const isVerified   = localUser?.activated !== false;
  const initials     = displayName.split(' ').map((w:string) => w[0]??'').slice(0,2).join('').toUpperCase();

  // Stats glucosa
  const last14    = glucoseEntries.filter(e => e.timestamp >= new Date(Date.now() - 14*24*3600*1000));
  const avg14     = last14.length ? Math.round(last14.reduce((s,e)=>s+e.value,0)/last14.length) : 108;
  const inRange14 = last14.length ? Math.round(last14.filter(e=>e.value>=70&&e.value<=140).length/last14.length*100) : 82;
  const trendLabel= avg14 > 160 ? '↑ Alto' : avg14 < 70 ? '↓ Bajo' : '✓ Estable';

  useEffect(() => {
    healthService.getConnections().then(setConnections);
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id ?? localUser?.id ?? null;
      setUserId(uid);
      if (uid) {
        GamificationService.getUserStreak(uid).then(setStreak);
        GamificationService.getUserAchievements(uid).then(achs => {
          setAchievements(achs.filter(a => a.unlocked).slice(0, 8));
        });
        GamificationService.calculateStats(uid).then(stats => {
          setTotalXP(stats.totalXP);
          setLevel(stats.level);
        });
      }
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      const [str, achs, stats] = await Promise.all([
        GamificationService.getUserStreak(userId),
        GamificationService.getUserAchievements(userId),
        GamificationService.calculateStats(userId),
      ]);
      setStreak(str);
      setAchievements(achs.filter(a => a.unlocked).slice(0, 8));
      setTotalXP(stats.totalXP);
      setLevel(stats.level);
    }
    setRefreshing(false);
  };

  const handleToggle = useCallback(async (id: HealthProvider) => {
    setLoadingId(id);
    const ok = await healthService.toggleConnection(id);
    if (!ok) Alert.alert('Error', 'No se pudo actualizar la conexión.');
    setConnections(await healthService.getConnections());
    setLoadingId(null);
  }, []);

  const handleShare = async () => {
    await Share.share({
      message:
        `📊 Reporte de Salud — Serenity\n` +
        `• Usuario: ${displayName}\n` +
        `• Glucosa promedio (14d): ${avg14} mg/dL\n` +
        `• Tiempo en rango: ${inRange14}%\n` +
        `• Racha actual: ${streak.currentStreak} días 🔥\n` +
        `• Nivel: ${level} · XP: ${totalXP}\n` +
        `Generado el ${new Date().toLocaleDateString('es')}`,
    });
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', `¿Salir de la cuenta de ${displayName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive',
        onPress: async () => {
          await authLogout();
          clearUserData();
          router.replace('/login');
        },
      },
    ]);
  };

  const unlockedCount = achievements.length;
  const totalCount    = ALL_ACHIEVEMENTS.length;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <ArrowLeft color="#c4ebe0" size={24}/>
        </TouchableOpacity>
        <Text style={s.navTitle}>Mi Perfil</Text>
        <TouchableOpacity style={s.iconBtn} onPress={handleRefresh} disabled={refreshing}>
          {refreshing ? <ActivityIndicator color="#c4ebe0" size="small"/> : <RefreshCw color="#c4ebe0" size={20}/>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Avatar + datos */}
        <View style={s.heroSection}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={s.avatar}/>
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={{ flex:1, gap:3 }}>
            <Text style={s.name} numberOfLines={1}>{displayName}</Text>
            <Text style={s.emailText} numberOfLines={1}>{displayEmail}</Text>
            {isVerified
              ? <View style={s.verifiedBadge}><Text style={s.verifiedTxt}>✓ Cuenta verificada</Text></View>
              : <View style={s.unverifiedBadge}><Text style={s.unverifiedTxt}>⚠️ Email sin verificar</Text></View>}
            <Text style={s.levelBadge}>⚡ Nivel {level} · {totalXP.toLocaleString()} XP</Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setModalVisible(true)}>
            <Edit3 color="#fff" size={16}/><Text style={s.btnText}>Editar Metas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={handleShare}>
            <Share2 color="#c4ebe0" size={16}/><Text style={s.btnTextSec}>Compartir</Text>
          </TouchableOpacity>
        </View>

        {/* Stats glucosa */}
        <View style={s.statsCard}>
          <Text style={s.statsLabel}>PROMEDIO 14 DÍAS</Text>
          <View style={s.statsRow}>
            <Text style={s.statsValue}>{avg14}</Text>
            <Text style={s.statsUnit}> mg/dL</Text>
            <View style={s.trendBadge}><Text style={s.trendText}>{trendLabel}</Text></View>
          </View>
          <View style={s.progressOuter}>
            <View style={[s.progressInner, { width:`${inRange14}%` as any }]}/>
          </View>
          <Text style={s.progressLabel}>{inRange14}% tiempo en rango objetivo</Text>
        </View>

        {/* ── PRÓXIMAS ACTIVIDADES (movido desde explore) ── */}
        <UpcomingCard/>

        {/* Rachas */}
        <Text style={s.sectionTitle}>Actividad y Rachas</Text>
        <View style={s.streakRow}>
          {[
            { icon:<Flame color="#f59e0b" size={20} fill="#f59e0b"/>, val:streak.currentStreak, lbl:'Racha actual' },
            { icon:<Star  color="#fbbf24" size={20} fill="#fbbf24"/>, val:streak.longestStreak, lbl:'Récord'       },
            { icon:<Zap   color="#86d0ef" size={20}/>,                val:totalXP,              lbl:'XP total'     },
            { icon:<Trophy color="#c4b5fd" size={20}/>,               val:`Nv.${level}`,        lbl:'Nivel'        },
          ].map((item, i) => (
            <View key={i} style={s.streakBox}>
              {item.icon}
              <Text style={s.streakVal}>{item.val}</Text>
              <Text style={s.streakLbl}>{item.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Logros recientes */}
        <View style={s.awardsHeader}>
          <Text style={s.sectionTitle}>Logros</Text>
          <Text style={s.awardsCount}>{unlockedCount}/{totalCount}</Text>
        </View>
        <Text style={[s.sectionSub, { marginBottom:12 }]}>Premios obtenidos hasta ahora</Text>

        {achievements.length === 0 ? (
          <View style={s.awardsEmpty}>
            <Trophy color="#2a3436" size={28}/>
            <Text style={s.awardsEmptyTxt}>Completa actividades de salud para desbloquear logros 🏆</Text>
          </View>
        ) : (
          <View style={s.awardsGrid}>
            {achievements.map(a => (
              <View key={a.id} style={s.awardCard}>
                <Text style={s.awardIcon}>{a.emoji}</Text>
                <Text style={s.awardTitle} numberOfLines={1}>{a.name}</Text>
                <Text style={s.awardDesc} numberOfLines={2}>{a.description}</Text>
                {a.unlockedAt && (
                  <Text style={s.awardDate}>
                    {new Date(a.unlockedAt).toLocaleDateString('es', { day:'numeric', month:'short' })}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Botón ver todos los logros */}
        <TouchableOpacity
          style={s.viewAllBtn}
          onPress={() => router.push('/AchievementsScreen')}
          activeOpacity={0.85}
        >
          <Trophy color="#f59e0b" size={18}/>
          <Text style={s.viewAllText}>Ver todos los logros ({totalCount})</Text>
          <ChevronRight color="#f59e0b" size={18}/>
        </TouchableOpacity>

        {/* Ecosistema */}
        <Text style={s.sectionTitle}>Ecosistema de Salud</Text>
        <Text style={s.sectionSub}>Conecta tus apps para importar datos</Text>
        <View style={s.ecoContainer}>
          {connections.map((conn, i) => (
            <React.Fragment key={conn.id}>
              <EcosystemItem conn={conn} onToggle={() => handleToggle(conn.id)} loading={loadingId === conn.id}/>
              {i < connections.length - 1 && <View style={s.ecoDivider}/>}
            </React.Fragment>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut color="#ef4444" size={18}/>
          <Text style={s.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal metas */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Actualizar Parámetros</Text>
            <Text style={s.modalLabel}>Rango de Glucosa (mg/dL)</Text>
            <TextInput style={s.modalInput} value={glucoseTarget} onChangeText={setGlucoseTarget}
              placeholder="70–140" placeholderTextColor="#3f484c"/>
            <TouchableOpacity style={s.modalSaveBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.modalSaveBtnText}>Confirmar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#171d1e' },
  navbar:          { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16 },
  navTitle:        { color:'#c4ebe0', fontSize:16, fontWeight:'700' },
  iconBtn:         { padding:8 },
  scroll:          { paddingHorizontal:24, paddingBottom:40 },

  heroSection:     { flexDirection:'row', alignItems:'center', gap:14, marginBottom:20 },
  avatar:          { width:68, height:68, borderRadius:34, borderWidth:2, borderColor:'#006782' },
  avatarPlaceholder:{ backgroundColor:'#004e63', alignItems:'center', justifyContent:'center' },
  avatarInitials:  { color:'#c4ebe0', fontSize:24, fontWeight:'800' },
  name:            { color:'#c4ebe0', fontSize:20, fontWeight:'800' },
  emailText:       { color:'#6f787d', fontSize:12 },
  verifiedBadge:   { alignSelf:'flex-start', backgroundColor:'rgba(34,197,94,0.1)', paddingHorizontal:8, paddingVertical:3, borderRadius:8, marginTop:4 },
  verifiedTxt:     { color:'#22c55e', fontSize:10, fontWeight:'700' },
  unverifiedBadge: { alignSelf:'flex-start', backgroundColor:'rgba(245,158,11,0.1)', paddingHorizontal:8, paddingVertical:3, borderRadius:8, marginTop:4 },
  unverifiedTxt:   { color:'#f59e0b', fontSize:10, fontWeight:'700' },
  levelBadge:      { color:'#86d0ef', fontSize:11, fontWeight:'700', marginTop:4 },

  actionRow:       { flexDirection:'row', gap:12, marginBottom:20 },
  primaryBtn:      { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#004e63', paddingVertical:12, borderRadius:100 },
  secondaryBtn:    { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', paddingVertical:12, borderRadius:100 },
  btnText:         { color:'#fff', fontWeight:'700', fontSize:13 },
  btnTextSec:      { color:'#c4ebe0', fontWeight:'700', fontSize:13 },

  statsCard:       { backgroundColor:'#1d2426', borderRadius:24, padding:20, marginBottom:16 },
  statsLabel:      { color:'#42655d', fontSize:9, fontWeight:'800', letterSpacing:1.2, marginBottom:6 },
  statsRow:        { flexDirection:'row', alignItems:'baseline', marginBottom:12 },
  statsValue:      { color:'#86d0ef', fontSize:40, fontWeight:'800' },
  statsUnit:       { color:'#6f787d', fontSize:14 },
  trendBadge:      { marginLeft:8, backgroundColor:'rgba(34,197,94,0.15)', paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  trendText:       { color:'#22c55e', fontSize:11, fontWeight:'700' },
  progressOuter:   { height:6, backgroundColor:'#333b3d', borderRadius:10 },
  progressInner:   { height:'100%', backgroundColor:'#006782', borderRadius:10 },
  progressLabel:   { color:'#6f787d', fontSize:11, marginTop:6 },

  // Upcoming
  upcomingCard:    { backgroundColor:'rgba(134,208,239,0.07)', borderRadius:20, padding:16, marginBottom:20, borderWidth:1, borderColor:'rgba(134,208,239,0.15)' },
  upcomingHeader:  { flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 },
  upcomingTitle:   { color:'#86d0ef', fontSize:13, fontWeight:'700' },
  upcomingRow:     { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  upcomingDot:     { width:8, height:8, borderRadius:4 },
  upcomingEmoji:   { fontSize:18 },
  upcomingInfo:    { flex:1 },
  upcomingName:    { color:'#ecf2f3', fontSize:13, fontWeight:'600' },
  upcomingSub:     { color:'#6f787d', fontSize:11 },

  sectionTitle:    { color:'#f5fafb', fontSize:18, fontWeight:'800', marginBottom:4 },
  sectionSub:      { color:'#6f787d', fontSize:12, marginBottom:16 },

  streakRow:       { flexDirection:'row', gap:10, marginBottom:20 },
  streakBox:       { flex:1, backgroundColor:'#1d2426', borderRadius:18, padding:12, alignItems:'center', gap:4, borderWidth:1, borderColor:'rgba(255,255,255,0.05)' },
  streakVal:       { color:'#ecf2f3', fontSize:16, fontWeight:'800' },
  streakLbl:       { color:'#6f787d', fontSize:9, fontWeight:'700', textAlign:'center' },

  awardsHeader:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:2 },
  awardsCount:     { color:'#86d0ef', fontSize:13, fontWeight:'800' },
  awardsEmpty:     { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#1d2426', borderRadius:16, padding:16, marginBottom:16 },
  awardsEmptyTxt:  { color:'#6f787d', fontSize:12, flex:1 },
  awardsGrid:      { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:14 },
  awardCard:       { width:'47%', backgroundColor:'#1a2820', borderRadius:18, padding:14, gap:3, borderWidth:1, borderColor:'rgba(34,197,94,0.15)' },
  awardIcon:       { fontSize:28, marginBottom:2 },
  awardTitle:      { color:'#c4ebe0', fontSize:12, fontWeight:'800' },
  awardDesc:       { color:'#6f787d', fontSize:10, lineHeight:14 },
  awardDate:       { color:'#22c55e', fontSize:9, fontWeight:'700', marginTop:2 },

  viewAllBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor:'rgba(245,158,11,0.1)', borderRadius:16, padding:14, marginBottom:20, borderWidth:1, borderColor:'rgba(245,158,11,0.2)' },
  viewAllText:     { color:'#f59e0b', fontSize:14, fontWeight:'700', flex:1, textAlign:'center' },

  ecoContainer:    { backgroundColor:'#1d2426', borderRadius:24, overflow:'hidden', marginBottom:20 },
  ecoItem:         { flexDirection:'row', alignItems:'center', padding:18, gap:14 },
  ecoItemDisabled: { opacity:0.4 },
  ecoIconBox:      { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' },
  ecoInfo:         { flex:1 },
  ecoName:         { color:'#f5fafb', fontSize:15, fontWeight:'700' },
  ecoSub:          { color:'#6f787d', fontSize:11, marginTop:2 },
  ecoDataText:     { color:'#22c55e', fontSize:10, fontWeight:'600', marginTop:3 },
  ecoDivider:      { height:StyleSheet.hairlineWidth, backgroundColor:'rgba(255,255,255,0.06)', marginHorizontal:18 },

  signOutBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderWidth:1, borderColor:'rgba(239,68,68,0.2)', borderRadius:20, padding:16, marginBottom:8, backgroundColor:'rgba(239,68,68,0.05)' },
  signOutText:     { color:'#ef4444', fontWeight:'700', fontSize:14 },

  modalOverlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', padding:24 },
  modalContent:    { backgroundColor:'#1d2426', padding:30, borderRadius:32 },
  modalTitle:      { color:'#c4ebe0', fontSize:22, fontWeight:'800', marginBottom:20 },
  modalLabel:      { color:'#6f787d', fontSize:12, fontWeight:'700', marginBottom:8 },
  modalInput:      { backgroundColor:'#171d1e', color:'#fff', padding:15, borderRadius:16, marginBottom:20, fontSize:16 },
  modalSaveBtn:    { backgroundColor:'#006782', padding:18, borderRadius:100, alignItems:'center' },
  modalSaveBtnText:{ color:'#fff', fontWeight:'800' },
});