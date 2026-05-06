/**
 * app/reports.tsx — v4
 * ✅ Genera PDF (HTML) y CSV con datos reales de SQLite + AppStore
 * ✅ Detecta campos vacíos → abre MissingDataModal para completarlos
 * ✅ Comparte por correo, WhatsApp o cualquier app del sistema
 * ✅ Previsualización de estadísticas del mes antes de exportar
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Download, FileText, Droplets,
  Heart, Pill, Calendar, ChevronLeft, ChevronRight,
  Share2, Dumbbell, ClipboardList, Mail, MessageCircle,
  X, CheckCircle2, AlertTriangle, Eye,
} from 'lucide-react-native';
import { useAppStore } from '@/store/AppStore';
import { db_getCurrentUser } from '@/service/database';
import { generateAndShareReport, ReportType, ReportFormat, ReportData } from '@/service/reportService';
import { MissingDataModal } from '@/components/ui/MissingDataModal';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const C = {
  bg:     '#0f1315',
  card:   '#1a2022',
  border: '#2a3335',
  text:   '#ecf2f3',
  sub:    '#6f787d',
  accent: '#86d0ef',
  primary:'#004e63',
  green:  '#22c55e',
  amber:  '#f59e0b',
  red:    '#ef4444',
  purple: '#c4b5fd',
  orange: '#fb923c',
};

// ─── TIPO REPORT DEF ──────────────────────────────────────────────────────────
interface ReportDef {
  id:    ReportType;
  label: string;
  desc:  string;
  icon:  React.ReactNode;
  color: string;
}

const REPORTS: ReportDef[] = [
  { id:'glucemia',   label:'Automonitoreo de Glicemia',   desc:'Tabla diaria de azúcar en sangre con promedios y badges',   icon:<Droplets  color={C.accent}  size={22}/>, color:C.accent  },
  { id:'ejercicio',  label:'Actividad Física',            desc:'Sesiones de ejercicio, duración y tipo de actividad',        icon:<Dumbbell  color={C.green}   size={22}/>, color:C.green   },
  { id:'comidas',    label:'Registro Alimentario',        desc:'Comidas con calorías, carbohidratos, proteína y grasa',      icon:<ClipboardList color={C.amber} size={22}/>, color:C.amber  },
  { id:'medicacion', label:'Medicamentos Crónicos',       desc:'Historial de medicación con dosis y tipo por mes',           icon:<Pill      color={C.purple}  size={22}/>, color:C.purple  },
  { id:'completo',   label:'Reporte Completo de Salud',   desc:'Todos los registros del mes en un solo documento',           icon:<FileText  color={C.orange}  size={22}/>, color:C.orange  },
];

// ─── SHARE OPTIONS MODAL ──────────────────────────────────────────────────────
function ShareOptionsModal({ visible, reportDef, format, onSelect, onClose }: {
  visible: boolean;
  reportDef: ReportDef | null;
  format: ReportFormat;
  onSelect: (via: 'whatsapp'|'email'|'any') => void;
  onClose: () => void;
}) {
  if (!reportDef) return null;

  const OPTIONS = [
    { id:'email' as const,    label:'Correo electrónico', sub:'Abre tu cliente de correo',  icon:<Mail        color="#86d0ef" size={22}/>, color:'#86d0ef' },
    { id:'whatsapp' as const, label:'WhatsApp',           sub:'Comparte con tu médico',      icon:<MessageCircle color="#22c55e" size={22}/>, color:'#22c55e' },
    { id:'any' as const,      label:'Otras apps',         sub:'Mensajes, Drive, Telegram...', icon:<Share2      color={C.amber} size={22}/>, color:C.amber   },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={so.overlay}>
        <View style={so.sheet}>
          <View style={so.handle}/>
          <View style={so.header}>
            <View>
              <Text style={so.title}>Compartir Reporte</Text>
              <Text style={so.sub}>{reportDef.label} · {format.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={so.closeBtn}>
              <X color={C.sub} size={18}/>
            </TouchableOpacity>
          </View>
          {OPTIONS.map(opt => (
            <TouchableOpacity key={opt.id} style={so.optRow} onPress={() => onSelect(opt.id)}>
              <View style={[so.optIcon, { backgroundColor:`${opt.color}15` }]}>
                {opt.icon}
              </View>
              <View style={{ flex:1 }}>
                <Text style={so.optLabel}>{opt.label}</Text>
                <Text style={so.optSub}>{opt.sub}</Text>
              </View>
              <ChevronRight color={C.sub} size={16}/>
            </TouchableOpacity>
          ))}
          <View style={{ height:24 }}/>
        </View>
      </View>
    </Modal>
  );
}

const so = StyleSheet.create({
  overlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet:    { backgroundColor:'#1a2022', borderTopLeftRadius:28, borderTopRightRadius:28, paddingHorizontal:20, paddingTop:12 },
  handle:   { width:36, height:4, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:2, alignSelf:'center', marginBottom:16 },
  header:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  title:    { color:C.text, fontSize:18, fontWeight:'800' },
  sub:      { color:C.sub, fontSize:12, marginTop:2 },
  closeBtn: { padding:8, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:10 },
  optRow:   { flexDirection:'row', alignItems:'center', gap:14, paddingVertical:14, borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:C.border },
  optIcon:  { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center' },
  optLabel: { color:C.text, fontSize:14, fontWeight:'700' },
  optSub:   { color:C.sub, fontSize:11, marginTop:2 },
});

// ─── STAT CHIP ────────────────────────────────────────────────────────────────
function StatChip({ label, value, color }: { label:string; value:string|number; color:string }) {
  return (
    <View style={sc.chip}>
      <Text style={[sc.val, { color }]}>{value}</Text>
      <Text style={sc.lbl}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  chip: { flex:1, backgroundColor:C.card, borderRadius:14, padding:10, alignItems:'center', borderWidth:1, borderColor:C.border },
  val:  { fontSize:15, fontWeight:'800', marginBottom:2 },
  lbl:  { color:C.sub, fontSize:9, fontWeight:'700', textAlign:'center' },
});

// ─── MISSING INDICATOR ────────────────────────────────────────────────────────
function MissingIndicator({ count, onPress }: { count:number; onPress:()=>void }) {
  if (count === 0) return null;
  return (
    <TouchableOpacity style={mi.box} onPress={onPress}>
      <AlertTriangle color={C.amber} size={16}/>
      <Text style={mi.text}>{count} categoría(s) sin datos este mes</Text>
      <Text style={mi.link}>Completar →</Text>
    </TouchableOpacity>
  );
}
const mi = StyleSheet.create({
  box:  { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(245,158,11,0.08)', borderRadius:14, padding:12, marginBottom:16, borderWidth:1, borderColor:'rgba(245,158,11,0.2)', flexWrap:'wrap' },
  text: { color:C.amber, fontSize:12, flex:1, flexWrap:'wrap' },
  link: { color:C.amber, fontSize:12, fontWeight:'800' },
});

// ─── REPORT CARD ──────────────────────────────────────────────────────────────
function ReportCard({
  rep, downloading, onDownload, onShare
}: {
  rep: ReportDef;
  downloading: boolean;
  onDownload: (format: ReportFormat) => void;
  onShare:    (format: ReportFormat) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={rca.card}>
      <TouchableOpacity style={rca.header} onPress={() => setExpanded(v=>!v)} activeOpacity={0.8}>
        <View style={[rca.iconBox, { backgroundColor:`${rep.color}15` }]}>
          {rep.icon}
        </View>
        <View style={rca.info}>
          <Text style={rca.label}>{rep.label}</Text>
          <Text style={rca.desc}>{rep.desc}</Text>
        </View>
        <View style={[rca.expandArrow, expanded && { transform:[{rotate:'90deg'}] }]}>
          <ChevronRight color={C.sub} size={18}/>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={rca.actions}>
          {/* PDF */}
          <View style={rca.formatRow}>
            <View style={rca.formatBadge}>
              <Text style={rca.formatLabel}>📄 PDF</Text>
            </View>
            <TouchableOpacity
              style={[rca.actionBtn, { borderColor: rep.color }]}
              onPress={() => onDownload('pdf')}
              disabled={downloading}
            >
              {downloading
                ? <ActivityIndicator color={rep.color} size="small"/>
                : <><Download color={rep.color} size={15}/><Text style={[rca.actionBtnText,{color:rep.color}]}>Guardar</Text></>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[rca.actionBtn, { borderColor: rep.color }]}
              onPress={() => onShare('pdf')}
              disabled={downloading}
            >
              <Share2 color={rep.color} size={15}/>
              <Text style={[rca.actionBtnText,{color:rep.color}]}>Compartir</Text>
            </TouchableOpacity>
          </View>
          {/* CSV */}
          <View style={rca.formatRow}>
            <View style={[rca.formatBadge, {backgroundColor:'rgba(34,197,94,0.1)'}]}>
              <Text style={[rca.formatLabel,{color:C.green}]}>📊 CSV</Text>
            </View>
            <TouchableOpacity
              style={[rca.actionBtn, { borderColor: C.green }]}
              onPress={() => onDownload('csv')}
              disabled={downloading}
            >
              {downloading
                ? <ActivityIndicator color={C.green} size="small"/>
                : <><Download color={C.green} size={15}/><Text style={[rca.actionBtnText,{color:C.green}]}>Guardar</Text></>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[rca.actionBtn, { borderColor: C.green }]}
              onPress={() => onShare('csv')}
              disabled={downloading}
            >
              <Share2 color={C.green} size={15}/>
              <Text style={[rca.actionBtnText,{color:C.green}]}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const rca = StyleSheet.create({
  card:           { backgroundColor:C.card, borderRadius:20, marginBottom:10, overflow:'hidden', borderWidth:1, borderColor:C.border },
  header:         { flexDirection:'row', alignItems:'center', padding:16, gap:12 },
  iconBox:        { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center' },
  info:           { flex:1 },
  label:          { color:C.text, fontSize:14, fontWeight:'700', marginBottom:3 },
  desc:           { color:C.sub, fontSize:11, lineHeight:16 },
  expandArrow:    { padding:4 },
  actions:        { paddingHorizontal:16, paddingBottom:16, gap:10, borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:C.border, paddingTop:12 },
  formatRow:      { flexDirection:'row', alignItems:'center', gap:8 },
  formatBadge:    { backgroundColor:'rgba(134,208,239,0.1)', paddingHorizontal:10, paddingVertical:5, borderRadius:100 },
  formatLabel:    { color:C.accent, fontSize:11, fontWeight:'800' },
  actionBtn:      { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, paddingHorizontal:12, paddingVertical:7, borderRadius:100 },
  actionBtnText:  { fontSize:12, fontWeight:'700' },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const router = useRouter();
  const { glucoseEntries, exerciseEntries, mealEntries, medicationEntries, documentEntries } = useAppStore();
  const user = db_getCurrentUser();
  const userName = user?.displayName ?? 'Usuario';

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [downloading,   setDownloading]   = useState<string|null>(null);

  // Modales
  const [shareModal,    setShareModal]    = useState<{ rep:ReportDef; format:ReportFormat }|null>(null);
  const [missingModal,  setMissingModal]  = useState(false);
  // Contexto de la acción pendiente (para ejecutar después de completar datos)
  const [pendingAction, setPendingAction] = useState<(()=>void)|null>(null);

  // ── Estadísticas del mes ───────────────────────────────────────────────────
  const monthStats = useMemo(() => {
    const inMonth = (e:any) => {
      const d = new Date(e.timestamp ?? e.uploaded_at);
      return d.getMonth()===selectedMonth && d.getFullYear()===selectedYear;
    };
    const gE = glucoseEntries.filter(inMonth);
    const avg = gE.length ? Math.round(gE.reduce((s,e)=>s+e.value,0)/gE.length) : 0;
    const tir = gE.length ? Math.round(gE.filter(e=>e.value>=70&&e.value<=180).length/gE.length*100) : 0;
    return {
      glucose:  gE.length,
      avgGlu:   avg,
      tir,
      exercise: exerciseEntries.filter(inMonth).length,
      meals:    mealEntries.filter(inMonth).length,
      meds:     medicationEntries.filter(inMonth).length,
    };
  }, [glucoseEntries,exerciseEntries,mealEntries,medicationEntries,selectedMonth,selectedYear]);

  // ── Missing fields ─────────────────────────────────────────────────────────
  const missingFields = useMemo(() => {
    const f: string[] = [];
    if (monthStats.glucose === 0)  f.push('Lecturas de glucosa');
    if (monthStats.exercise === 0) f.push('Registro de ejercicio');
    if (monthStats.meals === 0)    f.push('Registro de comidas');
    if (monthStats.meds === 0)     f.push('Registro de medicación');
    return f;
  }, [monthStats]);

  // ── Construir ReportData ───────────────────────────────────────────────────
  const buildData = useCallback((): ReportData => ({
    userName,
    month:            selectedMonth,
    year:             selectedYear,
    glucoseEntries:   glucoseEntries as any[],
    exerciseEntries:  exerciseEntries as any[],
    mealEntries:      mealEntries as any[],
    medicationEntries:medicationEntries as any[],
    documentEntries:  documentEntries as any[],
  }), [userName,selectedMonth,selectedYear,glucoseEntries,exerciseEntries,mealEntries,medicationEntries,documentEntries]);

  // ── Ejecutar descarga/compartir ────────────────────────────────────────────
  const executeReport = useCallback(async (
    rep:    ReportDef,
    format: ReportFormat,
    via?:   'whatsapp'|'email'|'any'
  ) => {
    const key = `${rep.id}-${format}${via?'-'+via:''}`;
    setDownloading(key);
    try {
      const result = await generateAndShareReport(rep.id, format, buildData(), via);
      if (result.missingFields.length > 0 && !via) {
        // Si hay datos faltantes y es la primera vez → informar
        Alert.alert(
          '⚠️ Datos incompletos',
          `El reporte se generó, pero le faltan datos:\n• ${result.missingFields.join('\n• ')}\n\nPuedes completarlos para mejorar el reporte.`,
          [{ text:'OK' }]
        );
      }
    } catch (e:any) {
      Alert.alert('Error al generar reporte', e?.message ?? 'Intenta de nuevo');
    } finally {
      setDownloading(null);
    }
  }, [buildData]);

  // ── Handlers de botones ───────────────────────────────────────────────────
  const handleDownload = useCallback((rep: ReportDef, format: ReportFormat) => {
    // Si hay datos faltantes → preguntar si completar primero
    if (missingFields.length > 0) {
      Alert.alert(
        '⚠️ Datos faltantes',
        `Faltan ${missingFields.length} categoría(s) sin registros este mes.\n¿Deseas completarlos antes de generar el reporte?`,
        [
          { text:'Completar datos', onPress:() => {
            setPendingAction(() => () => executeReport(rep, format));
            setMissingModal(true);
          }},
          { text:'Generar igual', style:'default', onPress:() => executeReport(rep, format) },
          { text:'Cancelar', style:'cancel' },
        ]
      );
    } else {
      executeReport(rep, format);
    }
  }, [missingFields, executeReport]);

  const handleShare = useCallback((rep: ReportDef, format: ReportFormat) => {
    setShareModal({ rep, format });
  }, []);

  const handleShareVia = useCallback(async (via: 'whatsapp'|'email'|'any') => {
    if (!shareModal) return;
    setShareModal(null);
    await executeReport(shareModal.rep, shareModal.format, via);
  }, [shareModal, executeReport]);

  // ── Navegación de mes ──────────────────────────────────────────────────────
  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y=>y-1); }
    else setSelectedMonth(m=>m-1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y=>y+1); }
    else setSelectedMonth(m=>m+1);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color={C.text} size={22}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Reportes</Text>
        <View style={{ width:38 }}/>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Selector de mes */}
        <View style={s.monthSelector}>
          <TouchableOpacity onPress={prevMonth} style={s.monthBtn}>
            <ChevronLeft color={C.accent} size={24}/>
          </TouchableOpacity>
          <View style={s.monthCenter}>
            <Text style={s.monthText}>{MONTHS[selectedMonth]}</Text>
            <Text style={s.yearText}>{selectedYear}</Text>
          </View>
          <TouchableOpacity onPress={nextMonth} style={s.monthBtn}>
            <ChevronRight color={C.accent} size={24}/>
          </TouchableOpacity>
        </View>

        {/* Estadísticas del mes */}
        <View style={s.statsRow}>
          <StatChip label="GLUCEMIAS"  value={monthStats.glucose}  color={C.accent}/>
          <StatChip label="PROM mg/dL" value={monthStats.avgGlu || '—'} color={monthStats.avgGlu>180?C.red:monthStats.avgGlu>0?C.green:C.sub}/>
          <StatChip label="TIR"        value={`${monthStats.tir}%`} color={monthStats.tir>=70?C.green:C.amber}/>
          <StatChip label="MEDICAC."   value={monthStats.meds}     color={C.purple}/>
        </View>
        <View style={[s.statsRow, { marginTop:8 }]}>
          <StatChip label="EJERCICIOS" value={monthStats.exercise} color={C.green}/>
          <StatChip label="COMIDAS"    value={monthStats.meals}    color={C.amber}/>
        </View>

        {/* Alerta datos faltantes */}
        <MissingIndicator
          count={missingFields.length}
          onPress={() => { setPendingAction(null); setMissingModal(true); }}
        />

        {/* Sección reportes */}
        <Text style={s.sectionTitle}>📋 Exportar Reporte</Text>
        <Text style={s.sectionSub}>
          Genera en PDF (ideal para médicos) o CSV (para Excel/Sheets).
          Comparte por correo o WhatsApp directamente.
        </Text>

        {REPORTS.map(rep => (
          <ReportCard
            key={rep.id}
            rep={rep}
            downloading={!!downloading?.startsWith(rep.id)}
            onDownload={(fmt) => handleDownload(rep, fmt)}
            onShare={(fmt)    => handleShare(rep, fmt)}
          />
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>
            Los reportes se generan con los datos de tu teléfono (SQLite local).
            Para datos en la nube asegúrate de sincronizar primero.
          </Text>
        </View>

        <View style={{ height:60 }}/>
      </ScrollView>

      {/* Modal de compartir */}
      <ShareOptionsModal
        visible={!!shareModal}
        reportDef={shareModal?.rep ?? null}
        format={shareModal?.format ?? 'pdf'}
        onSelect={handleShareVia}
        onClose={() => setShareModal(null)}
      />

      {/* Modal de datos faltantes */}
      <MissingDataModal
        visible={missingModal}
        missingFields={missingFields}
        month={selectedMonth}
        year={selectedYear}
        onClose={() => { setMissingModal(false); setPendingAction(null); }}
        onDone={() => {
          setMissingModal(false);
          // Si había una acción pendiente → ejecutarla
          if (pendingAction) { pendingAction(); setPendingAction(null); }
        }}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:C.bg },
  header:       { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:16, paddingBottom:12 },
  backBtn:      { width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,0.05)', justifyContent:'center', alignItems:'center' },
  headerTitle:  { flex:1, color:C.text, fontSize:20, fontWeight:'800', textAlign:'center' },
  scroll:       { paddingHorizontal:16, paddingTop:8 },
  monthSelector:{ flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:20, padding:4, marginBottom:16, borderWidth:1, borderColor:C.border },
  monthBtn:     { width:46, height:46, justifyContent:'center', alignItems:'center' },
  monthCenter:  { flex:1, alignItems:'center' },
  monthText:    { color:C.text, fontSize:22, fontWeight:'800' },
  yearText:     { color:C.sub, fontSize:12, marginTop:2 },
  statsRow:     { flexDirection:'row', gap:8, marginBottom:4 },
  sectionTitle: { color:C.text, fontSize:17, fontWeight:'800', marginTop:20, marginBottom:6 },
  sectionSub:   { color:C.sub, fontSize:12, lineHeight:18, marginBottom:14 },
  footer:       { backgroundColor:'rgba(255,255,255,0.03)', borderRadius:14, padding:14, marginTop:8 },
  footerText:   { color:C.sub, fontSize:11, lineHeight:17, textAlign:'center' },
});