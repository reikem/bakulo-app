/**
 * DailyTasksScreen.tsx — v3
 * • Tareas diarias, semanales y mensuales
 * • Calendario de rachas por tarea
 * • Gráfico diario / semanal / mensual de completaciones
 * • Sistema de recompensas y XP
 * • Modal para crear nuevas tareas
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Switch, Alert, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, CheckCircle2, Circle, Droplets, Pill,
  Utensils, Footprints, Plus, X, Flame, Star,
  Trophy, Zap, Calendar, BarChart2, ChevronDown, ChevronUp,
  Target, Clock,
} from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useAppStore, Task, TaskFrequency, TaskCategory } from '@/store/AppStore';

const { width } = Dimensions.get('window');
const CELL_W = (width - 40 - 6 * 6) / 7;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_LABELS  = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function getFirstDayOffset(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function categoryIcon(cat: TaskCategory, color = '#c4ebe0', size = 18) {
  if (cat === 'glucose')    return <Droplets color={color} size={size} />;
  if (cat === 'medication') return <Pill     color={color} size={size} />;
  if (cat === 'meal')       return <Utensils color={color} size={size} />;
  if (cat === 'exercise')   return <Footprints color={color} size={size} />;
  return <Target color={color} size={size} />;
}

function categoryColor(cat: TaskCategory) {
  const map: Record<TaskCategory, string> = {
    glucose: '#86d0ef', medication: '#c4b5fd',
    meal: '#f9c74f', exercise: '#a4f4b7', other: '#c4ebe0',
  };
  return map[cat];
}

const FREQ_LABELS: Record<TaskFrequency, string> = {
  daily: 'Diaria', weekly: 'Semanal', monthly: 'Mensual',
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────

function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={bc.container}>
      {data.map((d, i) => (
        <View key={i} style={bc.col}>
          <View style={bc.barBg}>
            <View style={[bc.barFill, { height: `${Math.round((d.value / maxVal) * 100)}%`, backgroundColor: color }]} />
          </View>
          <Text style={bc.label}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const bc = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 70, marginTop: 8 },
  col:       { flex: 1, alignItems: 'center', gap: 4 },
  barBg:     { flex: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill:   { width: '100%', borderRadius: 6 },
  label:     { color: '#6f787d', fontSize: 9, fontWeight: '700' },
});

// ─── STREAK CALENDAR ─────────────────────────────────────────────────────────

function StreakCalendar({ taskId }: { taskId: string }) {
  const { getCompletionDaysThisMonth } = useAppStore();
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const offset    = getFirstDayOffset(year, month);
  const doneDays  = getCompletionDaysThisMonth(taskId, year, month);

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={sc.wrap}>
      <View style={sc.headerRow}>
        {DAY_LABELS.map(l => <Text key={l} style={sc.hdr}>{l}</Text>)}
      </View>
      <View style={sc.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`_${idx}`} style={sc.cell} />;
          const done    = doneDays.has(day);
          const isToday = day === today.getDate();
          const future  = day > today.getDate();
          return (
            <View key={day} style={sc.cell}>
              <View style={[sc.inner, done && sc.done, isToday && !done && sc.today]}>
                <Text style={[sc.dayTxt, done && sc.doneTxt, future && sc.futureTxt]}>
                  {done ? '✓' : day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={sc.legend}>
        <View style={sc.legendItem}>
          <View style={[sc.dot, { backgroundColor: '#22c55e' }]} />
          <Text style={sc.legendTxt}>Completado</Text>
        </View>
        <View style={sc.legendItem}>
          <View style={[sc.dot, { backgroundColor: 'rgba(0,103,130,0.4)', borderWidth: 1, borderColor: '#006782' }]} />
          <Text style={sc.legendTxt}>Hoy</Text>
        </View>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  wrap:       { marginTop: 12 },
  headerRow:  { flexDirection: 'row', marginBottom: 4 },
  hdr:        { flex: 1, textAlign: 'center', color: '#6f787d', fontSize: 9, fontWeight: '700' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap' },
  cell:       { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  inner:      { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  done:       { backgroundColor: 'rgba(34,197,94,0.25)' },
  today:      { backgroundColor: 'rgba(0,103,130,0.25)', borderWidth: 1, borderColor: '#006782' },
  dayTxt:     { color: '#ecf2f3', fontSize: 10, fontWeight: '600' },
  doneTxt:    { color: '#22c55e', fontWeight: '800' },
  futureTxt:  { color: '#2a3436' },
  legend:     { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:        { width: 10, height: 10, borderRadius: 3 },
  legendTxt:  { color: '#6f787d', fontSize: 10 },
});

// ─── TASK CARD ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false);
  const { isTaskCompletedToday, completeTask, deleteTask, getStreakForTask } = useAppStore();
  const color   = categoryColor(task.category);
  const done    = isTaskCompletedToday(task.id);
  const streak  = getStreakForTask(task.id);

  return (
    <View style={[tc.card, done && tc.cardDone, { borderLeftColor: color }]}>
      <TouchableOpacity style={tc.row} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <View style={[tc.iconBox, { backgroundColor: `${color}18` }]}>
          {categoryIcon(task.category, color, 20)}
        </View>
        <View style={{ flex: 1 }}>
          <View style={tc.titleRow}>
            <Text style={tc.title}>{task.title}</Text>
            <View style={[tc.freqBadge, { backgroundColor: `${color}18` }]}>
              <Text style={[tc.freqText, { color }]}>{FREQ_LABELS[task.frequency]}</Text>
            </View>
          </View>
          <Text style={tc.desc} numberOfLines={1}>{task.description}</Text>
          {streak > 0 && (
            <View style={tc.streakRow}>
              <Flame color="#f59e0b" size={11} />
              <Text style={tc.streakTxt}>{streak} día{streak !== 1 ? 's' : ''} de racha</Text>
            </View>
          )}
        </View>
        <View style={tc.actions}>
          <TouchableOpacity
            onPress={() => {
              if (done) return;
              completeTask(task.id);
            }}
            style={tc.checkBtn}
          >
            {done
              ? <CheckCircle2 color="#22c55e" size={26} fill="rgba(34,197,94,0.15)" />
              : <Circle color="#3f484c" size={26} />}
          </TouchableOpacity>
          {expanded
            ? <ChevronUp  color="#6f787d" size={16} />
            : <ChevronDown color="#6f787d" size={16} />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={tc.detail}>
          {task.targetTime && (
            <View style={tc.metaRow}>
              <Clock color="#6f787d" size={13} />
              <Text style={tc.metaTxt}>Hora objetivo: {task.targetTime}</Text>
            </View>
          )}
          <StreakCalendar taskId={task.id} />
          <TouchableOpacity
            style={tc.deleteBtn}
            onPress={() =>
              Alert.alert('Eliminar tarea', '¿Seguro?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => deleteTask(task.id) },
              ])
            }
          >
            <Text style={tc.deleteTxt}>Eliminar tarea</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const tc = StyleSheet.create({
  card:      { backgroundColor: '#1a1a1a', borderRadius: 20, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#333', overflow: 'hidden' },
  cardDone:  { opacity: 0.75 },
  row:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title:     { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  freqBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100 },
  freqText:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  desc:      { color: '#6f787d', fontSize: 11, marginTop: 2 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  streakTxt: { color: '#f59e0b', fontSize: 10, fontWeight: '700' },
  actions:   { alignItems: 'center', gap: 4 },
  checkBtn:  { padding: 2 },
  detail:    { paddingHorizontal: 14, paddingBottom: 14 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaTxt:   { color: '#6f787d', fontSize: 11 },
  deleteBtn: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(239,68,68,0.08)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100 },
  deleteTxt: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
});

// ─── NEW TASK MODAL ───────────────────────────────────────────────────────────

const CATEGORIES: { id: TaskCategory; label: string }[] = [
  { id: 'glucose',    label: 'Glucosa'    },
  { id: 'medication', label: 'Medicación' },
  { id: 'meal',       label: 'Comida'     },
  { id: 'exercise',   label: 'Ejercicio'  },
  { id: 'other',      label: 'Otro'       },
];
const FREQUENCIES: { id: TaskFrequency; label: string }[] = [
  { id: 'daily',   label: 'Diaria'   },
  { id: 'weekly',  label: 'Semanal'  },
  { id: 'monthly', label: 'Mensual'  },
];

function NewTaskModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addTask } = useAppStore();
  const [title, setTitle]   = useState('');
  const [desc,  setDesc]    = useState('');
  const [freq,  setFreq]    = useState<TaskFrequency>('daily');
  const [cat,   setCat]     = useState<TaskCategory>('glucose');
  const [time,  setTime]    = useState('');

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Título requerido'); return; }
    addTask({ title: title.trim(), description: desc.trim() || 'Tarea personalizada', frequency: freq, category: cat, targetTime: time || undefined, active: true });
    setTitle(''); setDesc(''); setFreq('daily'); setCat('glucose'); setTime('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={nm.container}>
        <View style={nm.header}>
          <Text style={nm.title}>Nueva Tarea</Text>
          <TouchableOpacity onPress={onClose} style={nm.closeBtn}><X color="#ecf2f3" size={20} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={nm.body} keyboardShouldPersistTaps="handled">
          <Text style={nm.label}>TÍTULO</Text>
          <TextInput style={nm.input} value={title} onChangeText={setTitle} placeholder="Ej: Lectura de glucosa" placeholderTextColor="#3f484c" />

          <Text style={nm.label}>DESCRIPCIÓN</Text>
          <TextInput style={nm.input} value={desc} onChangeText={setDesc} placeholder="Descripción opcional" placeholderTextColor="#3f484c" />

          <Text style={nm.label}>HORA OBJETIVO (opcional)</Text>
          <TextInput style={nm.input} value={time} onChangeText={setTime} placeholder="08:00" placeholderTextColor="#3f484c" keyboardType="numbers-and-punctuation" />

          <Text style={nm.label}>FRECUENCIA</Text>
          <View style={nm.chipRow}>
            {FREQUENCIES.map(f => (
              <TouchableOpacity key={f.id} style={[nm.chip, freq === f.id && nm.chipActive]} onPress={() => setFreq(f.id)}>
                <Text style={[nm.chipTxt, freq === f.id && nm.chipTxtActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={nm.label}>CATEGORÍA</Text>
          <View style={nm.chipRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c.id} style={[nm.chip, cat === c.id && nm.chipActive]} onPress={() => setCat(c.id)}>
                {categoryIcon(c.id, cat === c.id ? '#fff' : '#6f787d', 14)}
                <Text style={[nm.chipTxt, cat === c.id && nm.chipTxtActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={nm.saveBtn} onPress={handleSave}>
            <Text style={nm.saveTxt}>Crear Tarea</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const nm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e', paddingTop: 12 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  title:     { color: '#c4ebe0', fontSize: 20, fontWeight: '800' },
  closeBtn:  { padding: 8, backgroundColor: '#1d2426', borderRadius: 10 },
  body:      { padding: 24, gap: 8 },
  label:     { color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 12, marginBottom: 4 },
  input:     { backgroundColor: '#1d2426', borderRadius: 14, padding: 14, color: '#ecf2f3', fontSize: 15 },
  chipRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  chipActive:{ backgroundColor: '#006782' },
  chipTxt:   { color: '#6f787d', fontSize: 12, fontWeight: '700' },
  chipTxtActive: { color: '#fff' },
  saveBtn:   { backgroundColor: '#006782', padding: 18, borderRadius: 100, alignItems: 'center', marginTop: 24 },
  saveTxt:   { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

type MainTab = 'tareas' | 'graficos' | 'logros';
type ChartPeriod = 'day' | 'week' | 'month';

export default function DailyTasksScreen() {
  const router = useRouter();
  const {
    tasks, taskCompletions, getTasksForFrequency, isTaskCompletedToday,
    streakData, rewards, unlockedRewards, entries,
  } = useAppStore();

  const [mainTab,     setMainTab]     = useState<MainTab>('tareas');
  const [freqTab,     setFreqTab]     = useState<TaskFrequency>('daily');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('week');
  const [showNewTask, setShowNewTask] = useState(false);

  const visibleTasks = getTasksForFrequency(freqTab);
  const completedToday = visibleTasks.filter(t => isTaskCompletedToday(t.id)).length;
  const progress = visibleTasks.length > 0 ? completedToday / visibleTasks.length : 0;

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const today = new Date();
    if (chartPeriod === 'day') {
      // completions by hour today
      const hours = [7,9,11,13,15,17,19,21];
      return hours.map(h => {
        const count = taskCompletions.filter(c => {
          const d = c.completedAt;
          return d.getFullYear() === today.getFullYear() &&
                 d.getMonth() === today.getMonth() &&
                 d.getDate() === today.getDate() &&
                 d.getHours() === h;
        }).length;
        return { label: `${h}h`, value: count };
      });
    }
    if (chartPeriod === 'week') {
      const labels = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today); d.setDate(today.getDate() - (6 - i));
        const count = taskCompletions.filter(c => isSameDay(c.completedAt, d)).length;
        const dow = d.getDay();
        return { label: labels[dow === 0 ? 6 : dow - 1], value: count };
      });
    }
    // month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const weeks: { label: string; value: number }[] = [];
    for (let w = 0; w < 4; w++) {
      const start = w * 7 + 1;
      const end   = Math.min(start + 6, daysInMonth);
      const count = taskCompletions.filter(c => {
        const d = c.completedAt;
        return d.getFullYear() === today.getFullYear() &&
               d.getMonth() === today.getMonth() &&
               d.getDate() >= start && d.getDate() <= end;
      }).length;
      weeks.push({ label: `S${w+1}`, value: count });
    }
    return weeks;
  }, [chartPeriod, taskCompletions]);

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  const xpToNextLevel = (streakData.level) * 200;
  const xpProgress = Math.min(1, (streakData.totalXP % 200) / 200);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#c4ebe0" size={22} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mis Tareas</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowNewTask(true)}>
          <Plus color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      {/* Main tabs */}
      <View style={s.mainTabRow}>
        {([
          { id: 'tareas',   label: 'Tareas',   Icon: Target    },
          { id: 'graficos', label: 'Gráficos', Icon: BarChart2 },
          { id: 'logros',   label: 'Logros',   Icon: Trophy    },
        ] as const).map(({ id, label, Icon }) => (
          <TouchableOpacity
            key={id}
            style={[s.mainTab, mainTab === id && s.mainTabActive]}
            onPress={() => setMainTab(id)}
          >
            <Icon color={mainTab === id ? '#fff' : '#6f787d'} size={14} />
            <Text style={[s.mainTabTxt, mainTab === id && s.mainTabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══ TAB TAREAS ══ */}
        {mainTab === 'tareas' && (
          <>
            {/* Hero progress */}
            <View style={s.heroCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.heroLabel}>
                  {FREQ_LABELS[freqTab]} · Hoy
                </Text>
                <Text style={s.heroValue}>{completedToday}/{visibleTasks.length}</Text>
                <Text style={s.heroSub}>tareas completadas</Text>
                <View style={s.xpRow}>
                  <Zap color="#fbbf24" size={14} />
                  <Text style={s.xpTxt}>{streakData.totalXP} XP · Nivel {streakData.level}</Text>
                </View>
                <View style={s.xpBar}>
                  <View style={[s.xpFill, { width: `${Math.round(xpProgress * 100)}%` }]} />
                </View>
              </View>
              {/* Ring */}
              <View style={s.ringWrap}>
                <Svg width={90} height={90} viewBox="0 0 100 100">
                  <SvgCircle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                  <SvgCircle cx="50" cy="50" r="40" stroke="#c4ebe0" strokeWidth="8" fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - progress)}
                    strokeLinecap="round"
                  />
                </Svg>
                <Text style={s.ringTxt}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>

            {/* Streak banner */}
            <View style={s.streakBanner}>
              <Flame color="#f59e0b" size={20} fill="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={s.streakTitle}>Racha actual: {streakData.currentStreak} días</Text>
                <Text style={s.streakSub}>Récord: {streakData.longestStreak} días · {streakData.totalReadings} lecturas totales</Text>
              </View>
              <Star color="#fbbf24" size={18} fill="#fbbf24" />
            </View>

            {/* Frequency tabs */}
            <View style={s.freqRow}>
              {(['daily','weekly','monthly'] as TaskFrequency[]).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[s.freqBtn, freqTab === f && s.freqBtnActive]}
                  onPress={() => setFreqTab(f)}
                >
                  <Text style={[s.freqTxt, freqTab === f && s.freqTxtActive]}>{FREQ_LABELS[f]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {visibleTasks.length === 0 ? (
              <View style={s.empty}>
                <Target color="#2a3436" size={36} />
                <Text style={s.emptyTitle}>Sin tareas {FREQ_LABELS[freqTab].toLowerCase()}s</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => setShowNewTask(true)}>
                  <Plus color="#86d0ef" size={14} />
                  <Text style={s.emptyBtnTxt}>Crear tarea</Text>
                </TouchableOpacity>
              </View>
            ) : (
              visibleTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </>
        )}

        {/* ══ TAB GRÁFICOS ══ */}
        {mainTab === 'graficos' && (
          <>
            <Text style={s.sectionTitle}>Completaciones</Text>
            <Text style={s.sectionSub}>Actividad por período</Text>

            {/* Period selector */}
            <View style={s.freqRow}>
              {([
                { id: 'day',   label: 'Hoy'  },
                { id: 'week',  label: 'Semana' },
                { id: 'month', label: 'Mes'   },
              ] as const).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.freqBtn, chartPeriod === p.id && s.freqBtnActive]}
                  onPress={() => setChartPeriod(p.id)}
                >
                  <Text style={[s.freqTxt, chartPeriod === p.id && s.freqTxtActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Tareas completadas</Text>
              <MiniBarChart data={chartData} color="#86d0ef" />
              <Text style={s.chartHint}>
                Total: {chartData.reduce((a, d) => a + d.value, 0)} completaciones
              </Text>
            </View>

            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Flame color="#f59e0b" size={20} />
                <Text style={s.statVal}>{streakData.currentStreak}</Text>
                <Text style={s.statLbl}>Racha actual</Text>
              </View>
              <View style={s.statBox}>
                <Trophy color="#c4b5fd" size={20} />
                <Text style={s.statVal}>{streakData.longestStreak}</Text>
                <Text style={s.statLbl}>Récord</Text>
              </View>
              <View style={s.statBox}>
                <Droplets color="#86d0ef" size={20} />
                <Text style={s.statVal}>{streakData.totalReadings}</Text>
                <Text style={s.statLbl}>Lecturas</Text>
              </View>
              <View style={s.statBox}>
                <Zap color="#fbbf24" size={20} />
                <Text style={s.statVal}>{streakData.totalXP}</Text>
                <Text style={s.statLbl}>XP total</Text>
              </View>
            </View>

            {/* Category breakdown */}
            <Text style={[s.sectionTitle, { marginTop: 8 }]}>Por categoría</Text>
            {(['glucose','medication','meal','exercise','other'] as TaskCategory[]).map(cat => {
              const total = tasks.filter(t => t.category === cat).length;
              const done  = taskCompletions.filter(c => {
                const task = tasks.find(t => t.id === c.taskId);
                return task?.category === cat;
              }).length;
              if (total === 0) return null;
              const color = categoryColor(cat);
              const pct   = total > 0 ? Math.round((done / (total * 30)) * 100) : 0;
              return (
                <View key={cat} style={s.catRow}>
                  <View style={[s.catIcon, { backgroundColor: `${color}18` }]}>
                    {categoryIcon(cat, color, 16)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.catHeader}>
                      <Text style={s.catLabel}>{FREQ_LABELS['daily']} — {cat}</Text>
                      <Text style={[s.catPct, { color }]}>{done} completaciones</Text>
                    </View>
                    <View style={s.catBarBg}>
                      <View style={[s.catBarFill, { width: `${Math.min(100, pct * 3)}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ══ TAB LOGROS ══ */}
        {mainTab === 'logros' && (
          <>
            {/* XP + level hero */}
            <View style={s.levelCard}>
              <View style={s.levelHeader}>
                <View style={s.levelBadge}>
                  <Text style={s.levelNum}>Nv.{streakData.level}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.levelTitle}>Nivel {streakData.level}</Text>
                  <Text style={s.levelSub}>{streakData.totalXP} XP · siguiente nivel a {xpToNextLevel} XP</Text>
                </View>
              </View>
              <View style={s.levelBarBg}>
                <View style={[s.levelBarFill, { width: `${Math.round(xpProgress * 100)}%` }]} />
              </View>
              <Text style={s.levelBarHint}>
                {Math.round(xpProgress * 100)}% hacia nivel {streakData.level + 1}
              </Text>
            </View>

            {/* Unlocked */}
            <Text style={s.sectionTitle}>Logros desbloqueados</Text>
            <Text style={s.sectionSub}>{unlockedRewards.length} de {rewards.length} obtenidos</Text>

            {unlockedRewards.length === 0 && (
              <View style={s.empty}>
                <Trophy color="#2a3436" size={36} />
                <Text style={s.emptyTitle}>¡Aún no tienes logros!</Text>
                <Text style={s.emptySub}>Completa tareas y registra lecturas para desbloquearlos.</Text>
              </View>
            )}

            <View style={s.rewardsGrid}>
              {unlockedRewards.map(r => (
                <View key={r.id} style={[s.rewardCard, s.rewardUnlocked]}>
                  <Text style={s.rewardIcon}>{r.icon}</Text>
                  <Text style={s.rewardTitle}>{r.title}</Text>
                  <Text style={s.rewardDesc} numberOfLines={2}>{r.description}</Text>
                  <View style={s.rewardXpBadge}>
                    <Zap color="#fbbf24" size={10} />
                    <Text style={s.rewardXpTxt}>{r.xpRequired} XP</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Locked */}
            <Text style={[s.sectionTitle, { marginTop: 16 }]}>Próximos logros</Text>
            <View style={s.rewardsGrid}>
              {rewards.filter(r => !r.unlockedAt).map(r => (
                <View key={r.id} style={[s.rewardCard, s.rewardLocked]}>
                  <Text style={[s.rewardIcon, { opacity: 0.3 }]}>{r.icon}</Text>
                  <Text style={[s.rewardTitle, { color: '#3f484c' }]}>{r.title}</Text>
                  <Text style={[s.rewardDesc, { color: '#2a3436' }]} numberOfLines={2}>{r.description}</Text>
                  <View style={s.rewardXpBadge}>
                    <Zap color="#3f484c" size={10} />
                    <Text style={[s.rewardXpTxt, { color: '#3f484c' }]}>{r.xpRequired} XP necesario</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <NewTaskModal visible={showNewTask} onClose={() => setShowNewTask(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#121212' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle:    { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  backBtn:        { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  addBtn:         { width: 38, height: 38, backgroundColor: '#006782', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  mainTabRow:     { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 4, gap: 4 },
  mainTab:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 12 },
  mainTabActive:  { backgroundColor: '#006782' },
  mainTabTxt:     { color: '#6f787d', fontSize: 12, fontWeight: '700' },
  mainTabTxtActive: { color: '#fff' },

  scroll:         { paddingHorizontal: 20 },

  heroCard:       { backgroundColor: '#1a1a1a', borderRadius: 28, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  heroLabel:      { color: '#6f787d', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  heroValue:      { color: '#c4ebe0', fontSize: 36, fontWeight: '800' },
  heroSub:        { color: '#6f787d', fontSize: 12, marginBottom: 8 },
  xpRow:          { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  xpTxt:          { color: '#fbbf24', fontSize: 11, fontWeight: '700' },
  xpBar:          { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10 },
  xpFill:         { height: '100%', backgroundColor: '#fbbf24', borderRadius: 10 },
  ringWrap:       { justifyContent: 'center', alignItems: 'center' },
  ringTxt:        { position: 'absolute', color: '#c4ebe0', fontSize: 16, fontWeight: '800' },

  streakBanner:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 18, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)' },
  streakTitle:    { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  streakSub:      { color: '#6f787d', fontSize: 11, marginTop: 2 },

  freqRow:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  freqBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  freqBtnActive:  { backgroundColor: '#006782' },
  freqTxt:        { color: '#6f787d', fontSize: 12, fontWeight: '700' },
  freqTxtActive:  { color: '#fff' },

  empty:          { alignItems: 'center', paddingVertical: 40, gap: 10, backgroundColor: '#1a1a1a', borderRadius: 20 },
  emptyTitle:     { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  emptySub:       { color: '#6f787d', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  emptyBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(134,208,239,0.08)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  emptyBtnTxt:    { color: '#86d0ef', fontSize: 13, fontWeight: '700' },

  sectionTitle:   { color: '#baeaff', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  sectionSub:     { color: '#6f787d', fontSize: 11, letterSpacing: 1, marginBottom: 16 },

  chartCard:      { backgroundColor: '#1a1a1a', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chartTitle:     { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  chartHint:      { color: '#6f787d', fontSize: 10, marginTop: 8 },

  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox:        { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 18, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statVal:        { color: '#ecf2f3', fontSize: 20, fontWeight: '800' },
  statLbl:        { color: '#6f787d', fontSize: 9, fontWeight: '700', textAlign: 'center' },

  catRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 12, marginBottom: 8 },
  catIcon:        { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  catHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabel:       { color: '#ecf2f3', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  catPct:         { fontSize: 11, fontWeight: '800' },
  catBarBg:       { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10 },
  catBarFill:     { height: '100%', borderRadius: 10 },

  levelCard:      { backgroundColor: '#1a1a1a', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  levelHeader:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  levelBadge:     { width: 52, height: 52, borderRadius: 16, backgroundColor: '#006782', alignItems: 'center', justifyContent: 'center' },
  levelNum:       { color: '#fff', fontSize: 16, fontWeight: '800' },
  levelTitle:     { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  levelSub:       { color: '#6f787d', fontSize: 11, marginTop: 2 },
  levelBarBg:     { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10 },
  levelBarFill:   { height: '100%', backgroundColor: '#006782', borderRadius: 10 },
  levelBarHint:   { color: '#6f787d', fontSize: 10, marginTop: 6 },

  rewardsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  rewardCard:     { width: (width - 50) / 2, borderRadius: 20, padding: 16, gap: 4 },
  rewardUnlocked: { backgroundColor: '#1a2820', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  rewardLocked:   { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  rewardIcon:     { fontSize: 32, marginBottom: 4 },
  rewardTitle:    { color: '#c4ebe0', fontSize: 13, fontWeight: '800' },
  rewardDesc:     { color: '#6f787d', fontSize: 10, lineHeight: 15 },
  rewardXpBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  rewardXpTxt:    { color: '#fbbf24', fontSize: 10, fontWeight: '700' },
});