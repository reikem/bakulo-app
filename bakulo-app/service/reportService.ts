/**
 * service/reportService.ts
 * Genera reportes en PDF (HTML→compartir) y CSV desde la base de datos.
 * Comparte por correo, WhatsApp o cualquier app del sistema.
 */

// expo-file-system legacy import para compatibilidad SDK 53+
import * as FileSystem from 'expo-file-system/legacy';

import * as Sharing    from 'expo-sharing';
import { Share, Platform } from 'react-native';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export type ReportFormat  = 'pdf' | 'csv';
export type ReportType    = 'glucemia' | 'ejercicio' | 'comidas' | 'medicacion' | 'documentos' | 'completo';

export interface ReportData {
  userName:     string;
  month:        number;   // 0–11
  year:         number;
  glucoseEntries:    any[];
  exerciseEntries:   any[];
  mealEntries:       any[];
  medicationEntries: any[];
  documentEntries:   any[];
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function fmt(d: Date): string {
  return new Date(d).toLocaleDateString('es-CL');
}
function fmtTime(d: Date): string {
  return new Date(d).toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' });
}
function filterByMonth(entries: any[], month: number, year: number) {
  return entries.filter(e => {
    const d = new Date(e.timestamp ?? e.uploaded_at ?? e.created_at);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

// ─── CSS PARA PDF HTML ────────────────────────────────────────────────────────
const PDF_CSS = `
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
.cover { background: linear-gradient(135deg, #004e63 0%, #005229 100%); color: white; padding: 32px 28px; margin-bottom: 24px; border-radius: 0 0 20px 20px; }
.cover h1 { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
.cover .sub { font-size: 13px; opacity: 0.8; margin-bottom: 16px; }
.cover .meta { display: flex; gap: 24px; flex-wrap: wrap; }
.cover .meta span { background: rgba(255,255,255,0.15); border-radius: 100px; padding: 4px 12px; font-size: 11px; }
.section { margin: 0 20px 24px; }
.section-title { font-size: 14px; font-weight: 800; color: #004e63; border-left: 4px solid #004e63; padding: 6px 12px; background: #f0f8fa; border-radius: 0 8px 8px 0; margin-bottom: 12px; }
table { width: 100%; border-collapse: collapse; font-size: 10px; }
thead tr { background: #004e63; color: white; }
th { padding: 8px 6px; text-align: left; font-weight: 700; font-size: 9px; letter-spacing: 0.5px; }
td { padding: 7px 6px; border-bottom: 1px solid #e8eef0; vertical-align: top; }
tr:nth-child(even) td { background: #f8fbfc; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 9px; font-weight: 700; }
.ok   { background: #d1fae5; color: #065f46; }
.warn { background: #fef3c7; color: #92400e; }
.bad  { background: #fee2e2; color: #991b1b; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.stat-box { background: #f0f8fa; border-radius: 12px; padding: 12px; text-align: center; border: 1px solid #e0eef2; }
.stat-box .val { font-size: 20px; font-weight: 800; color: #004e63; }
.stat-box .lbl { font-size: 9px; color: #6f787d; font-weight: 700; margin-top: 3px; }
.empty { text-align: center; padding: 20px; color: #6f787d; font-style: italic; background: #f8fbfc; border-radius: 10px; }
.footer { margin: 24px 20px 12px; border-top: 1px solid #e0eef2; padding-top: 10px; text-align: center; font-size: 9px; color: #aaa; }
.missing { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px; margin-bottom: 14px; }
.missing h3 { color: #c2410c; font-size: 12px; margin-bottom: 6px; }
.missing ul { color: #9a3412; padding-left: 16px; }
.missing li { margin-bottom: 3px; font-size: 10px; }
</style>`;

// ─── CABECERA PDF ─────────────────────────────────────────────────────────────
function pdfHeader(title: string, data: ReportData, missingFields: string[] = []): string {
  const mes = MONTHS[data.month];
  const today = new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' });
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>${PDF_CSS}</head><body>
<div class="cover">
  <h1>${title}</h1>
  <div class="sub">Generado por Serenity App · ${today}</div>
  <div class="meta">
    <span>👤 ${data.userName}</span>
    <span>📅 ${mes} ${data.year}</span>
    <span>🏥 Serenity Health</span>
  </div>
</div>
${missingFields.length > 0 ? `
<div class="section">
  <div class="missing">
    <h3>⚠️ Datos Incompletos</h3>
    <p style="font-size:10px;color:#9a3412;margin-bottom:6px;">Los siguientes campos no tienen registros este mes:</p>
    <ul>${missingFields.map(f=>`<li>${f}</li>`).join('')}</ul>
    <p style="font-size:10px;color:#9a3412;margin-top:6px;">Usa la pantalla de registro para completar tu historial.</p>
  </div>
</div>` : ''}`;
}

const pdfFooter = (data: ReportData) => `
<div class="footer">
  Reporte generado por Serenity App · ${data.userName} · ${MONTHS[data.month]} ${data.year}<br/>
  Este documento es de referencia personal. Consulta siempre a tu profesional de salud.
</div></body></html>`;

// ─── GLUCOSE BADGE ────────────────────────────────────────────────────────────
function glucoseBadge(v: number): string {
  if (v === 0) return '';
  if (v < 70)   return `<span class="badge bad">HIPO ${v}</span>`;
  if (v > 180)  return `<span class="badge warn">HIPER ${v}</span>`;
  return              `<span class="badge ok">OK ${v}</span>`;
}

// ─── GENERADORES PDF ─────────────────────────────────────────────────────────

export function generateGlucosePDF(data: ReportData): string {
  const entries = filterByMonth(data.glucoseEntries, data.month, data.year);
  const daysInMonth = new Date(data.year, data.month + 1, 0).getDate();

  // Agrupar por día
  const byDay: Record<number, number[]> = {};
  entries.forEach(e => {
    const day = new Date(e.timestamp).getDate();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(e.value);
  });

  const avg  = entries.length ? Math.round(entries.reduce((s,e)=>s+e.value,0)/entries.length) : 0;
  const inRange = entries.filter(e=>e.value>=70&&e.value<=180).length;
  const tir  = entries.length ? Math.round(inRange/entries.length*100) : 0;
  const hypo = entries.filter(e=>e.value<70).length;
  const hyper = entries.filter(e=>e.value>180).length;

  const missing: string[] = [];
  if (entries.length === 0) missing.push('Sin lecturas de glucosa este mes');
  else if (entries.length < 10) missing.push(`Solo ${entries.length} lecturas (recomendado: mínimo 30/mes)`);

  const statsHtml = `
<div class="section">
  <div class="stat-grid">
    <div class="stat-box"><div class="val">${entries.length}</div><div class="lbl">LECTURAS</div></div>
    <div class="stat-box"><div class="val" style="color:${avg>180?'#ef4444':avg<70?'#f59e0b':'#22c55e'}">${avg}</div><div class="lbl">PROMEDIO mg/dL</div></div>
    <div class="stat-box"><div class="val" style="color:${tir>=70?'#22c55e':'#f59e0b'}">${tir}%</div><div class="lbl">TIEMPO EN RANGO</div></div>
    <div class="stat-box"><div class="val">${hypo + hyper}</div><div class="lbl">EPISODIOS</div></div>
  </div>
</div>`;

  const rows = Array.from({length: daysInMonth}, (_, i) => {
    const day = i + 1;
    const vals = byDay[day] ?? [];
    const cells = [0,1,2,3,4,5].map(j => `<td>${vals[j] ?? '—'}</td>`).join('');
    const avgDay = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
    return `<tr><td><strong>${day}</strong></td>${cells}<td>${glucoseBadge(avgDay)}</td></tr>`;
  }).join('');

  return pdfHeader('Automonitoreo de Glicemia', data, missing) + statsHtml + `
<div class="section">
  <div class="section-title">📊 Registro Diario — ${MONTHS[data.month]} ${data.year}</div>
  ${entries.length === 0
    ? '<div class="empty">Sin registros de glucosa este mes. Comienza a registrar tus lecturas en el Dashboard.</div>'
    : `<table><thead><tr><th>DÍA</th><th>Ayunas</th><th>Post Desayuno</th><th>Pre Almuerzo</th><th>Post Almuerzo</th><th>Pre Cena</th><th>Post Cena</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`}
</div>` + pdfFooter(data);
}

export function generateExercisePDF(data: ReportData): string {
  const entries = filterByMonth(data.exerciseEntries, data.month, data.year);
  const totalMin = entries.reduce((s,e)=>s+(e.durationMinutes??e.duration_minutes??0),0);

  const missing: string[] = [];
  if (entries.length === 0) missing.push('Sin registros de ejercicio este mes');
  else if (totalMin < 150) missing.push(`Solo ${totalMin} min registrados (OMS recomienda ≥150 min/semana)`);

  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    const mins = e.durationMinutes ?? e.duration_minutes ?? 0;
    return `<tr><td>${fmt(d)}</td><td>${fmtTime(d)}</td><td>${e.activity}</td><td>${mins} min</td><td>${e.note ?? '—'}</td></tr>`;
  }).join('') || '<tr><td colspan="5" class="empty">Sin registros</td></tr>';

  return pdfHeader('Registro de Actividad Física', data, missing) + `
<div class="section">
  <div class="stat-grid">
    <div class="stat-box"><div class="val">${entries.length}</div><div class="lbl">SESIONES</div></div>
    <div class="stat-box"><div class="val">${totalMin}</div><div class="lbl">MINUTOS TOTAL</div></div>
    <div class="stat-box"><div class="val">${entries.length>0?Math.round(totalMin/entries.length):0}</div><div class="lbl">MIN. PROMEDIO</div></div>
    <div class="stat-box"><div class="val">${Math.round(totalMin/60*10)/10}</div><div class="lbl">HORAS TOTAL</div></div>
  </div>
  <div class="section-title">🏃 Historial de Ejercicio — ${MONTHS[data.month]} ${data.year}</div>
  <table><thead><tr><th>FECHA</th><th>HORA</th><th>ACTIVIDAD</th><th>DURACIÓN</th><th>NOTA</th></tr></thead>
  <tbody>${rows}</tbody></table>
</div>` + pdfFooter(data);
}

export function generateMealsPDF(data: ReportData): string {
  const entries = filterByMonth(data.mealEntries, data.month, data.year);
  const totalCal   = entries.reduce((s,e)=>s+(e.calories??0),0);
  const avgCalDay  = entries.length ? Math.round(totalCal / new Set(entries.map(e => new Date(e.timestamp).getDate())).size) : 0;

  const missing: string[] = [];
  if (entries.length === 0) missing.push('Sin registros de comidas este mes');

  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    return `<tr><td>${fmt(d)}</td><td>${fmtTime(d)}</td><td>${e.name}</td><td>${e.category}</td><td>${e.calories??0} kcal</td><td>${e.carbs??0}g</td><td>${e.protein??0}g</td><td>${e.fat??0}g</td></tr>`;
  }).join('') || '<tr><td colspan="8" class="empty">Sin registros</td></tr>';

  return pdfHeader('Registro Alimentario', data, missing) + `
<div class="section">
  <div class="stat-grid">
    <div class="stat-box"><div class="val">${entries.length}</div><div class="lbl">COMIDAS</div></div>
    <div class="stat-box"><div class="val">${totalCal}</div><div class="lbl">CALORÍAS TOTAL</div></div>
    <div class="stat-box"><div class="val">${avgCalDay}</div><div class="lbl">KCAL/DÍA PROM.</div></div>
    <div class="stat-box"><div class="val">${entries.reduce((s,e)=>s+(e.carbs??0),0)}g</div><div class="lbl">CARBOS TOTAL</div></div>
  </div>
  <div class="section-title">🍽️ Historial Alimentario — ${MONTHS[data.month]} ${data.year}</div>
  <table><thead><tr><th>FECHA</th><th>HORA</th><th>ALIMENTO</th><th>CATEGORÍA</th><th>KCAL</th><th>CARBS</th><th>PROTEÍNA</th><th>GRASA</th></tr></thead>
  <tbody>${rows}</tbody></table>
</div>` + pdfFooter(data);
}

export function generateMedicationPDF(data: ReportData): string {
  const entries = filterByMonth(data.medicationEntries, data.month, data.year);

  const missing: string[] = [];
  if (entries.length === 0) missing.push('Sin registros de medicación este mes');

  // Agrupar por medicamento
  const byMed: Record<string, any[]> = {};
  entries.forEach(e => {
    const name = e.medName ?? e.med_name ?? 'Desconocido';
    if (!byMed[name]) byMed[name] = [];
    byMed[name].push(e);
  });

  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    return `<tr><td>${fmt(d)}</td><td>${fmtTime(d)}</td><td><strong>${e.medName??e.med_name}</strong></td><td>${e.medType??e.med_type}</td><td>${e.dosage}</td><td>${e.zone??'—'}</td><td><span class="badge ok">Tomado</span></td></tr>`;
  }).join('') || '<tr><td colspan="7" class="empty">Sin registros</td></tr>';

  const summaryRows = Object.entries(byMed).map(([name, list]) =>
    `<tr><td>${name}</td><td>${list[0]?.dosage??'—'}</td><td>${list.length} veces</td><td>${list[0]?.medType??list[0]?.med_type??'—'}</td></tr>`
  ).join('');

  return pdfHeader('Registro de Medicamentos', data, missing) + `
<div class="section">
  <div class="section-title">💊 Resumen por Medicamento</div>
  ${Object.keys(byMed).length === 0
    ? '<div class="empty">Sin datos de medicación este mes.</div>'
    : `<table><thead><tr><th>MEDICAMENTO</th><th>DOSIS</th><th>TOMAS</th><th>TIPO</th></tr></thead><tbody>${summaryRows}</tbody></table>`}
  <div class="section-title" style="margin-top:16px">📋 Historial Detallado — ${MONTHS[data.month]} ${data.year}</div>
  <table><thead><tr><th>FECHA</th><th>HORA</th><th>MEDICAMENTO</th><th>TIPO</th><th>DOSIS</th><th>ZONA</th><th>ESTADO</th></tr></thead>
  <tbody>${rows}</tbody></table>
</div>` + pdfFooter(data);
}

export function generateCompletePDF(data: ReportData): string {
  const gEntries = filterByMonth(data.glucoseEntries, data.month, data.year);
  const eEntries = filterByMonth(data.exerciseEntries, data.month, data.year);
  const mEntries = filterByMonth(data.mealEntries, data.month, data.year);
  const medEntries = filterByMonth(data.medicationEntries, data.month, data.year);

  const missing: string[] = [];
  if (gEntries.length === 0)   missing.push('Glucosa: sin registros');
  if (eEntries.length === 0)   missing.push('Ejercicio: sin registros');
  if (mEntries.length === 0)   missing.push('Alimentación: sin registros');
  if (medEntries.length === 0) missing.push('Medicación: sin registros');

  const avg = gEntries.length ? Math.round(gEntries.reduce((s,e)=>s+e.value,0)/gEntries.length) : 0;
  const tir = gEntries.length ? Math.round(gEntries.filter(e=>e.value>=70&&e.value<=180).length/gEntries.length*100) : 0;
  const totalExMin = eEntries.reduce((s,e)=>s+(e.durationMinutes??e.duration_minutes??0),0);

  const gRows = gEntries.slice(0,20).map(e =>
    `<tr><td>${fmt(e.timestamp)}</td><td>${fmtTime(e.timestamp)}</td><td>${e.value} mg/dL</td><td>${e.source}</td><td>${glucoseBadge(e.value)}</td></tr>`
  ).join('');
  const mRows = medEntries.slice(0,20).map(e =>
    `<tr><td>${fmt(e.timestamp)}</td><td>${e.medName??e.med_name}</td><td>${e.dosage}</td><td><span class="badge ok">✓</span></td></tr>`
  ).join('');

  return pdfHeader('Reporte Completo de Salud', data, missing) + `
<div class="section">
  <div class="stat-grid">
    <div class="stat-box"><div class="val" style="color:${avg>180?'#ef4444':'#22c55e'}">${avg || '—'}</div><div class="lbl">GLUCOSA PROM.</div></div>
    <div class="stat-box"><div class="val" style="color:${tir>=70?'#22c55e':'#f59e0b'}">${tir}%</div><div class="lbl">TIEMPO EN RANGO</div></div>
    <div class="stat-box"><div class="val">${totalExMin}</div><div class="lbl">MIN. EJERCICIO</div></div>
    <div class="stat-box"><div class="val">${medEntries.length}</div><div class="lbl">MEDICACIONES</div></div>
  </div>
</div>
<div class="section">
  <div class="section-title">🩸 Glucemia (últimas 20)</div>
  ${gEntries.length === 0 ? '<div class="empty">Sin datos</div>' :
  `<table><thead><tr><th>FECHA</th><th>HORA</th><th>VALOR</th><th>FUENTE</th><th>ESTADO</th></tr></thead><tbody>${gRows}</tbody></table>`}
</div>
<div class="section">
  <div class="section-title">💊 Medicación (últimas 20)</div>
  ${medEntries.length === 0 ? '<div class="empty">Sin datos</div>' :
  `<table><thead><tr><th>FECHA</th><th>MEDICAMENTO</th><th>DOSIS</th><th>ESTADO</th></tr></thead><tbody>${mRows}</tbody></table>`}
</div>` + pdfFooter(data);
}

// ─── GENERADORES CSV ──────────────────────────────────────────────────────────
export function generateGlucoseCSV(data: ReportData): string {
  const entries = filterByMonth(data.glucoseEntries, data.month, data.year);
  const header = 'Fecha,Hora,Glucosa (mg/dL),Fuente,Dispositivo,Nota,Estado\n';
  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    const estado = e.value < 70 ? 'Hipoglucemia' : e.value > 180 ? 'Hiperglucemia' : 'Normal';
    return `${fmt(d)},${fmtTime(d)},${e.value},${e.source},${e.deviceName??e.device_name??''},${e.note??''},${estado}`;
  }).join('\n');
  return header + rows;
}

export function generateExerciseCSV(data: ReportData): string {
  const entries = filterByMonth(data.exerciseEntries, data.month, data.year);
  const header = 'Fecha,Hora,Actividad,Duración (min),Nota\n';
  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    return `${fmt(d)},${fmtTime(d)},${e.activity},${e.durationMinutes??e.duration_minutes??0},${e.note??''}`;
  }).join('\n');
  return header + rows;
}

export function generateMealsCSV(data: ReportData): string {
  const entries = filterByMonth(data.mealEntries, data.month, data.year);
  const header = 'Fecha,Hora,Alimento,Categoría,Calorías,Carbs(g),Proteína(g),Grasa(g)\n';
  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    return `${fmt(d)},${fmtTime(d)},${e.name},${e.category},${e.calories??0},${e.carbs??0},${e.protein??0},${e.fat??0}`;
  }).join('\n');
  return header + rows;
}

export function generateMedicationCSV(data: ReportData): string {
  const entries = filterByMonth(data.medicationEntries, data.month, data.year);
  const header = 'Fecha,Hora,Medicamento,Tipo,Dosis,Zona\n';
  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    return `${fmt(d)},${fmtTime(d)},${e.medName??e.med_name},${e.medType??e.med_type},${e.dosage},${e.zone??''}`;
  }).join('\n');
  return header + rows;
}

export function generateCompleteCSV(data: ReportData): string {
  return [
    '=== GLUCEMIA ===',
    generateGlucoseCSV(data),
    '', '=== EJERCICIO ===',
    generateExerciseCSV(data),
    '', '=== COMIDAS ===',
    generateMealsCSV(data),
    '', '=== MEDICACIÓN ===',
    generateMedicationCSV(data),
  ].join('\n');
}

// ─── GUARDAR Y COMPARTIR ──────────────────────────────────────────────────────
export async function saveAndShare(
  content:  string,
  fileName: string,
  mimeType: string,
  via?:     'whatsapp' | 'email' | 'any'
): Promise<void> {
  // Usar documentDirectory como fallback si cacheDirectory no está disponible
  const dir = FileSystem.cacheDirectory
    ?? FileSystem.documentDirectory
    ?? '';
  if (!dir) throw new Error('No se encontró directorio de archivos en este dispositivo');
  const path = `${dir}${fileName}`;

  await FileSystem.writeAsStringAsync(path, content, {
    encoding: 'utf8' as any,  // EncodingType.UTF8 falla en SDK 53 si FileSystem.EncodingType es undefined
  });

  if (via === 'whatsapp') {
    // WhatsApp no acepta compartir archivos directamente en iOS con Share API
    // Usamos expo-sharing que abre el sheet del sistema (usuario elige WhatsApp)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType, UTI:'public.plain-text', dialogTitle:'Compartir por WhatsApp' });
    }
    return;
  }

  if (via === 'email') {
    // En iOS usar mailto:, en Android usar Sharing que abre cliente de correo
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(path, { mimeType, UTI: mimeType === 'text/html' ? 'public.html' : 'public.plain-text' });
    } else {
      await Sharing.shareAsync(path, { mimeType, dialogTitle:'Enviar por correo' });
    }
    return;
  }

  // Compartir genérico — sheet del sistema
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType,
      UTI: mimeType === 'text/html' ? 'public.html' : 'public.plain-text',
      dialogTitle: 'Compartir reporte',
    });
  } else {
    await Share.share({ message: `Reporte generado: ${fileName}`, url: path });
  }
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────
export async function generateAndShareReport(
  type:   ReportType,
  format: ReportFormat,
  data:   ReportData,
  via?:   'whatsapp' | 'email' | 'any'
): Promise<{ success: boolean; missingFields: string[]; filePath?: string }> {
  const mes   = MONTHS[data.month].toLowerCase();
  const year  = data.year;

  let content   = '';
  let fileName  = '';
  let mimeType  = '';
  const missing: string[] = [];

  if (format === 'pdf') {
    switch (type) {
      case 'glucemia':    content = generateGlucosePDF(data);    break;
      case 'ejercicio':   content = generateExercisePDF(data);   break;
      case 'comidas':     content = generateMealsPDF(data);      break;
      case 'medicacion':  content = generateMedicationPDF(data); break;
      default:            content = generateCompletePDF(data);   break;
    }
    fileName = `serenity_${type}_${mes}_${year}.html`;
    mimeType = 'text/html';
  } else {
    switch (type) {
      case 'glucemia':   content = generateGlucoseCSV(data);    break;
      case 'ejercicio':  content = generateExerciseCSV(data);   break;
      case 'comidas':    content = generateMealsCSV(data);      break;
      case 'medicacion': content = generateMedicationCSV(data); break;
      default:           content = generateCompleteCSV(data);   break;
    }
    fileName = `serenity_${type}_${mes}_${year}.csv`;
    mimeType = 'text/csv';
  }

  // Detectar datos faltantes
  const gFiltered = filterByMonth(data.glucoseEntries, data.month, data.year);
  const eFiltered = filterByMonth(data.exerciseEntries, data.month, data.year);
  const mFiltered = filterByMonth(data.mealEntries, data.month, data.year);
  const medFiltered = filterByMonth(data.medicationEntries, data.month, data.year);
  if (gFiltered.length   === 0) missing.push('Lecturas de glucosa');
  if (eFiltered.length   === 0) missing.push('Registro de ejercicio');
  if (mFiltered.length   === 0) missing.push('Registro de comidas');
  if (medFiltered.length === 0) missing.push('Registro de medicación');

  await saveAndShare(content, fileName, mimeType, via);
  return { success: true, missingFields: missing, filePath: fileName };
}