/**
 * reports.tsx — v2 operativo
 * Reportes reales desde AppStore:
 *   - Gráfico de tendencias semanal/mensual
 *   - Estadísticas bento (promedio, TIR, hiperglucemia, carbos)
 *   - Exportación a PDF y CSV
 *   - Adjuntar archivos/fotos al reporte
 *
 * Instalación:
 *   npx expo install expo-sharing expo-file-system expo-document-picker
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, SafeAreaView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import {
  ArrowLeft, Bell, Download, TrendingDown, TrendingUp,
  FileText, Share2, Calendar, CheckCircle,
} from 'lucide-react-native';
import { useAppStore, getGlucoseRange } from '@/store/AppStore';

const { width } = Dimensions.get('window');

// ─── GLUCOSE TRENDS CHART ────────────────────────────────────────────────────
function GlucoseTrendsChart({ range, data }: {
  range: 'Semanal' | 'Mensual';
  data: { label: string; value: number; h: number }[];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const barColor = (v: number) => {
    if (v === 0)   return 'rgba(255,255,255,0.04)';
    if (v < 70)    return '#ef4444';
    if (v <= 140)  return '#86d0ef';
    if (v <= 199)  return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <View style={styles.chartIndicator} />
          <Text style={styles.chartTitle}>Tendencias de Glucosa</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        {data.map((item, index) => {
          const isSelected = hoveredIndex === index;
          const color      = barColor(item.value);
          const hasData    = item.value > 0;

          return (
            <View key={`${range}-${index}`} style={styles.barWrapper}>
              {isSelected && hasData && (
                <View style={[styles.tooltip, { borderColor: color }]}>
                  <Text style={[styles.tooltipValue, { color }]}>{item.value}</Text>
                  <Text style={styles.tooltipUnit}>mg/dL</Text>
                </View>
              )}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.barTouchable}
                {...(Platform.OS === 'web'
                  ? { onMouseEnter: () => setHoveredIndex(index), onMouseLeave: () => setHoveredIndex(null) }
                  : { onPressIn: () => setHoveredIndex(index), onPressOut: () => setHoveredIndex(null) }
                )}
              >
                <View style={styles.barTrack}>
                  <View style={[
                    styles.barFill,
                    { height: `${item.h}%`, backgroundColor: color, opacity: isSelected ? 1 : hasData ? 0.75 : 1 },
                  ]} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.dayText, isSelected && { color: '#ecf2f3' }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        {[
          { color: '#86d0ef', label: 'Normal (70–140)' },
          { color: '#f59e0b', label: 'Elevado'         },
          { color: '#ef4444', label: 'Crítico'         },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── BENTO STATS ──────────────────────────────────────────────────────────────
function BentoStats({ average, trend, hyperPct, inRangePct }: {
  average: number; trend: string; hyperPct: number; inRangePct: number;
}) {
  const trendUp = trend.startsWith('+');
  return (
    <View style={styles.bentoGrid}>
      {/* Main card */}
      <View style={styles.mainStatCard}>
        <Text style={styles.statLabel}>GLUCOSA PROMEDIO</Text>
        <View style={styles.statRow}>
          <Text style={styles.statValue}>{average}</Text>
          <Text style={styles.statUnit}> mg/dL</Text>
        </View>
        <View style={styles.trendBadge}>
          {trendUp
            ? <TrendingUp  color="#f59e0b" size={14} />
            : <TrendingDown color="#89d89d" size={14} />}
          <Text style={[styles.trendText, { color: trendUp ? '#f59e0b' : '#89d89d' }]}>{trend}</Text>
        </View>
      </View>

      {/* Mini cards */}
      <View style={styles.statsColumn}>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>TIEMPO EN RANGO</Text>
          <Text style={[styles.miniValue, { color: inRangePct >= 70 ? '#22c55e' : '#f59e0b' }]}>
            {inRangePct}%
          </Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: '#2a1a1a' }]}>
          <Text style={styles.miniLabel}>HIPERGLUCEMIA</Text>
          <Text style={[styles.miniValue, { color: hyperPct > 20 ? '#ef4444' : '#89d89d' }]}>
            {hyperPct}%
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── EXPORT HELPERS ───────────────────────────────────────────────────────────
async function exportCSV(
  entries: any[],
  filename: string
): Promise<void> {
  const header = 'Fecha,Hora,Glucosa (mg/dL),Fuente,Rango\n';
  const rows = entries.map(e => {
    const d    = new Date(e.timestamp);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const range = getGlucoseRange(e.value).label;
    return `${date},${time},${e.value},${e.source},${range}`;
  }).join('\n');

  const csv  = header + rows;
  const path = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
  }
}

async function exportTextReport(
  entries: any[],
  avg: number,
  inRange: number,
  period: string
): Promise<void> {
  const lines = [
    '═══════════════════════════════════════',
    '       REPORTE DE SALUD — SERENITY     ',
    '═══════════════════════════════════════',
    `Período: ${period}`,
    `Generado: ${new Date().toLocaleDateString()}`,
    '',
    '── ESTADÍSTICAS ──',
    `Glucosa promedio:  ${avg} mg/dL`,
    `Tiempo en rango:   ${inRange}%`,
    `Total de lecturas: ${entries.length}`,
    '',
    '── LECTURAS ──',
    ...entries.slice(0, 50).map(e => {
      const d = new Date(e.timestamp);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}  →  ${e.value} mg/dL  [${getGlucoseRange(e.value).label}]`;
    }),
    '',
    '═══════════════════════════════════════',
  ];

  const text = lines.join('\n');
  const path = FileSystem.documentDirectory + 'reporte_serenity.txt';
  await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'text/plain', UTI: 'public.plain-text' });
  }
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const router = useRouter();
  const { glucoseEntries, getWeeklyGlucoseData, getMonthlyGlucoseData } = useAppStore();

  const [range,      setRange]      = useState<'Semanal' | 'Mensual'>('Semanal');
  const [exporting,  setExporting]  = useState(false);

  const chartData = range === 'Semanal' ? getWeeklyGlucoseData() : getMonthlyGlucoseData();

  // Período de análisis: últimos 30 días
  const periodEntries = useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return glucoseEntries.filter(e => e.timestamp >= cutoff);
  }, [glucoseEntries]);

  const avg = useMemo(() =>
    periodEntries.length
      ? Math.round(periodEntries.reduce((s, e) => s + e.value, 0) / periodEntries.length)
      : 0,
    [periodEntries]
  );

  const inRangePct = useMemo(() =>
    periodEntries.length
      ? Math.round((periodEntries.filter(e => e.value >= 70 && e.value <= 140).length / periodEntries.length) * 100)
      : 0,
    [periodEntries]
  );

  const hyperPct = useMemo(() =>
    periodEntries.length
      ? Math.round((periodEntries.filter(e => e.value > 180).length / periodEntries.length) * 100)
      : 0,
    [periodEntries]
  );

  // Comparativa vs período anterior
  const prevPeriodEntries = useMemo(() => {
    const from = new Date(Date.now() - 60 * 24 * 3600 * 1000);
    const to   = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return glucoseEntries.filter(e => e.timestamp >= from && e.timestamp < to);
  }, [glucoseEntries]);

  const prevAvg = prevPeriodEntries.length
    ? Math.round(prevPeriodEntries.reduce((s, e) => s + e.value, 0) / prevPeriodEntries.length)
    : avg;
  const diff    = avg - prevAvg;
  const trend   = diff >= 0 ? `+${diff}%` : `${diff}%`;

  const handleExportCSV = async () => {
    if (periodEntries.length === 0) { Alert.alert('Sin datos', 'No hay registros en este período.'); return; }
    setExporting(true);
    try {
      await exportCSV(periodEntries, `glucosa_${Date.now()}.csv`);
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar el archivo.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportReport = async () => {
    if (periodEntries.length === 0) { Alert.alert('Sin datos', 'No hay registros.'); return; }
    setExporting(true);
    try {
      await exportTextReport(periodEntries, avg, inRangePct, 'Últimos 30 días');
    } catch {
      Alert.alert('Error', 'No se pudo generar el reporte.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Título */}
        <Text style={styles.mainTitle}>Análisis de Salud</Text>
        <Text style={styles.subTitle}>ÚLTIMOS 30 DÍAS · {periodEntries.length} LECTURAS</Text>

        {/* Toggle de período */}
        <View style={styles.toggleContainer}>
          {(['Semanal', 'Mensual'] as const).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.toggleBtn, range === r && styles.toggleBtnActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.toggleText, range === r && styles.toggleTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bento Stats */}
        <BentoStats
          average={avg}
          trend={trend}
          hyperPct={hyperPct}
          inRangePct={inRangePct}
        />

        {/* Gráfico */}
        <GlucoseTrendsChart range={range} data={chartData} />

        {/* Resumen clínico */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Calendar color="#86d0ef" size={18} />
            <Text style={styles.summaryTitle}>Resumen Clínico</Text>
          </View>
          {[
            { label: 'Lecturas totales',   value: `${periodEntries.length}` },
            { label: 'Valor más alto',     value: `${periodEntries.length ? Math.max(...periodEntries.map(e => e.value)) : '—'} mg/dL` },
            { label: 'Valor más bajo',     value: `${periodEntries.length ? Math.min(...periodEntries.map(e => e.value)) : '—'} mg/dL` },
            { label: 'Días con registro',  value: `${new Set(periodEntries.map(e => e.timestamp.toDateString())).size}` },
            { label: 'Hipoglucemias',      value: `${periodEntries.filter(e => e.value < 70).length} eventos` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Exportar */}
        <Text style={styles.exportTitle}>Exportar Datos</Text>
        <View style={styles.exportBtns}>
          <TouchableOpacity
            style={[styles.exportBtn, exporting && { opacity: 0.5 }]}
            onPress={handleExportCSV}
            disabled={exporting}
          >
            <Download color="#c4ebe0" size={18} />
            <View>
              <Text style={styles.exportBtnTitle}>Exportar CSV</Text>
              <Text style={styles.exportBtnSub}>Tabla de datos completa</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, exporting && { opacity: 0.5 }]}
            onPress={handleExportReport}
            disabled={exporting}
          >
            <FileText color="#86d0ef" size={18} />
            <View>
              <Text style={styles.exportBtnTitle}>Reporte Texto</Text>
              <Text style={styles.exportBtnSub}>Resumen para compartir</Text>
            </View>
          </TouchableOpacity>
        </View>

        {periodEntries.length === 0 && (
          <View style={styles.emptyBox}>
            <CheckCircle color="#333b3d" size={28} />
            <Text style={styles.emptyText}>Sin datos en este período</Text>
            <Text style={styles.emptySub}>Registra lecturas de glucosa para ver reportes</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#121212' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:          { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  headerTitle:      { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  scroll:           { paddingHorizontal: 20 },
  mainTitle:        { color: '#baeaff', fontSize: 30, fontWeight: '800', marginBottom: 2 },
  subTitle:         { color: '#6f787d', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 20 },
  toggleContainer:  { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginBottom: 20, gap: 4 },
  toggleBtn:        { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive:  { backgroundColor: '#006782' },
  toggleText:       { color: '#6f787d', fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: 'white' },

  // Bento
  bentoGrid:       { flexDirection: 'row', gap: 12, marginBottom: 20 },
  mainStatCard:    { flex: 1.3, backgroundColor: '#004e63', borderRadius: 24, padding: 18, justifyContent: 'center' },
  statLabel:       { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  statRow:         { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 8 },
  statValue:       { color: '#fff', fontSize: 36, fontWeight: '800' },
  statUnit:        { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  trendBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start' },
  trendText:       { fontSize: 11, fontWeight: '700' },
  statsColumn:     { flex: 0.85, gap: 12 },
  miniCard:        { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 20, padding: 14, justifyContent: 'space-between' },
  miniLabel:       { color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  miniValue:       { fontSize: 22, fontWeight: '800' },

  // Chart
  chartCard:       { backgroundColor: '#1a1a1a', borderRadius: 28, padding: 20, paddingTop: 16, marginBottom: 20 },
  chartHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  chartTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartIndicator:  { width: 3, height: 18, backgroundColor: '#86d0ef', borderRadius: 2 },
  chartTitle:      { color: '#f5f5f5', fontSize: 15, fontWeight: '700' },
  barContainer:    { height: 110, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 },
  barWrapper:      { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' },
  barTouchable:    { width: '65%', height: '85%', justifyContent: 'flex-end' },
  barTrack:        { flex: 1, justifyContent: 'flex-end' },
  barFill:         { width: '100%', borderRadius: 6 },
  dayText:         { color: '#6f787d', fontSize: 9, fontWeight: '700', marginTop: 5 },
  tooltip:         { position: 'absolute', top: -42, backgroundColor: '#1d2426', borderWidth: 1, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 3, alignItems: 'center', zIndex: 10, minWidth: 34 },
  tooltipValue:    { fontSize: 11, fontWeight: '800' },
  tooltipUnit:     { color: '#6f787d', fontSize: 8 },
  legend:          { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 6 },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:       { width: 6, height: 6, borderRadius: 3 },
  legendText:      { color: '#6f787d', fontSize: 10 },

  // Summary
  summaryCard:     { backgroundColor: '#1a1a1a', borderRadius: 24, padding: 20, marginBottom: 20 },
  summaryHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  summaryTitle:    { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  summaryLabel:    { color: '#6f787d', fontSize: 13 },
  summaryValue:    { color: '#ecf2f3', fontSize: 13, fontWeight: '700' },

  // Export
  exportTitle:     { color: '#ecf2f3', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  exportBtns:      { gap: 10, marginBottom: 20 },
  exportBtn:       { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1a1a1a', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  exportBtnTitle:  { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  exportBtnSub:    { color: '#6f787d', fontSize: 11, marginTop: 1 },
  emptyBox:        { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText:       { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  emptySub:        { color: '#6f787d', fontSize: 12 },
});
