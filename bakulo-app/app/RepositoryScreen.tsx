/**
 * RepositoryScreen.tsx
 * Repositorio de documentos médicos:
 *   - PDFs, fotos, recetas, exámenes
 *   - Subida desde galería o documentos
 *   - Buscador por nombre
 *   - Filtro por fecha (calendario)
 *   - Persistencia SQLite + MongoDB
 *
 * Instalación:
 *   npx expo install expo-document-picker expo-image-picker expo-sharing expo-file-system
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Modal, Alert, FlatList, Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import {
  ArrowLeft, Plus, Search, FileText, Image as ImageIcon,
  FileSpreadsheet, Calendar, X, Download, Trash2,
  ChevronLeft, ChevronRight, Filter,
} from 'lucide-react-native';
import { db_saveDocument, db_getDocuments, db_deleteDocument } from '@/service/database';
import { MongoAdapter } from '@/service/database';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface RepoDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'spreadsheet' | 'other';
  uri: string;
  sizeBytes: number;
  tags: string;
  description: string;
  uploadedAt: Date;
}

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DAY_LABELS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

// ─── FILE TYPE HELPERS ────────────────────────────────────────────────────────
function getDocType(name: string, mimeType?: string): RepoDocument['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext) || mimeType === 'application/pdf') return 'pdf';
  if (['jpg','jpeg','png','heic','webp'].includes(ext) || mimeType?.startsWith('image/')) return 'image';
  if (['xlsx','xls','csv'].includes(ext)) return 'spreadsheet';
  return 'other';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── DOC ICON ─────────────────────────────────────────────────────────────────
function DocIcon({ type, size = 22 }: { type: RepoDocument['type']; size?: number }) {
  if (type === 'pdf')         return <FileText        color="#ef4444" size={size} />;
  if (type === 'image')       return <ImageIcon       color="#22c55e" size={size} />;
  if (type === 'spreadsheet') return <FileSpreadsheet color="#22c55e" size={size} />;
  return <FileText color="#86d0ef" size={size} />;
}

function docColor(type: RepoDocument['type']): string {
  if (type === 'pdf')         return '#ef4444';
  if (type === 'image')       return '#22c55e';
  if (type === 'spreadsheet') return '#22c55e';
  return '#86d0ef';
}

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────
function MiniCalendar({
  year, month, markedDays, selectedDay,
  onSelectDay, onPrevMonth, onNextMonth,
}: {
  year: number; month: number;
  markedDays: Set<number>; selectedDay: number | null;
  onSelectDay: (d: number | null) => void;
  onPrevMonth: () => void; onNextMonth: () => void;
}) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const jsDay     = new Date(year, month, 1).getDay();
  const offset    = jsDay === 0 ? 6 : jsDay - 1;
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <TouchableOpacity onPress={onPrevMonth} style={cal.navBtn}>
          <ChevronLeft color="#86d0ef" size={18} />
        </TouchableOpacity>
        <Text style={cal.monthText}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={onNextMonth} style={cal.navBtn}>
          <ChevronRight color="#86d0ef" size={18} />
        </TouchableOpacity>
      </View>
      <View style={cal.daysHeader}>
        {DAY_LABELS.map(l => <Text key={l} style={cal.dayLabel}>{l}</Text>)}
      </View>
      <View style={cal.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e-${i}`} style={cal.cell} />;
          const isSelected = selectedDay === d;
          const hasDoc     = markedDays.has(d);
          return (
            <TouchableOpacity
              key={d} style={cal.cell}
              onPress={() => onSelectDay(isSelected ? null : d)}
            >
              <View style={[cal.inner, isSelected && cal.selected, hasDoc && !isSelected && cal.hasDoc]}>
                <Text style={[cal.dayText, isSelected && cal.dayTextSelected]}>{d}</Text>
              </View>
              {hasDoc && !isSelected && <View style={cal.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  container:       { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 14, marginBottom: 16 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn:          { padding: 6, backgroundColor: 'rgba(134,208,239,0.08)', borderRadius: 8 },
  monthText:       { color: '#f5f5f5', fontSize: 14, fontWeight: '700' },
  daysHeader:      { flexDirection: 'row', marginBottom: 4 },
  dayLabel:        { flex: 1, textAlign: 'center', color: '#42655d', fontSize: 9, fontWeight: '800' },
  grid:            { flexDirection: 'row', flexWrap: 'wrap' },
  cell:            { width: `${100/7}%`, height: 34, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  inner:           { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  selected:        { backgroundColor: '#006782' },
  hasDoc:          { backgroundColor: 'rgba(134,208,239,0.1)' },
  dayText:         { color: '#ecf2f3', fontSize: 11, fontWeight: '500' },
  dayTextSelected: { color: 'white', fontWeight: '800' },
  dot:             { position: 'absolute', bottom: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: '#86d0ef' },
});

// ─── DOC CARD ─────────────────────────────────────────────────────────────────
function DocCard({ doc, onOpen, onDelete }: {
  doc: RepoDocument; onOpen: () => void; onDelete: () => void;
}) {
  const color = docColor(doc.type);
  return (
    <TouchableOpacity style={dc.card} onPress={onOpen} activeOpacity={0.85}>
      <View style={[dc.iconBox, { backgroundColor: `${color}18` }]}>
        <DocIcon type={doc.type} size={24} />
      </View>
      <View style={dc.info}>
        <Text style={dc.name} numberOfLines={1}>{doc.name}</Text>
        <Text style={dc.meta}>
          {formatDate(doc.uploadedAt)} · {formatBytes(doc.sizeBytes)}
        </Text>
        {!!doc.description && (
          <Text style={dc.desc} numberOfLines={1}>{doc.description}</Text>
        )}
        {!!doc.tags && (
          <View style={dc.tagRow}>
            {doc.tags.split(',').slice(0,3).map(t => (
              <View key={t} style={dc.tag}>
                <Text style={dc.tagText}>{t.trim()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={dc.actions}>
        <TouchableOpacity onPress={onOpen}   style={dc.actionBtn}><Download color="#86d0ef" size={16} /></TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={dc.actionBtn}><Trash2   color="#6f787d" size={14} /></TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const dc = StyleSheet.create({
  card:       { flexDirection: 'row', backgroundColor: '#1d2426', borderRadius: 18, padding: 14, gap: 12, marginBottom: 10, alignItems: 'center' },
  iconBox:    { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info:       { flex: 1 },
  name:       { color: '#ecf2f3', fontSize: 14, fontWeight: '700' },
  meta:       { color: '#6f787d', fontSize: 11, marginTop: 2 },
  desc:       { color: '#bfc8ca', fontSize: 11, marginTop: 2 },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag:        { backgroundColor: 'rgba(134,208,239,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText:    { color: '#86d0ef', fontSize: 9, fontWeight: '700' },
  actions:    { gap: 8, alignItems: 'center' },
  actionBtn:  { padding: 6 },
});

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
function UploadModal({ visible, onClose, onUpload }: {
  visible: boolean;
  onClose: () => void;
  onUpload: (doc: Omit<RepoDocument,'id'>) => void;
}) {
  const [name,     setName]     = useState('');
  const [desc,     setDesc]     = useState('');
  const [tags,     setTags]     = useState('');
  const [pending,  setPending]  = useState<{ uri: string; type: RepoDocument['type']; size: number; originalName: string } | null>(null);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/vnd.ms-excel', 'text/csv'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPending({
      uri: asset.uri,
      type: getDocType(asset.name, asset.mimeType ?? ''),
      size: asset.size ?? 0,
      originalName: asset.name,
    });
    if (!name) setName(asset.name);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const fname = asset.fileName ?? `imagen_${Date.now()}.jpg`;
    setPending({ uri: asset.uri, type: 'image', size: asset.fileSize ?? 0, originalName: fname });
    if (!name) setName(fname);
  };

  const handleUpload = () => {
    if (!pending) { Alert.alert('Selecciona un archivo primero.'); return; }
    if (!name.trim()) { Alert.alert('Ingresa un nombre.'); return; }
    onUpload({
      name: name.trim(),
      type: pending.type,
      uri: pending.uri,
      sizeBytes: pending.size,
      tags: tags.trim(),
      description: desc.trim(),
      uploadedAt: new Date(),
    });
    // Reset
    setName(''); setDesc(''); setTags(''); setPending(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={um.overlay}>
        <View style={um.sheet}>
          <View style={um.handle} />
          <View style={um.sheetHeader}>
            <Text style={um.title}>Subir Documento</Text>
            <TouchableOpacity onPress={onClose} style={um.closeBtn}>
              <X color="#6f787d" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Selector de archivo */}
            <View style={um.pickerRow}>
              <TouchableOpacity style={um.pickBtn} onPress={pickDocument}>
                <FileText color="#86d0ef" size={22} />
                <Text style={um.pickBtnText}>PDF / Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={um.pickBtn} onPress={pickImage}>
                <ImageIcon color="#22c55e" size={22} />
                <Text style={um.pickBtnText}>Foto / Imagen</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            {pending && (
              <View style={um.previewBox}>
                {pending.type === 'image' ? (
                  <Image source={{ uri: pending.uri }} style={um.previewImg} />
                ) : (
                  <View style={um.previewFile}>
                    <DocIcon type={pending.type} size={32} />
                    <Text style={um.previewName} numberOfLines={1}>{pending.originalName}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => setPending(null)} style={um.clearPreview}>
                  <X color="#6f787d" size={16} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={um.label}>NOMBRE DEL DOCUMENTO</Text>
            <TextInput style={um.input} value={name} onChangeText={setName} placeholder="Ej: Resultado hemoglobina glicosilada" placeholderTextColor="#3f484c" />

            <Text style={um.label}>DESCRIPCIÓN (opcional)</Text>
            <TextInput style={[um.input, { height: 70, textAlignVertical: 'top' }]} value={desc} onChangeText={setDesc} placeholder="Notas adicionales..." placeholderTextColor="#3f484c" multiline />

            <Text style={um.label}>ETIQUETAS (separadas por coma)</Text>
            <TextInput style={um.input} value={tags} onChangeText={setTags} placeholder="Ej: análisis, glucosa, 2026" placeholderTextColor="#3f484c" />

            <TouchableOpacity style={[um.saveBtn, !pending && { opacity: 0.4 }]} onPress={handleUpload}>
              <Text style={um.saveBtnText}>Guardar en Repositorio</Text>
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const um = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#171d1e', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, maxHeight: '92%' },
  handle:      { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:       { color: '#ecf2f3', fontSize: 20, fontWeight: '700' },
  closeBtn:    { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100 },
  pickerRow:   { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1d2426', borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pickBtnText: { color: '#ecf2f3', fontSize: 13, fontWeight: '700' },
  previewBox:  { position: 'relative', backgroundColor: '#1d2426', borderRadius: 16, overflow: 'hidden', marginBottom: 14, minHeight: 80 },
  previewImg:  { width: '100%', height: 140, resizeMode: 'cover' },
  previewFile: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  previewName: { color: '#ecf2f3', fontSize: 13, fontWeight: '600', flex: 1 },
  clearPreview:{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 100, padding: 4 },
  label:       { color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 6, marginTop: 2 },
  input:       { backgroundColor: '#1d2426', borderRadius: 14, padding: 14, color: '#fff', marginBottom: 12, fontSize: 14 },
  saveBtn:     { backgroundColor: '#006782', padding: 18, borderRadius: 100, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function RepositoryScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<RepoDocument[]>([]);
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCal,   setShowCal]   = useState(false);
  const [calYear,   setCalYear]   = useState(new Date().getFullYear());
  const [calMonth,  setCalMonth]  = useState(new Date().getMonth());
  const [selCalDay, setSelCalDay] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<RepoDocument['type'] | 'all'>('all');

  // Cargar desde SQLite al montar
  useEffect(() => {
    const rows = db_getDocuments();
    const parsed: RepoDocument[] = rows.map((r: any) => ({
      id:          r.id,
      name:        r.name,
      type:        r.type as RepoDocument['type'],
      uri:         r.uri,
      sizeBytes:   r.size_bytes ?? 0,
      tags:        r.tags ?? '',
      description: r.description ?? '',
      uploadedAt:  new Date(r.uploaded_at),
    }));
    setDocuments(parsed);
  }, []);

  // Días con documentos (para el calendario)
  const markedDays = useMemo(() => {
    const days = new Set<number>();
    documents.forEach(d => {
      if (d.uploadedAt.getFullYear() === calYear && d.uploadedAt.getMonth() === calMonth) {
        days.add(d.uploadedAt.getDate());
      }
    });
    return days;
  }, [documents, calYear, calMonth]);

  // Filtrado
  const filtered = useMemo(() => {
    let list = [...documents];
    // Filtro por tipo
    if (filterType !== 'all') list = list.filter(d => d.type === filterType);
    // Filtro por búsqueda
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.toLowerCase().includes(q)
      );
    }
    // Filtro por día del calendario
    if (selCalDay !== null) {
      list = list.filter(d =>
        d.uploadedAt.getFullYear() === calYear &&
        d.uploadedAt.getMonth()    === calMonth &&
        d.uploadedAt.getDate()     === selCalDay
      );
    }
    return list.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }, [documents, filterType, search, selCalDay, calYear, calMonth]);

  const handleUpload = useCallback((data: Omit<RepoDocument,'id'>) => {
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const full: RepoDocument = { ...data, id };
    // Guardar SQLite
    db_saveDocument({ ...full, uploadedAt: full.uploadedAt });
    // Intentar MongoDB (async, no bloquea)
    MongoAdapter.uploadDocument({
      id, name: full.name, type: full.type,
      base64: '', metadata: { tags: full.tags, description: full.description },
    }).catch(() => {/* offline, ya está en SQLite */});
    setDocuments(prev => [full, ...prev]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Eliminar documento', '¿Seguro que deseas eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        db_deleteDocument(id);
        setDocuments(prev => prev.filter(d => d.id !== id));
      }},
    ]);
  }, []);

  const handleOpen = useCallback(async (doc: RepoDocument) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(doc.uri, { mimeType: doc.type === 'pdf' ? 'application/pdf' : 'image/jpeg' });
    } else {
      Alert.alert('Vista previa', `Archivo: ${doc.name}\n${formatBytes(doc.sizeBytes)}`);
    }
  }, []);

  const FILTER_TABS = [
    { id: 'all',         label: 'Todo'    },
    { id: 'pdf',         label: 'PDFs'    },
    { id: 'image',       label: 'Fotos'   },
    { id: 'spreadsheet', label: 'Hojas'   },
    { id: 'other',       label: 'Otros'   },
  ] as const;

  return (
    <SafeAreaView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#c4ebe0" size={22} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Repositorio</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={s.uploadBtn}>
          <Plus color="#003746" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.mainTitle}>Documentos Médicos</Text>
        <Text style={s.subTitle}>{documents.length} ARCHIVOS GUARDADOS</Text>

        {/* Búsqueda */}
        <View style={s.searchBar}>
          <Search color="#6f787d" size={18} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por nombre o etiqueta..."
            placeholderTextColor="#6f787d"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X color="#6f787d" size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtro por tipo */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTER_TABS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[s.filterBtn, filterType === f.id && s.filterBtnActive]}
              onPress={() => setFilterType(f.id as any)}
            >
              <Text style={[s.filterText, filterType === f.id && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Toggle calendario */}
        <TouchableOpacity style={s.calendarToggle} onPress={() => setShowCal(v => !v)}>
          <Calendar color="#86d0ef" size={16} />
          <Text style={s.calendarToggleText}>
            {selCalDay
              ? `Filtrando: ${selCalDay} de ${MONTH_NAMES[calMonth]}`
              : 'Filtrar por fecha'}
          </Text>
          {selCalDay && (
            <TouchableOpacity onPress={() => setSelCalDay(null)} style={{ marginLeft: 'auto' }}>
              <X color="#6f787d" size={14} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showCal && (
          <MiniCalendar
            year={calYear} month={calMonth}
            markedDays={markedDays} selectedDay={selCalDay}
            onSelectDay={setSelCalDay}
            onPrevMonth={() => {
              if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); }
              else setCalMonth(m => m-1);
            }}
            onNextMonth={() => {
              if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); }
              else setCalMonth(m => m+1);
            }}
          />
        )}

        {/* Stats rápidos */}
        <View style={s.statsRow}>
          {[
            { label: 'PDFs',   count: documents.filter(d=>d.type==='pdf').length,   color: '#ef4444' },
            { label: 'Fotos',  count: documents.filter(d=>d.type==='image').length,  color: '#22c55e' },
            { label: 'Otros',  count: documents.filter(d=>d.type==='other'||d.type==='spreadsheet').length, color: '#86d0ef' },
          ].map(({ label, count, color }) => (
            <View key={label} style={s.statBox}>
              <Text style={[s.statCount, { color }]}>{count}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Lista de documentos */}
        {filtered.length > 0 ? (
          filtered.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              onOpen={() => handleOpen(doc)}
              onDelete={() => handleDelete(doc.id)}
            />
          ))
        ) : (
          <View style={s.emptyBox}>
            <FileText color="#333b3d" size={36} />
            <Text style={s.emptyTitle}>
              {search || selCalDay || filterType !== 'all'
                ? 'Sin resultados'
                : 'Sin documentos aún'}
            </Text>
            <Text style={s.emptySub}>
              {search || selCalDay || filterType !== 'all'
                ? 'Prueba con otros filtros'
                : 'Toca + para subir tu primer documento'}
            </Text>
            {!search && !selCalDay && filterType === 'all' && (
              <TouchableOpacity style={s.emptyUploadBtn} onPress={() => setShowModal(true)}>
                <Plus color="#003746" size={18} />
                <Text style={s.emptyUploadText}>Subir Documento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <UploadModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onUpload={handleUpload}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#121212' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:            { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  headerTitle:        { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  uploadBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: '#c4ebe0', alignItems: 'center', justifyContent: 'center' },
  scroll:             { paddingHorizontal: 20 },
  mainTitle:          { color: '#baeaff', fontSize: 30, fontWeight: '800', marginBottom: 2 },
  subTitle:           { color: '#6f787d', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 18 },
  searchBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 14, borderRadius: 14, height: 46, gap: 8, marginBottom: 12 },
  searchInput:        { flex: 1, color: '#ecf2f3', fontSize: 14 },
  filterRow:          { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  filterBtnActive:    { backgroundColor: '#006782' },
  filterText:         { color: '#6f787d', fontSize: 12, fontWeight: '700' },
  filterTextActive:   { color: 'white' },
  calendarToggle:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(134,208,239,0.08)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  calendarToggleText: { color: '#86d0ef', fontSize: 13, fontWeight: '600', flex: 1 },
  statsRow:           { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statBox:            { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 14, alignItems: 'center' },
  statCount:          { fontSize: 22, fontWeight: '800' },
  statLabel:          { color: '#6f787d', fontSize: 10, marginTop: 2 },
  emptyBox:           { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle:         { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  emptySub:           { color: '#6f787d', fontSize: 12 },
  emptyUploadBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#c4ebe0', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  emptyUploadText:    { color: '#003746', fontWeight: '800', fontSize: 14 },
});
