/**
 * history.tsx — v4
 * • Todos los tipos de registro: glucosa, ejercicio, comida, medicación
 * • NUEVO: tab "Documentos" — muestra archivos del repositorio (fotos + PDFs)
 * • Visor inline de imágenes y PDF
 * • Calendario 31 días
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, Alert, Image,
  Dimensions, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Plus,
  Droplets, Dumbbell, Utensils, Pill,
  CheckCircle2, Circle, Clock, Trash2, X,
  FileText, Image as ImageIcon, File, FolderOpen, Eye,
} from 'lucide-react-native';
import {
  EntryType, AnyEntry, entryTypeColor, ExerciseEntry,
  MealEntry, MedicationEntry, entryTypeLabel, useAppStore,
} from '@/store/AppStore';
import { GlucoseEntry, getGlucoseRange } from '@/store/GlucoseStore';
import { db_getDocuments } from '@/service/database';

const { width } = Dimensions.get('window');

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface RepoDoc {
  id: string;
  name: string;
  type: string;
  uri: string;
  size_bytes: number;
  tags: string | null;
  description: string | null;
  uploaded_at: string;
}

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
                  cal.dayText,
                  isSelected              && cal.dayTextSelected,
                  isMissing && !isSelected && cal.dayTextMissing,
                  isFuture                && cal.dayTextFuture,
                ]}>
                  {day}
                </Text>
                {hasEntry && !isSelected && <View style={cal.dot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  header:         { flexDirection: 'row', marginBottom: 6 },
  headerText:     { flex: 1, textAlign: 'center', color: '#6f787d', fontSize: 10, fontWeight: '700' },
  grid:           { flexDirection: 'row', flexWrap: 'wrap' },
  cell:           { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  inner:          { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  selected:       { backgroundColor: '#006782' },
  today:          { backgroundColor: 'rgba(0,103,130,0.2)', borderWidth: 1, borderColor: '#006782' },
  missing:        { backgroundColor: 'rgba(186,26,26,0.12)' },
  dayText:        { color: '#ecf2f3', fontSize: 12, fontWeight: '600' },
  dayTextSelected:{ color: '#fff', fontWeight: '800' },
  dayTextMissing: { color: 'rgba(239,68,68,0.6)' },
  dayTextFuture:  { color: '#333b3d' },
  dot:            { width: 4, height: 4, borderRadius: 2, backgroundColor: '#22c55e', marginTop: 1 },
});

// ─── ENTRY CARD ───────────────────────────────────────────────────────────────

function EntryCard({
  entry, onPress, onToggleComplete, onDelete,
}: {
  entry: AnyEntry;
  onPress: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}) {
  const color = entryTypeColor(entry.type as EntryType);
  const label = entryTypeLabel(entry.type as EntryType);
  const time  = entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let title = '';
  let sub   = '';

  if (entry.type === 'glucose') {
    const g = entry as GlucoseEntry & { value: number };
    const r = getGlucoseRange((g as any).value);
    title = `${(g as any).value} mg/dL`;
    sub   = r.label;
  } else if (entry.type === 'exercise') {
    const e = entry as ExerciseEntry;
    title = e.activity;
    sub   = `${e.durationMinutes} min`;
  } else if (entry.type === 'meal') {
    const m = entry as MealEntry;
    title = m.name;
    sub   = `${m.calories} kcal`;
  } else if (entry.type === 'medication') {
    const med = entry as MedicationEntry;
    title = med.medName;
    sub   = med.dosage;
  }

  const mealImageUri = entry.type === 'meal' ? (entry as MealEntry).imageUri : undefined;

  return (
    <TouchableOpacity style={s.entryCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.entryAccent, { backgroundColor: color }]} />
      {/* Meal image thumbnail */}
      {mealImageUri && (
        <Image source={{ uri: mealImageUri }} style={s.entryMealThumb} resizeMode="cover" />
      )}
      <View style={s.entryContent}>
        <View style={s.entryTop}>
          <View style={[s.entryTypeBadge, { backgroundColor: `${color}22` }]}>
            <Text style={[s.entryTypeText, { color }]}>{label}</Text>
          </View>
          <Text style={s.entryTime}>{time}</Text>
        </View>
        <Text style={s.entryTitle}>{title}</Text>
        {sub !== '' && <Text style={s.entrySub}>{sub}</Text>}
      </View>
      <View style={s.entryActions}>
        <TouchableOpacity onPress={onToggleComplete} style={s.actionBtn}>
          {entry.completed
            ? <CheckCircle2 color="#22c55e" size={20} />
            : <Circle       color="#6f787d"  size={20} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={s.actionBtn}>
          <Trash2 color="#6f787d" size={18} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── DOCUMENT CARD ────────────────────────────────────────────────────────────

function DocCard({ doc, onView }: { doc: RepoDoc; onView: () => void }) {
  const isImage = doc.type === 'image';
  const uploadDate = new Date(doc.uploaded_at).toLocaleDateString('es', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const sizeStr = doc.size_bytes < 1024 * 1024
    ? `${(doc.size_bytes / 1024).toFixed(1)} KB`
    : `${(doc.size_bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <View style={s.docCard}>
      {/* Thumbnail */}
      <View style={s.docThumb}>
        {isImage ? (
          <Image source={{ uri: doc.uri }} style={s.docThumbImage} resizeMode="cover" />
        ) : (
          <View style={s.docThumbPdf}>
            <FileText color="#ef4444" size={28} />
          </View>
        )}
      </View>
      <View style={s.docInfo}>
        <Text style={s.docName} numberOfLines={1}>{doc.name}</Text>
        <Text style={s.docMeta}>{uploadDate} · {sizeStr}</Text>
        {doc.tags ? <Text style={s.docTags}>{doc.tags}</Text> : null}
      </View>
      <TouchableOpacity style={s.docViewBtn} onPress={onView} activeOpacity={0.8}>
        <Eye color="#86d0ef" size={18} />
      </TouchableOpacity>
    </View>
  );
}

// ─── IMAGE VIEWER MODAL ───────────────────────────────────────────────────────

function DocViewerModal({ doc, onClose }: { doc: RepoDoc | null; onClose: () => void }) {
  if (!doc) return null;
  const isImage = doc.type === 'image';
  return (
    <Modal visible={!!doc} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={viewer.container}>
        <View style={viewer.header}>
          <Text style={viewer.title} numberOfLines={1}>{doc.name}</Text>
          <TouchableOpacity onPress={onClose} style={viewer.closeBtn}>
            <X color="#ecf2f3" size={22} />
          </TouchableOpacity>
        </View>
        {isImage ? (
          <Image source={{ uri: doc.uri }} style={viewer.image} resizeMode="contain" />
        ) : (
          <View style={viewer.pdfPlaceholder}>
            <FileText color="#ef4444" size={64} />
            <Text style={viewer.pdfName}>{doc.name}</Text>
            <Text style={viewer.pdfHint}>
              Los PDFs se pueden abrir con la app de Files del dispositivo.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const viewer = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a0a' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  title:          { color: '#ecf2f3', fontSize: 16, fontWeight: '700', flex: 1, marginRight: 12 },
  closeBtn:       { padding: 8, backgroundColor: '#1a1a1a', borderRadius: 12 },
  image:          { flex: 1, width: '100%' },
  pdfPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  pdfName:        { color: '#ecf2f3', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  pdfHint:        { color: '#6f787d', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

// ─── DETAIL MODAL (existing entries) ─────────────────────────────────────────

function DetailModal({
  entry, onClose, onToggleComplete, onDelete,
}: {
  entry: AnyEntry;
  onClose: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}) {
  const color = entryTypeColor(entry.type as EntryType);
  const ts    = entry.timestamp.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.handle} />
        <View style={modal.header}>
          <View style={[modal.typeDot, { backgroundColor: color }]} />
          <Text style={modal.title}>{entryTypeLabel(entry.type as EntryType)}</Text>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <X color="#ecf2f3" size={20} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={modal.body}>
          <Text style={modal.ts}>{ts}</Text>
          {entry.type === 'glucose' && (() => {
            const g = entry as any;
            const r = getGlucoseRange(g.value);
            return (
              <>
                <Text style={[modal.mainVal, { color: r.color }]}>{g.value} mg/dL</Text>
                <View style={[modal.badge, { backgroundColor: r.bg }]}>
                  <Text style={[modal.badgeText, { color: r.color }]}>{r.label}</Text>
                </View>
                {g.source && <Text style={modal.row}>Fuente: {g.source}</Text>}
                {g.deviceName && <Text style={modal.row}>Dispositivo: {g.deviceName}</Text>}
                {g.note && <Text style={modal.row}>Nota: {g.note}</Text>}
              </>
            );
          })()}
          {entry.type === 'exercise' && (() => {
            const e = entry as ExerciseEntry;
            return (
              <>
                <Text style={modal.mainVal}>{e.activity}</Text>
                <Text style={modal.row}>Duración: {e.durationMinutes} min</Text>
                {e.note && <Text style={modal.row}>Nota: {e.note}</Text>}
              </>
            );
          })()}
          {entry.type === 'meal' && (() => {
            const m = entry as MealEntry;
            return (
              <>
                {m.imageUri && (
                  <Image
                    source={{ uri: m.imageUri }}
                    style={modal.mealImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={modal.mainVal}>{m.name}</Text>
                <Text style={modal.row}>Categoría: {m.category}</Text>
                <Text style={modal.row}>Calorías: {m.calories} kcal</Text>
                <Text style={modal.row}>Carbos: {m.carbs}g · Proteína: {m.protein}g · Grasa: {m.fat}g</Text>
              </>
            );
          })()}
          {entry.type === 'medication' && (() => {
            const med = entry as MedicationEntry;
            return (
              <>
                <Text style={modal.mainVal}>{med.medName}</Text>
                <Text style={modal.row}>Tipo: {med.medType}</Text>
                <Text style={modal.row}>Dosis: {med.dosage}</Text>
                {med.zone && <Text style={modal.row}>Zona: {med.zone}</Text>}
              </>
            );
          })()}
        </ScrollView>
        <View style={modal.footer}>
          <TouchableOpacity style={modal.footerBtn} onPress={() => { onToggleComplete(); onClose(); }}>
            <CheckCircle2 color="#22c55e" size={18} />
            <Text style={[modal.footerBtnText, { color: '#22c55e' }]}>
              {entry.completed ? 'Marcar pendiente' : 'Marcar completado'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={modal.footerBtnDelete} onPress={() => {
            Alert.alert('Eliminar', '¿Seguro?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => { onDelete(); onClose(); } },
            ]);
          }}>
            <Trash2 color="#ba1a1a" size={18} />
            <Text style={[modal.footerBtnText, { color: '#ba1a1a' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  mealImage:    { width: '100%', height: 200, borderRadius: 20, marginBottom: 8 },
  container:    { flex: 1, backgroundColor: '#171d1e', paddingTop: 12 },
  handle:       { width: 40, height: 4, backgroundColor: '#333b3d', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 10 },
  typeDot:      { width: 12, height: 12, borderRadius: 6 },
  title:        { flex: 1, color: '#ecf2f3', fontSize: 18, fontWeight: '800' },
  closeBtn:     { padding: 8, backgroundColor: '#1d2426', borderRadius: 10 },
  body:         { padding: 24, gap: 10 },
  ts:           { color: '#6f787d', fontSize: 12, marginBottom: 4 },
  mainVal:      { color: '#ecf2f3', fontSize: 28, fontWeight: '800' },
  badge:        { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
  badgeText:    { fontSize: 13, fontWeight: '700' },
  row:          { color: '#bfc8cd', fontSize: 14, lineHeight: 22 },
  footer:       { flexDirection: 'row', gap: 12, padding: 24 },
  footerBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 16, padding: 14 },
  footerBtnDelete:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(186,26,26,0.08)', borderRadius: 16, padding: 14 },
  footerBtnText:{ fontSize: 14, fontWeight: '700' },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const FILTERS: { id: EntryType | 'all'; label: string }[] = [
  { id: 'all',        label: 'Todos'      },
  { id: 'glucose',    label: 'Glucosa'    },
  { id: 'exercise',   label: 'Ejercicio'  },
  { id: 'meal',       label: 'Comida'     },
  { id: 'medication', label: 'Medicación' },
];

// Main tab options
const MAIN_TABS: { id: 'registros' | 'documentos'; label: string }[] = [
  { id: 'registros',  label: 'Registros'   },
  { id: 'documentos', label: 'Documentos'  },
];

export default function HistoryScreen() {
  const router  = useRouter();
  const today   = new Date();
  const { entries, markCompleted, deleteEntry, getDaysWithEntries, getDaysWithoutEntries } = useAppStore();

  const [year,        setYear]        = useState(today.getFullYear());
  const [month,       setMonth]       = useState(today.getMonth());
  const [selDay,      setSelDay]      = useState(today.getDate());
  const [filter,      setFilter]      = useState<EntryType | 'all'>('all');
  const [detailEntry, setDetailEntry] = useState<AnyEntry | null>(null);
  const [mainTab,     setMainTab]     = useState<'registros' | 'documentos'>('registros');

  // Documents state
  const [docs,        setDocs]        = useState<RepoDoc[]>([]);
  const [viewDoc,     setViewDoc]     = useState<RepoDoc | null>(null);

  useEffect(() => {
    if (mainTab === 'documentos') {
      try {
        const loaded = db_getDocuments();
        setDocs(loaded.map(d => ({
          ...d,
          uploaded_at: typeof d.uploaded_at === 'string' ? d.uploaded_at : new Date(d.uploaded_at).toISOString(),
        })));
      } catch {
        setDocs([]);
      }
    }
  }, [mainTab]);

  const daysWithEntries    = getDaysWithEntries(year, month);
  const daysWithoutEntries = getDaysWithoutEntries(year, month);
  const isCurrentMonth     = today.getFullYear() === year && today.getMonth() === month;
  const isToday            = isCurrentMonth && selDay === today.getDate();

  // Days that have documents (for the Documentos calendar)
  const docsForMonth = useMemo(() => {
    const set = new Set<number>();
    docs.forEach(doc => {
      const d = new Date(doc.uploaded_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [docs, year, month]);

  // Docs filtered by selected day (used in Documentos tab)
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      const d = new Date(doc.uploaded_at);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selDay;
    });
  }, [docs, year, month, selDay]);

  const selDate  = new Date(year, month, selDay);
  const filtered = useMemo(() => {
    const dayEntries = entries.filter(e => {
      const d = e.timestamp;
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selDay;
    });
    if (filter === 'all') return dayEntries;
    return dayEntries.filter(e => e.type === filter);
  }, [entries, year, month, selDay, filter]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1);
    setSelDay(1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1);
    setSelDay(1);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Navbar ── */}
      <View style={s.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#86d0ef" size={22} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Historial</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Main tabs ── */}
      <View style={s.mainTabRow}>
        {MAIN_TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.mainTabBtn, mainTab === t.id && s.mainTabBtnActive]}
            onPress={() => setMainTab(t.id)}
          >
            {t.id === 'registros'
              ? <Clock color={mainTab === t.id ? '#fff' : '#6f787d'} size={14} />
              : <FolderOpen color={mainTab === t.id ? '#fff' : '#6f787d'} size={14} />}
            <Text style={[s.mainTabText, mainTab === t.id && s.mainTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ══════════════ TAB: REGISTROS ══════════════ */}
        {mainTab === 'registros' && (
          <>
            <Text style={s.mainTitle}>Historial</Text>
            <Text style={s.subTitle}>REGISTROS DE SALUD</Text>

            {/* Calendario */}
            <View style={s.calCard}>
              <View style={s.calHeader}>
                <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
                  <ChevronLeft color="#86d0ef" size={18} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={s.monthText}>{MONTH_NAMES[month]} {year}</Text>
                  <Text style={s.monthStats}>
                    {daysWithEntries.size} días con registros
                  </Text>
                </View>
                <TouchableOpacity onPress={nextMonth} style={[s.navBtn, isCurrentMonth && { opacity: 0.3 }]}>
                  <ChevronRight color="#86d0ef" size={18} />
                </TouchableOpacity>
              </View>

              <FullCalendar
                year={year} month={month}
                selectedDay={selDay}
                daysWithEntries={daysWithEntries}
                daysWithoutEntries={daysWithoutEntries}
                today={today}
                onSelectDay={setSelDay}
              />

              <View style={s.legend}>
                <View style={s.legendItem}>
                  <View style={[s.legendSwatch, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#22c55e' }} />
                  </View>
                  <Text style={s.legendText}>Con registros</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendSwatch, { backgroundColor: 'rgba(186,26,26,0.12)' }]} />
                  <Text style={s.legendText}>Sin registros</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendSwatch, { backgroundColor: 'rgba(0,103,130,0.2)', borderWidth: 1, borderColor: '#006782' }]} />
                  <Text style={s.legendText}>Hoy</Text>
                </View>
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
          </>
        )}

        {/* ══════════════ TAB: DOCUMENTOS ══════════════ */}
        {mainTab === 'documentos' && (
          <>
            <Text style={s.mainTitle}>Documentos</Text>
            <Text style={s.subTitle}>{docs.length} ARCHIVOS SUBIDOS</Text>

            {/* Calendario de documentos */}
            <View style={s.calCard}>
              <View style={s.calHeader}>
                <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
                  <ChevronLeft color="#86d0ef" size={18} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={s.monthText}>{MONTH_NAMES[month]} {year}</Text>
                  <Text style={s.monthStats}>
                    {docsForMonth.size} días con documentos
                  </Text>
                </View>
                <TouchableOpacity onPress={nextMonth} style={[s.navBtn, isCurrentMonth && { opacity: 0.3 }]}>
                  <ChevronRight color="#86d0ef" size={18} />
                </TouchableOpacity>
              </View>

              <FullCalendar
                year={year} month={month}
                selectedDay={selDay}
                daysWithEntries={docsForMonth}
                daysWithoutEntries={new Set()}
                today={today}
                onSelectDay={setSelDay}
              />

              <View style={s.legend}>
                <View style={s.legendItem}>
                  <View style={[s.legendSwatch, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#22c55e' }} />
                  </View>
                  <Text style={s.legendText}>Tiene documentos</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendSwatch, { backgroundColor: 'rgba(0,103,130,0.2)', borderWidth: 1, borderColor: '#006782' }]} />
                  <Text style={s.legendText}>Seleccionado</Text>
                </View>
              </View>
            </View>

            {/* Header del día seleccionado */}
            <View style={s.docsHeader}>
              <View>
                <Text style={s.dayHeaderText}>
                  {isToday ? 'Hoy' : `${selDay} de ${MONTH_NAMES[month]}`}
                </Text>
                <Text style={[s.subTitle, { marginBottom: 0 }]}>
                  {filteredDocs.length} {filteredDocs.length === 1 ? 'DOCUMENTO' : 'DOCUMENTOS'}
                </Text>
              </View>
              <TouchableOpacity
                style={s.repoBtn}
                onPress={() => router.push('/RepositoryScreen')}
              >
                <Plus color="#86d0ef" size={16} />
                <Text style={s.repoBtnText}>Subir</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de docs del día seleccionado */}
            {filteredDocs.length === 0 ? (
              <View style={s.emptyBox}>
                <FolderOpen color="#333b3d" size={36} />
                <Text style={s.emptyTitle}>
                  {docs.length === 0 ? 'Sin documentos' : 'Sin docs este día'}
                </Text>
                <Text style={s.emptySub}>
                  {docs.length === 0
                    ? 'Sube documentos desde el Repositorio'
                    : 'Selecciona otro día en el calendario'}
                </Text>
                {docs.length === 0 && (
                  <TouchableOpacity
                    style={s.goRepoBtn}
                    onPress={() => router.push('/RepositoryScreen')}
                  >
                    <Text style={s.goRepoBtnText}>Ir al Repositorio</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={{ gap: 12, marginTop: 8 }}>
                {filteredDocs.map(doc => (
                  <DocCard key={doc.id} doc={doc} onView={() => setViewDoc(doc)} />
                ))}
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* Modales */}
      {detailEntry && (
        <DetailModal
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
          onToggleComplete={() => {
            markCompleted(detailEntry.id);
            setDetailEntry(prev => prev ? { ...prev, completed: !prev.completed } : null);
          }}
          onDelete={() => { deleteEntry(detailEntry.id); setDetailEntry(null); }}
        />
      )}
      <DocViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#121212' },
  navbar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:         { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  navTitle:        { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },

  mainTabRow:      { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 4, gap: 4 },
  mainTabBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  mainTabBtnActive:{ backgroundColor: '#006782' },
  mainTabText:     { color: '#6f787d', fontSize: 13, fontWeight: '700' },
  mainTabTextActive:{ color: '#fff' },

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

  emptyBox:        { alignItems: 'center', paddingVertical: 36, gap: 8, backgroundColor: '#1a1a1a', borderRadius: 20, marginTop: 8 },
  emptyTitle:      { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  emptySub:        { color: '#6f787d', fontSize: 11 },
  goRepoBtn:       { marginTop: 8, backgroundColor: 'rgba(0,103,130,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  goRepoBtnText:   { color: '#86d0ef', fontSize: 13, fontWeight: '700' },

  entryCard:       { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 20, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  entryAccent:     { width: 4 },
  entryMealThumb:  { width: 64, height: 64, alignSelf: 'center', borderRadius: 14, marginLeft: 8 },
  entryContent:    { flex: 1, padding: 14, gap: 3 },
  entryTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  entryTypeBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  entryTypeText:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  entryTime:       { color: '#6f787d', fontSize: 11 },
  entryTitle:      { color: '#ecf2f3', fontSize: 15, fontWeight: '700' },
  entrySub:        { color: '#6f787d', fontSize: 12 },
  entryActions:    { justifyContent: 'center', gap: 4, paddingHorizontal: 10 },
  actionBtn:       { padding: 6 },

  docsHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  repoBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(134,208,239,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, marginTop: 8 },
  repoBtnText:     { color: '#86d0ef', fontSize: 13, fontWeight: '700' },

  docCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 },
  docThumb:        { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', backgroundColor: '#252525' },
  docThumbImage:   { width: '100%', height: '100%' },
  docThumbPdf:     { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.08)' },
  docInfo:         { flex: 1, gap: 3 },
  docName:         { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  docMeta:         { color: '#6f787d', fontSize: 11 },
  docTags:         { color: '#86d0ef', fontSize: 10, fontWeight: '600' },
  docViewBtn:      { padding: 10, backgroundColor: 'rgba(134,208,239,0.08)', borderRadius: 12 },
});