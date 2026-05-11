/**
 * app/AchievementsScreen.tsx — v1
 *
 * Pantalla de logros estilo Duolingo:
 *   ✅ 40+ logros con emoji, dificultad y XP
 *   ✅ Filtros por categoría
 *   ✅ Barra de progreso y nivel
 *   ✅ Racha actual con animación
 *   ✅ Quién más obtuvo cada logro (ranking)
 *   ✅ Celebración al desbloquear
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Modal, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flame, Trophy, Star, Lock, Zap, Users } from 'lucide-react-native';
import {
  GamificationService,
  ALL_ACHIEVEMENTS,
  type Achievement,
  type UserStats,
  type StreakData,
} from '@/service/gamificationService';
import { db_getCurrentUser } from '@/service/database';
import { supabase } from '@/service/supabaseClient';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const C = {
  bg:      '#0f1315',
  card:    '#1a2022',
  border:  '#2a3335',
  text:    '#ecf2f3',
  sub:     '#6f787d',
  accent:  '#86d0ef',
  primary: '#004e63',
  green:   '#22c55e',
  amber:   '#f59e0b',
  red:     '#ef4444',
  purple:  '#c4b5fd',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  bronce:    '#cd7f32',
  plata:     '#c0c0c0',
  oro:       '#ffd700',
  diamante:  '#b9f2ff',
  legendario:'#ff6b6b',
};

const DIFFICULTY_BG: Record<string, string> = {
  bronce:    'rgba(205,127,50,0.12)',
  plata:     'rgba(192,192,192,0.1)',
  oro:       'rgba(255,215,0,0.12)',
  diamante:  'rgba(185,242,255,0.12)',
  legendario:'rgba(255,107,107,0.15)',
};

const CATEGORIES = [
  { id: 'all',          label: 'Todos',        emoji: '🏆' },
  { id: 'glucosa',      label: 'Glucosa',       emoji: '🩸' },
  { id: 'medicacion',   label: 'Medicación',    emoji: '💊' },
  { id: 'ejercicio',    label: 'Ejercicio',     emoji: '🏃' },
  { id: 'racha',        label: 'Rachas',        emoji: '🔥' },
  { id: 'alimentacion', label: 'Comida',        emoji: '🍽️' },
  { id: 'medico',       label: 'Médico',        emoji: '🩺' },
  { id: 'especial',     label: 'Especiales',    emoji: '⭐' },
];

// ─── COMPONENTES ──────────────────────────────────────────────────────────────

function StreakBanner({ streak }: { streak: StreakData }) {
  const atRisk = streak.currentStreak > 0 && new Date().getHours() >= 20;
  return (
    <View style={[sb.container, atRisk && sb.danger]}>
      <View style={sb.left}>
        <Flame color={atRisk ? '#ef4444' : '#f59e0b'} size={32} fill={atRisk ? '#ef4444' : '#f59e0b'}/>
        <View>
          <Text style={sb.count}>{streak.currentStreak}</Text>
          <Text style={sb.label}>días de racha</Text>
        </View>
      </View>
      <View style={sb.right}>
        <Text style={sb.best}>🏆 Mejor racha: {streak.longestStreak} días</Text>
        {atRisk && (
          <Text style={sb.riskText}>⚠️ ¡Tu racha peligra hoy!</Text>
        )}
      </View>
    </View>
  );
}
const sb = StyleSheet.create({
  container: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'rgba(245,158,11,0.1)', borderRadius:20, padding:16, marginBottom:16, borderWidth:1, borderColor:'rgba(245,158,11,0.25)' },
  danger:    { backgroundColor:'rgba(239,68,68,0.12)', borderColor:'rgba(239,68,68,0.3)' },
  left:      { flexDirection:'row', alignItems:'center', gap:12 },
  count:     { color:'#fff', fontSize:32, fontWeight:'900', lineHeight:34 },
  label:     { color:'#f59e0b', fontSize:11, fontWeight:'700' },
  right:     { alignItems:'flex-end' },
  best:      { color:C.sub, fontSize:12 },
  riskText:  { color:'#ef4444', fontSize:12, fontWeight:'700', marginTop:4 },
});

function LevelBar({ stats }: { stats: UserStats }) {
  const xpInLevel  = stats.totalXP % 500;
  const pct        = (xpInLevel / 500) * 100;
  return (
    <View style={lb.container}>
      <View style={lb.header}>
        <View style={lb.levelBadge}><Text style={lb.levelText}>Nv. {stats.level}</Text></View>
        <Text style={lb.xpText}>{stats.totalXP.toLocaleString()} XP total</Text>
        <Text style={lb.nextText}>{500 - xpInLevel} XP para Nv. {stats.level + 1}</Text>
      </View>
      <View style={lb.track}>
        <View style={[lb.fill, { width: `${pct}%` }]}/>
      </View>
    </View>
  );
}
const lb = StyleSheet.create({
  container: { backgroundColor:C.card, borderRadius:18, padding:16, marginBottom:16, borderWidth:1, borderColor:C.border },
  header:    { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  levelBadge:{ backgroundColor:C.primary, paddingHorizontal:12, paddingVertical:4, borderRadius:100 },
  levelText: { color:'#fff', fontSize:13, fontWeight:'800' },
  xpText:    { flex:1, color:C.accent, fontSize:13, fontWeight:'700' },
  nextText:  { color:C.sub, fontSize:11 },
  track:     { height:10, backgroundColor:'#2a3335', borderRadius:5, overflow:'hidden' },
  fill:      { height:'100%', backgroundColor:'#86d0ef', borderRadius:5 },
});

function AchievementCard({
  ach, onPress,
}: { ach: Achievement & { unlocked: boolean; unlockedAt?: Date }; onPress: () => void }) {
  const color = DIFFICULTY_COLORS[ach.difficulty];
  const bg    = DIFFICULTY_BG[ach.difficulty];
  const opacity = ach.unlocked ? 1 : 0.4;

  return (
    <TouchableOpacity
      style={[ac.card, { borderColor: ach.unlocked ? color : C.border, opacity }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[ac.emojiBox, { backgroundColor: bg }]}>
        <Text style={ac.emoji}>{ach.unlocked ? ach.emoji : '🔒'}</Text>
      </View>
      <View style={ac.info}>
        <View style={ac.titleRow}>
          <Text style={ac.name} numberOfLines={1}>{ach.name}</Text>
          <View style={[ac.diffBadge, { backgroundColor: bg }]}>
            <Text style={[ac.diffText, { color }]}>{ach.difficulty}</Text>
          </View>
        </View>
        <Text style={ac.desc} numberOfLines={2}>{ach.description}</Text>
        {ach.unlocked && ach.unlockedAt && (
          <Text style={ac.date}>
            ✅ {ach.unlockedAt.toLocaleDateString('es-CL')}
          </Text>
        )}
        {!ach.unlocked && (
          <Text style={ac.locked}>🔒 Sin desbloquear</Text>
        )}
      </View>
      <View style={ac.xpBadge}>
        <Zap color={color} size={12}/>
        <Text style={[ac.xpText, { color }]}>+{ach.xp}</Text>
      </View>
    </TouchableOpacity>
  );
}
const ac = StyleSheet.create({
  card:     { flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:16, padding:12, marginBottom:8, borderWidth:1, gap:12 },
  emojiBox: { width:50, height:50, borderRadius:14, justifyContent:'center', alignItems:'center' },
  emoji:    { fontSize:26 },
  info:     { flex:1 },
  titleRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:4 },
  name:     { color:C.text, fontSize:13, fontWeight:'700', flex:1 },
  diffBadge:{ paddingHorizontal:6, paddingVertical:2, borderRadius:6 },
  diffText: { fontSize:9, fontWeight:'800', textTransform:'uppercase' },
  desc:     { color:C.sub, fontSize:11, lineHeight:16 },
  date:     { color:C.green, fontSize:10, marginTop:3 },
  locked:   { color:C.sub, fontSize:10, marginTop:3 },
  xpBadge:  { flexDirection:'row', alignItems:'center', gap:2 },
  xpText:   { fontSize:11, fontWeight:'800' },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function AchievementsScreen() {
  const router     = useRouter();
  const user       = db_getCurrentUser();
  const [userId,   setUserId]   = useState<string | null>(user?.id ?? null);
  const [stats,    setStats]    = useState<UserStats | null>(null);
  const [streak,   setStreak]   = useState<StreakData>({ currentStreak:0, longestStreak:0, lastActivityDate:'', streakFrozen:false });
  const [achievements, setAchievements] = useState<(Achievement & { unlocked: boolean; unlockedAt?: Date })[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<(Achievement & { unlocked: boolean }) | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id ?? user?.id ?? null;
      setUserId(uid);
      if (uid) loadData(uid);
      else setLoading(false);
    });
  }, []);

  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [s, str, achs] = await Promise.all([
        GamificationService.calculateStats(uid),
        GamificationService.getUserStreak(uid),
        GamificationService.getUserAchievements(uid),
      ]);
      setStats(s);
      setStreak(str);
      setAchievements(achs);

      // Verificar logros nuevos
      const newOnes = await GamificationService.checkAndUnlockAchievements(uid, s);
      if (newOnes.length > 0) {
        setAchievements(prev =>
          prev.map(a => newOnes.find(n => n.id === a.id) ? { ...a, unlocked: true, unlockedAt: new Date() } : a)
        );
      }
    } catch (e) {
      console.warn('[Achievements] Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = achievements.filter(a =>
    category === 'all' || a.category === category
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount    = achievements.length;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color={C.text} size={22}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Logros & Rachas</Text>
        <View style={[s.backBtn, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={C.accent} size="large"/>
          <Text style={s.loadingText}>Cargando logros...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Racha */}
          <StreakBanner streak={streak}/>

          {/* Nivel y XP */}
          {stats && <LevelBar stats={stats}/>}

          {/* Resumen */}
          <View style={s.summaryRow}>
            <View style={s.summaryChip}>
              <Text style={s.summaryValue}>{unlockedCount}</Text>
              <Text style={s.summaryLabel}>Desbloqueados</Text>
            </View>
            <View style={s.summaryChip}>
              <Text style={[s.summaryValue, { color: C.sub }]}>{totalCount - unlockedCount}</Text>
              <Text style={s.summaryLabel}>Pendientes</Text>
            </View>
            <View style={s.summaryChip}>
              <Text style={[s.summaryValue, { color: C.amber }]}>
                {Math.round(100 * unlockedCount / totalCount)}%
              </Text>
              <Text style={s.summaryLabel}>Completado</Text>
            </View>
            <View style={s.summaryChip}>
              <Text style={[s.summaryValue, { color: '#ffd700' }]}>{stats?.totalXP ?? 0}</Text>
              <Text style={s.summaryLabel}>XP total</Text>
            </View>
          </View>

          {/* Filtros de categoría */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.filterChip, category === cat.id && s.filterChipActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={s.filterEmoji}>{cat.emoji}</Text>
                <Text style={[s.filterLabel, category === cat.id && s.filterLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lista de logros */}
          <Text style={s.sectionTitle}>
            {filtered.filter(a => a.unlocked).length} desbloqueados · {filtered.filter(a => !a.unlocked).length} por desbloquear
          </Text>

          {/* Desbloqueados primero */}
          {filtered.filter(a => a.unlocked).map(ach => (
            <AchievementCard key={ach.id} ach={ach} onPress={() => setSelected(ach)}/>
          ))}

          {filtered.filter(a => !a.unlocked).length > 0 && (
            <>
              <View style={s.divider}><View style={s.divLine}/><Text style={s.divText}>POR DESBLOQUEAR</Text><View style={s.divLine}/></View>
              {filtered.filter(a => !a.unlocked).map(ach => (
                <AchievementCard key={ach.id} ach={ach} onPress={() => setSelected(ach)}/>
              ))}
            </>
          )}

          <View style={{ height: 60 }}/>
        </ScrollView>
      )}

      {/* Modal detalle de logro */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
          {selected && (
            <View style={s.modalCard}>
              <Text style={s.modalEmoji}>{selected.unlocked ? selected.emoji : '🔒'}</Text>
              <Text style={s.modalName}>{selected.name}</Text>
              <View style={[s.modalDiffBadge, { backgroundColor: DIFFICULTY_BG[selected.difficulty] }]}>
                <Text style={[s.modalDiffText, { color: DIFFICULTY_COLORS[selected.difficulty] }]}>
                  {selected.difficulty.toUpperCase()} · +{selected.xp} XP
                </Text>
              </View>
              <Text style={s.modalDesc}>{selected.description}</Text>
              {selected.unlocked && selected.unlockedAt && (
                <Text style={s.modalDate}>
                  ✅ Desbloqueado el {(selected.unlockedAt as Date).toLocaleDateString('es-CL')}
                </Text>
              )}
              {!selected.unlocked && (
                <Text style={s.modalLocked}>
                  🔒 Sigue usando la app para desbloquear este logro
                </Text>
              )}
              <TouchableOpacity style={s.modalClose} onPress={() => setSelected(null)}>
                <Text style={s.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:C.bg },
  header:       { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:16, paddingBottom:12, gap:12 },
  backBtn:      { width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,0.05)', justifyContent:'center', alignItems:'center' },
  headerTitle:  { flex:1, color:C.text, fontSize:20, fontWeight:'800', textAlign:'center' },
  loadingBox:   { flex:1, justifyContent:'center', alignItems:'center', gap:12 },
  loadingText:  { color:C.sub, fontSize:14 },
  scroll:       { paddingHorizontal:16, paddingTop:8 },
  summaryRow:   { flexDirection:'row', gap:8, marginBottom:16 },
  summaryChip:  { flex:1, backgroundColor:C.card, borderRadius:12, padding:10, alignItems:'center' },
  summaryValue: { color:C.accent, fontSize:18, fontWeight:'900', marginBottom:2 },
  summaryLabel: { color:C.sub, fontSize:9, fontWeight:'700' },
  filterScroll: { marginBottom:16 },
  filterRow:    { flexDirection:'row', gap:8, paddingRight:8 },
  filterChip:   { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:7, borderRadius:100, backgroundColor:C.card, borderWidth:1, borderColor:C.border },
  filterChipActive:{ backgroundColor:C.primary, borderColor:C.accent },
  filterEmoji:  { fontSize:13 },
  filterLabel:  { color:C.sub, fontSize:12, fontWeight:'600' },
  filterLabelActive:{ color:'#fff', fontWeight:'700' },
  sectionTitle: { color:C.sub, fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:10 },
  divider:      { flexDirection:'row', alignItems:'center', gap:10, marginVertical:16 },
  divLine:      { flex:1, height:1, backgroundColor:C.border },
  divText:      { color:C.sub, fontSize:9, fontWeight:'800', letterSpacing:1 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center', padding:24 },
  modalCard:    { backgroundColor:'#1a2022', borderRadius:28, padding:28, alignItems:'center', width:'100%', maxWidth:380 },
  modalEmoji:   { fontSize:60, marginBottom:12 },
  modalName:    { color:C.text, fontSize:22, fontWeight:'800', textAlign:'center', marginBottom:10 },
  modalDiffBadge:{ paddingHorizontal:14, paddingVertical:5, borderRadius:100, marginBottom:14 },
  modalDiffText: { fontSize:12, fontWeight:'800', textTransform:'uppercase' },
  modalDesc:    { color:C.sub, fontSize:14, textAlign:'center', lineHeight:22, marginBottom:14 },
  modalDate:    { color:C.green, fontSize:13, fontWeight:'700', marginBottom:8 },
  modalLocked:  { color:C.sub, fontSize:12, textAlign:'center', marginBottom:8 },
  modalClose:   { backgroundColor:C.primary, paddingHorizontal:28, paddingVertical:12, borderRadius:100, marginTop:8 },
  modalCloseText:{ color:'#fff', fontWeight:'700', fontSize:15 },
});