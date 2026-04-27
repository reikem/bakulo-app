/**
 * HistoryScreen.tsx — v3
 * Todos los tipos de registro: glucosa, ejercicio, comida, medicación.
 * • Calendario 31 días: punto verde = registro, fondo rojo = sin registro
 * • Filtro por tipo de registro
 * • Marcar completado / eliminar inline
 * • Tap → bottom sheet de detalle completo
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Plus,
  Droplets, Dumbbell, Utensils, Pill,
  CheckCircle2, Circle, Clock, Trash2, X,
} from 'lucide-react-native';
import { EntryType, AnyEntry, entryTypeColor, ExerciseEntry, MealEntry, MedicationEntry, entryTypeLabel, useAppStore } from '@/store/AppStore';
import { GlucoseEntry, getGlucoseRange } from '@/store/GlucoseStore';
;

// ─── CALENDAR ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DAY_LABELS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function getFirstDayOffset(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function FullCalendar({
  year, month, selectedDay, daysWithEntries, daysWithoutEntries, today, onSelectDay,
}: {
  year: number; month: number; selectedDay: number;
  daysWithEntries: Set<number>; daysWithoutEntries: Set<number>;
  today: Date; onSelectDay: (d: number) => void;
}) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const offset    = getFirstDayOffset(year, month);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDay  = isCurrentMonth ? today.getDate() : -1;

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View style={cal.header}>
        {DAY_LABELS.map(l => <Text key={l} style={cal.headerText}>{l}</Text>)}
      </View>
      <View style={cal.grid}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`e-${idx}`} style={cal.cell} />;
          const isToday    = day === todayDay;
          const isSelected = day === selectedDay;
          const hasEntry   = daysWithEntries.has(day);
          const isMissing  = daysWithoutEntries.has(day);
          const isFuture   = isCurrentMonth && day > todayDay;
          return (
            <TouchableOpacity
              key={day} style={cal.cell}
              onPress={() => !isFuture && onSelectDay(day)}
              activeOpacity={0.7}
            >
              <View style={[
                cal.inner,
                isSelected              && cal.selected,
                isToday && !isSelected  && cal.today,
                isMissing && !isSelected && cal.missing,
              ]}>
                <Text style={[
                  cal.text,
                  isSelected              && cal.textSelected,
                  isToday && !isSelected  && cal.textToday,
                  isMissing && !isSelected && cal.textMissing,
                  isFuture                && cal.textFuture,
                ]}>
                  {day}
                </Text>
              </View>
              {hasEntry && !isSelected && <View style={cal.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  header:       { flexDirection: 'row', marginBottom: 6 },
  headerText:   { flex: 1, textAlign: 'center', color: '#42655d', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap' },
  cell:         { width: `${100/7}%`, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  inner:        { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  selected:     { backgroundColor: '#006782' },
  today:        { borderWidth: 1, borderColor: '#86d0ef' },
  missing:      { backgroundColor: 'rgba(239,68,68,0.14)' },
  text:         { color: '#ecf2f3', fontSize: 12, fontWeight: '500' },
  textSelected: { color: 'white', fontWeight: '800' },
  textToday:    { color: '#86d0ef', fontWeight: '700' },
  textMissing:  { color: '#ef4444' },
  textFuture:   { color: 'rgba(111,120,125,0.3)' },
  dot:          { position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: '#22c55e' },
});

// ─── ICONS ────────────────────────────────────────────────────────────────────
function EntryIcon({ type, color, size = 20 }: { type: EntryType; color: string; size?: number }) {
  if (type === 'glucose')  return <Droplets  color={color} size={size} fill={color} />;
  if (type === 'exercise') return <Dumbbell  color={color} size={size} />;
  if (type === 'meal')     return <Utensils  color={color} size={size} />;
  return <Pill color={color} size={size} />;
}

// ─── ENTRY CARD ───────────────────────────────────────────────────────────────
function EntryCard({ entry, onPress, onToggleComplete, onDelete }: {
  entry: AnyEntry; onPress: () => void;
  onToggleComplete: () => void; onDelete: () => void;
}) {
  const color = entryTypeColor(entry.type);
  const time  = entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const mainLine = () => {
    if (entry.type === 'glucose') {
      const g = entry as GlucoseEntry;
      const r = getGlucoseRange(g.value);
      return (
        <View style={ec.row}>
          <Text style={[ec.bigVal, { color: r.color }]}>{g.value}</Text>
          <Text style={ec.unit}> mg/dL</Text>
          <View style={[ec.pill, { backgroundColor: r.bg }]}>
            <Text style={[ec.pillText, { color: r.color }]}>{r.label}</Text>
          </View>
        </View>
      );
    }
    if (entry.type === 'exercise') {
      const e = entry as ExerciseEntry;
      return <Text style={ec.desc}>{e.activity} · <Text style={{ color }}>{e.durationMinutes} min</Text></Text>;
    }
    if (entry.type === 'meal') {
      const m = entry as MealEntry;
      return <Text style={ec.desc}>{m.name} · <Text style={{ color }}>{m.calories} kcal</Text></Text>;
    }
    const med = entry as MedicationEntry;
    return <Text style={ec.desc}>{med.medName} · <Text style={{ color }}>{med.dosage}</Text></Text>;
  };

  return (
    <TouchableOpacity
      style={[ec.card, { borderLeftColor: color }]}
      onPress={onPress} activeOpacity={0.85}
    >
      <View style={[ec.iconBox, { backgroundColor: `${color}18` }]}>
        <EntryIcon type={entry.type} color={color} />
      </View>
      <View style={ec.content}>
        <View style={ec.topRow}>
          <Text style={ec.typeLabel}>{entryTypeLabel(entry.type)}</Text>
          <Text style={ec.time}>{time}</Text>
        </View>
        {mainLine()}
      </View>
      <View style={ec.actions}>
        <TouchableOpacity onPress={onToggleComplete} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          {entry.completed
            ? <CheckCircle2 color="#22c55e" size={20} />
            : <Circle       color="#6f787d" size={20} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Trash2 color="#6f787d" size={15} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const ec = StyleSheet.create({
  card:     { flexDirection: 'row', backgroundColor: '#1d2426', borderRadius: 20, padding: 14, gap: 10, marginBottom: 10, borderLeftWidth: 3, alignItems: 'center' },
  iconBox:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content:  { flex: 1 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  typeLabel:{ color: '#6f787d', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  time:     { color: '#6f787d', fontSize: 10 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bigVal:   { fontSize: 20, fontWeight: '800' },
  unit:     { color: '#6f787d', fontSize: 12 },
  pill:     { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 100 },
  pillText: { fontSize: 9, fontWeight: '800' },
  desc:     { color: '#ecf2f3', fontSize: 14, fontWeight: '600' },
  actions:  { gap: 10, alignItems: 'center' },
});

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[dm.macroPill, { borderColor: `${color}40` }]}>
      <Text style={[dm.macroVal, { color }]}>{value}</Text>
      <Text style={dm.macroLbl}>{label}</Text>
    </View>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={dm.metaBox}>
      <Text style={dm.metaLbl}>{label}</Text>
      <Text style={dm.metaVal}>{value}</Text>
    </View>
  );
}

function DetailModal({ entry, onClose, onToggleComplete, onDelete }: {
  entry: AnyEntry; onClose: () => void;
  onToggleComplete: () => void; onDelete: () => void;
}) {
  const color     = entryTypeColor(entry.type);
  const typeLabel = entryTypeLabel(entry.type);
  const time = entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = entry.timestamp.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

  const heroSection = () => {
    if (entry.type === 'glucose') {
      const g = entry as GlucoseEntry;
      const r = getGlucoseRange(g.value);
      return (
        <>
          <View style={[dm.badge, { backgroundColor: r.bg }]}>
            <Text style={[dm.badgeText, { color: r.color }]}>{r.label.toUpperCase()}</Text>
          </View>
          <Text style={[dm.heroVal, { color: r.color }]}>
            {g.value} <Text style={dm.heroUnit}>mg/dL</Text>
          </Text>
          <Text style={dm.heroSub}>
            {g.source === 'ble' ? '📡 Bluetooth' : g.source === 'nfc' ? '📶 NFC' : '✏️ Manual'}
            {g.deviceName ? `  ·  ${g.deviceName}` : ''}
          </Text>
        </>
      );
    }
    if (entry.type === 'exercise') {
      const e = entry as ExerciseEntry;
      return (
        <>
          <View style={[dm.badge, { backgroundColor: `${color}20` }]}>
            <Text style={[dm.badgeText, { color }]}>EJERCICIO</Text>
          </View>
          <Text style={[dm.heroVal, { color }]}>
            {e.durationMinutes} <Text style={dm.heroUnit}>min</Text>
          </Text>
          <Text style={dm.heroSub}>{e.activity}</Text>
          {!!e.note && <Text style={dm.heroSub}>📝 {e.note}</Text>}
        </>
      );
    }
    if (entry.type === 'meal') {
      const m = entry as MealEntry;
      return (
        <>
          <View style={[dm.badge, { backgroundColor: `${color}20` }]}>
            <Text style={[dm.badgeText, { color }]}>{m.category.toUpperCase()}</Text>
          </View>
          <Text style={[dm.heroVal, { color }]}>
            {m.calories} <Text style={dm.heroUnit}>kcal</Text>
          </Text>
          <Text style={dm.heroSub}>{m.name}</Text>
          <View style={dm.macroRow}>
            <MacroPill label="Carbs"   value={`${m.carbs}g`}   color="#86d0ef" />
            <MacroPill label="Proteína" value={`${m.protein}g`} color="#22c55e" />
            <MacroPill label="Grasa"   value={`${m.fat}g`}     color="#f59e0b" />
          </View>
        </>
      );
    }
    const med = entry as MedicationEntry;
    return (
      <>
        <View style={[dm.badge, { backgroundColor: `${color}20` }]}>
          <Text style={[dm.badgeText, { color }]}>{med.medType.toUpperCase()}</Text>
        </View>
        <Text style={[dm.heroVal, { color }]}>{med.dosage}</Text>
        <Text style={dm.heroSub}>{med.medName}</Text>
        {!!med.zone && <Text style={dm.heroSub}>📍 Zona: {med.zone}</Text>}
      </>
    );
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={dm.overlay}>
        <View style={dm.sheet}>
          <View style={dm.handle} />

          <View style={dm.sheetHeader}>
            <Text style={dm.sheetTitle}>Detalle · {typeLabel}</Text>
            <TouchableOpacity onPress={onClose} style={dm.closeBtn}>
              <X color="#6f787d" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Hero */}
            <View style={[dm.heroCard, { backgroundColor: `${color}10`, borderColor: `${color}25` }]}>
              {heroSection()}
            </View>

            {/* Meta */}
            <View style={dm.metaRow}>
              <MetaBox label="Fecha" value={date} />
              <MetaBox label="Hora"  value={time} />
            </View>

            {/* Completado */}
            <TouchableOpacity
              style={[dm.completedBtn, entry.completed && dm.completedBtnActive]}
              onPress={onToggleComplete}
            >
              {entry.completed
                ? <CheckCircle2 color="#22c55e" size={24} />
                : <Circle       color="#6f787d" size={24} />}
              <View>
                <Text style={dm.completedTitle}>
                  {entry.completed ? 'Completado ✓' : 'Marcar como completado'}
                </Text>
                <Text style={dm.completedSub}>
                  {entry.completed ? 'Toca para desmarcar' : 'Confirma que fue realizado'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Eliminar */}
            <TouchableOpacity
              style={dm.deleteBtn}
              onPress={() =>
                Alert.alert('Eliminar registro', '¿Estás seguro?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => { onDelete(); onClose(); } },
                ])
              }
            >
              <Trash2 color="#ef4444" size={17} />
              <Text style={dm.deleteBtnText}>Eliminar este registro</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#171d1e', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, maxHeight: '88%' },
  handle:         { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sheetTitle:     { color: '#ecf2f3', fontSize: 18, fontWeight: '700' },
  closeBtn:       { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100 },
  heroCard:       { borderRadius: 24, padding: 22, marginBottom: 14, borderWidth: 1 },
  badge:          { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, marginBottom: 10 },
  badgeText:      { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  heroVal:        { fontSize: 48, fontWeight: '800' },
  heroUnit:       { fontSize: 18, fontWeight: '400', color: '#6f787d' },
  heroSub:        { color: '#6f787d', fontSize: 12, marginTop: 4 },
  macroRow:       { flexDirection: 'row', gap: 8, marginTop: 12 },
  macroPill:      { flex: 1, borderWidth: 1, borderRadius: 12, padding: 8, alignItems: 'center' },
  macroVal:       { fontSize: 14, fontWeight: '800' },
  macroLbl:       { color: '#6f787d', fontSize: 9, fontWeight: '700' },
  metaRow:        { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metaBox:        { flex: 1, backgroundColor: '#1d2426', borderRadius: 16, padding: 14 },
  metaLbl:        { color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  metaVal:        { color: '#ecf2f3', fontSize: 13, fontWeight: '700' },
  completedBtn:   { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1d2426', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  completedBtnActive: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.06)' },
  completedTitle: { color: '#ecf2f3', fontSize: 15, fontWeight: '700' },
  completedSub:   { color: '#6f787d', fontSize: 11, marginTop: 2 },
  deleteBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 20, padding: 16 },
  deleteBtnText:  { color: '#ef4444', fontSize: 14, fontWeight: '700' },
});

// ─── FILTER TABS ─────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',        label: 'Todo'       },
  { id: 'glucose',    label: 'Glucosa'    },
  { id: 'exercise',   label: 'Ejercicio'  },
  { id: 'meal',       label: 'Comida'     },
  { id: 'medication', label: 'Medicación' },
] as const;
type Filter = typeof FILTERS[number]['id'];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const router = useRouter();
  const { entries, getDaysWithEntries, getDaysWithoutEntries, getEntriesForDate, markCompleted, deleteEntry } = useAppStore();

  const today = useMemo(() => new Date(), []);
  const [year,       setYear]       = useState(today.getFullYear());
  const [month,      setMonth]      = useState(today.getMonth());
  const [selDay,     setSelDay]     = useState(today.getDate());
  const [filter,     setFilter]     = useState<Filter>('all');
  const [detailEntry, setDetailEntry] = useState<AnyEntry | null>(null);

  const daysWith    = useMemo(() => getDaysWithEntries(year, month),    [getDaysWithEntries, year, month, entries]);
  const daysMissing = useMemo(() => getDaysWithoutEntries(year, month), [getDaysWithoutEntries, year, month, entries]);

  const selDate     = useMemo(() => new Date(year, month, selDay), [year, month, selDay]);
  const allDay      = useMemo(() => getEntriesForDate(selDate), [getEntriesForDate, selDate, entries]);
  const filtered    = useMemo(() =>
    filter === 'all' ? allDay : allDay.filter(e => e.type === filter),
    [allDay, filter]
  );

  const prevMonth = () => {
    if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1);
    setSelDay(1);
  };
  const nextMonth = () => {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth()) return;
    if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1);
    setSelDay(1);
  };

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const isToday        = selDay === today.getDate() && isCurrentMonth;

  const monthGlucose = useMemo(() =>
    entries.filter(e => e.type === 'glucose' && e.timestamp.getFullYear() === year && e.timestamp.getMonth() === month) as GlucoseEntry[],
    [entries, year, month]
  );
  const monthAvg = monthGlucose.length
    ? Math.round(monthGlucose.reduce((s, e) => s + e.value, 0) / monthGlucose.length)
    : null;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#baeaff" size={22} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Historial</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.mainTitle}>Historial</Text>
        <Text style={s.subTitle}>TU PROGRESO Y REGISTROS</Text>

        {/* Calendario */}
        <View style={s.calCard}>
          <View style={s.calHeader}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
              <ChevronLeft color="#86d0ef" size={20} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.monthText}>{MONTH_NAMES[month]} {year}</Text>
              {monthAvg ? <Text style={s.monthStats}>Prom. glucosa: {monthAvg} mg/dL</Text> : null}
            </View>
            <TouchableOpacity onPress={nextMonth} style={[s.navBtn, isCurrentMonth && { opacity: 0.2 }]}>
              <ChevronRight color="#86d0ef" size={20} />
            </TouchableOpacity>
          </View>

          <FullCalendar
            year={year} month={month} selectedDay={selDay}
            daysWithEntries={daysWith} daysWithoutEntries={daysMissing}
            today={today} onSelectDay={setSelDay}
          />

          {/* Leyenda */}
          <View style={s.legend}>
            {[
              { label: 'Con registro',  dotColor: '#22c55e',            type: 'dot'    },
              { label: 'Sin registro',  dotColor: 'rgba(239,68,68,0.5)', type: 'bg'     },
              { label: 'Hoy',           dotColor: '#86d0ef',             type: 'border' },
            ].map(({ label, dotColor, type }) => (
              <View key={label} style={s.legendItem}>
                <View style={[
                  s.legendSwatch,
                  type === 'bg'     && { backgroundColor: dotColor },
                  type === 'border' && { borderWidth: 1.5, borderColor: dotColor },
                ]}>
                  {type === 'dot' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />}
                </View>
                <Text style={s.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[s.filterBtn, filter === f.id && s.filterBtnActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[s.filterText, filter === f.id && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Encabezado del día */}
        <View style={s.dayHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock color="#6f787d" size={13} />
            <Text style={s.dayHeaderText}>
              {isToday ? 'Hoy' : `${selDay} de ${MONTH_NAMES[month]}`}
              {' '}· {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
            </Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => router.push('/LogGlucoseScreen')}>
            <Plus color="#86d0ef" size={15} />
            <Text style={s.addBtnText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de registros */}
        {filtered.length > 0 ? (
          filtered.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onPress={() => setDetailEntry(entry)}
              onToggleComplete={() => markCompleted(entry.id)}
              onDelete={() =>
                Alert.alert('Eliminar', '¿Seguro que deseas eliminar este registro?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => deleteEntry(entry.id) },
                ])
              }
            />
          ))
        ) : (
          <View style={s.emptyBox}>
            <Droplets color="#333b3d" size={28} />
            <Text style={s.emptyTitle}>Sin registros</Text>
            <Text style={s.emptySub}>
              {isCurrentMonth && selDay > today.getDate()
                ? 'Fecha futura'
                : 'No hay datos para este día'}
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {detailEntry && (
        <DetailModal
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
          onToggleComplete={() => {
            markCompleted(detailEntry.id);
            setDetailEntry(prev => prev ? { ...prev, completed: !prev.completed } : null);
          }}
          onDelete={() => deleteEntry(detailEntry.id)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#121212' },
  navbar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:         { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  navTitle:        { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  scroll:          { paddingHorizontal: 20 },
  mainTitle:       { color: '#baeaff', fontSize: 32, fontWeight: '800', marginBottom: 2 },
  subTitle:        { color: '#6f787d', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 20 },
  calCard:         { backgroundColor: '#1a1a1a', borderRadius: 28, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  calHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:          { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(134,208,239,0.08)', alignItems: 'center', justifyContent: 'center' },
  monthText:       { color: '#f5f5f5', fontSize: 16, fontWeight: '700' },
  monthStats:      { color: '#6f787d', fontSize: 10, marginTop: 1 },
  legend:          { flexDirection: 'row', gap: 14, marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch:    { width: 14, height: 14, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  legendText:      { color: '#6f787d', fontSize: 10 },
  filterRow:       { flexDirection: 'row', gap: 8, paddingVertical: 4, marginBottom: 14 },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  filterBtnActive: { backgroundColor: '#006782' },
  filterText:      { color: '#6f787d', fontSize: 12, fontWeight: '700' },
  filterTextActive:{ color: 'white' },
  dayHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayHeaderText:   { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(134,208,239,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  addBtnText:      { color: '#86d0ef', fontSize: 12, fontWeight: '700' },
  emptyBox:        { alignItems: 'center', paddingVertical: 36, gap: 8, backgroundColor: '#1a1a1a', borderRadius: 20 },
  emptyTitle:      { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  emptySub:        { color: '#6f787d', fontSize: 11 },
});
