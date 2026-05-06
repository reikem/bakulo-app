/**
 * RepositoryScreen.tsx — v2
 *
 * FIX CRÍTICO:
 *   ✅ Los documentos se guardan con user_id en Supabase
 *   ✅ Al cargar, se traen SOLO los documentos del usuario autenticado
 *   ✅ Al eliminar, se borra tanto en Supabase como en SQLite local
 *   ✅ SQLite local solo se usa como caché offline
 *   ✅ Al iniciar, sincroniza desde Supabase → SQLite (no al revés)
 *
 * FLUJO CORRECTO:
 *   1. Mount → getSupabaseUserId() → fetch documentos del usuario desde Supabase
 *   2. Upload → upsertDocument(userId, ...) → Supabase primero, luego SQLite local
 *   3. Delete → borrar en Supabase (user_id = auth.uid() via RLS) + SQLite local
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Modal, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker    from 'expo-image-picker';
import * as Sharing        from 'expo-sharing';
import {
  ArrowLeft, Plus, Search, FileText, Image as ImageIcon,
  FileSpreadsheet, Calendar, X, Download, Trash2,
  ChevronLeft, ChevronRight, CloudUpload, RefreshCw,
} from 'lucide-react-native';

import { db_saveDocument, db_getDocuments, db_deleteDocument } from '@/service/database';
import { supabase, upsertDocument, getSupabaseUserId } from '@/service/supabaseClient';
import { generateUUID } from '@/service/database';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface RepoDocument {
  id:          string;
  name:        string;
  type:        'pdf' | 'image' | 'spreadsheet' | 'other';
  uri:         string;
  sizeBytes:   number;
  tags:        string;
  description: string;
  uploadedAt:  Date;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getDocType(name: string, mimeType?: string): RepoDocument['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf' || mimeType === 'application/pdf')        return 'pdf';
  if (['jpg','jpeg','png','heic','webp'].includes(ext) || mimeType?.startsWith('image/')) return 'image';
  if (['xlsx','xls','csv'].includes(ext))                     return 'spreadsheet';
  return 'other';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024*1024)   return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function docColor(type: RepoDocument['type']): string {
  if (type === 'pdf')         return '#ef4444';
  if (type === 'image')       return '#22c55e';
  if (type === 'spreadsheet') return '#eab308';
  return '#86d0ef';
}

function DocIcon({ type, size = 22 }: { type: RepoDocument['type']; size?: number }) {
  if (type === 'pdf')         return <FileText        color="#ef4444" size={size} />;
  if (type === 'image')       return <ImageIcon       color="#22c55e" size={size} />;
  if (type === 'spreadsheet') return <FileSpreadsheet color="#eab308" size={size} />;
  return <FileText color="#86d0ef" size={size} />;
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_LABELS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────

function MiniCalendar({ year, month, markedDays, selectedDay, onSelectDay, onPrevMonth, onNextMonth }: {
  year: number; month: number; markedDays: Set<number>; selectedDay: number | null;
  onSelectDay: (d: number | null) => void; onPrevMonth: () => void; onNextMonth: () => void;
}) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const jsDay     = new Date(year, month, 1).getDay();
  const offset    = jsDay === 0 ? 6 : jsDay - 1;
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <TouchableOpacity onPress={onPrevMonth} style={cal.navBtn}><ChevronLeft color="#86d0ef" size={18}/></TouchableOpacity>
        <Text style={cal.monthText}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={onNextMonth} style={cal.navBtn}><ChevronRight color="#86d0ef" size={18}/></TouchableOpacity>
      </View>
      <View style={cal.daysHeader}>{DAY_LABELS.map(l=><Text key={l} style={cal.dayLabel}>{l}</Text>)}</View>
      <View style={cal.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e-${i}`} style={cal.cell}/>;
          const isSelected = selectedDay === d;
          const hasDoc     = markedDays.has(d);
          return (
            <TouchableOpacity key={d} style={cal.cell} onPress={() => onSelectDay(isSelected ? null : d)}>
              <View style={[cal.inner, isSelected && cal.selected, hasDoc && !isSelected && cal.hasDoc]}>
                <Text style={[cal.dayText, isSelected && cal.dayTextSelected]}>{d}</Text>
              </View>
              {hasDoc && !isSelected && <View style={cal.dot}/>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  container: { backgroundColor:'#1a1a1a', borderRadius:20, padding:14, marginBottom:16 },
  header:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  navBtn:    { padding:6, backgroundColor:'rgba(134,208,239,0.08)', borderRadius:8 },
  monthText: { color:'#f5f5f5', fontSize:14, fontWeight:'700' },
  daysHeader:{ flexDirection:'row', marginBottom:4 },
  dayLabel:  { flex:1, textAlign:'center', color:'#42655d', fontSize:9, fontWeight:'800' },
  grid:      { flexDirection:'row', flexWrap:'wrap' },
  cell:      { width:`${100/7}%`, height:34, alignItems:'center', justifyContent:'center', position:'relative' },
  inner:     { width:26, height:26, borderRadius:8, alignItems:'center', justifyContent:'center' },
  selected:  { backgroundColor:'#006782' },
  hasDoc:    { backgroundColor:'rgba(134,208,239,0.1)' },
  dayText:   { color:'#ecf2f3', fontSize:11, fontWeight:'500' },
  dayTextSelected: { color:'white', fontWeight:'800' },
  dot:       { position:'absolute', bottom:1, width:4, height:4, borderRadius:2, backgroundColor:'#86d0ef' },
});

// ─── DOC CARD ─────────────────────────────────────────────────────────────────

function DocCard({ doc, onOpen, onDelete }: { doc: RepoDocument; onOpen: ()=>void; onDelete: ()=>void }) {
  const color = docColor(doc.type);
  return (
    <TouchableOpacity style={dc.card} onPress={onOpen} activeOpacity={0.85}>
      <View style={[dc.iconBox, { backgroundColor: `${color}18` }]}>
        <DocIcon type={doc.type} size={24}/>
      </View>
      <View style={dc.info}>
        <Text style={dc.name} numberOfLines={1}>{doc.name}</Text>
        <Text style={dc.meta}>{formatDate(doc.uploadedAt)} · {formatBytes(doc.sizeBytes)}</Text>
        {!!doc.description && <Text style={dc.desc} numberOfLines={1}>{doc.description}</Text>}
        {!!doc.tags && (
          <View style={dc.tagRow}>
            {doc.tags.split(',').slice(0,3).map(t=>(
              <View key={t} style={dc.tag}><Text style={dc.tagText}>{t.trim()}</Text></View>
            ))}
          </View>
        )}
      </View>
      <View style={dc.actions}>
        <TouchableOpacity onPress={onOpen}   style={dc.actionBtn}><Download color="#86d0ef" size={16}/></TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={dc.actionBtn}><Trash2   color="#6f787d" size={14}/></TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const dc = StyleSheet.create({
  card:      { flexDirection:'row', backgroundColor:'#1d2426', borderRadius:18, padding:14, gap:12, marginBottom:10, alignItems:'center' },
  iconBox:   { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center' },
  info:      { flex:1 },
  name:      { color:'#ecf2f3', fontSize:14, fontWeight:'700' },
  meta:      { color:'#6f787d', fontSize:11, marginTop:2 },
  desc:      { color:'#bfc8ca', fontSize:11, marginTop:2 },
  tagRow:    { flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:4 },
  tag:       { backgroundColor:'rgba(134,208,239,0.1)', paddingHorizontal:6, paddingVertical:2, borderRadius:6 },
  tagText:   { color:'#86d0ef', fontSize:9, fontWeight:'700' },
  actions:   { gap:8, alignItems:'center' },
  actionBtn: { padding:6 },
});

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────

function UploadModal({ visible, onClose, onUpload, uploading }: {
  visible: boolean; onClose: ()=>void;
  onUpload: (doc: Omit<RepoDocument,'id'>) => void;
  uploading: boolean;
}) {
  const [name,    setName]    = useState('');
  const [desc,    setDesc]    = useState('');
  const [tags,    setTags]    = useState('');
  const [pending, setPending] = useState<{ uri: string; type: RepoDocument['type']; size: number; originalName: string } | null>(null);

  const reset = () => { setName(''); setDesc(''); setTags(''); setPending(null); };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf','image/*','application/vnd.ms-excel','text/csv'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPending({ uri: asset.uri, type: getDocType(asset.name, asset.mimeType ?? ''), size: asset.size ?? 0, originalName: asset.name });
    if (!name) setName(asset.name);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const fname = asset.fileName ?? `imagen_${Date.now()}.jpg`;
    setPending({ uri: asset.uri, type: 'image', size: asset.fileSize ?? 0, originalName: fname });
    if (!name) setName(fname);
  };

  const handleUpload = () => {
    if (!pending) { Alert.alert('Selecciona un archivo primero.'); return; }
    if (!name.trim()) { Alert.alert('Ingresa un nombre.'); return; }
    onUpload({ name: name.trim(), type: pending.type, uri: pending.uri, sizeBytes: pending.size, tags: tags.trim(), description: desc.trim(), uploadedAt: new Date() });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={um.overlay}>
        <View style={um.sheet}>
          <View style={um.handle}/>
          <View style={um.sheetHeader}>
            <Text style={um.title}>Agregar documento</Text>
            <TouchableOpacity onPress={()=>{reset();onClose();}} style={um.closeBtn}>
              <X color="#fff" size={18}/>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={um.pickerRow}>
              <TouchableOpacity style={um.pickBtn} onPress={pickDocument}>
                <FileText color="#86d0ef" size={20}/>
                <Text style={um.pickBtnText}>Documento</Text>
              </TouchableOpacity>
              <TouchableOpacity style={um.pickBtn} onPress={pickImage}>
                <ImageIcon color="#22c55e" size={20}/>
                <Text style={um.pickBtnText}>Foto</Text>
              </TouchableOpacity>
            </View>

            {pending && (
              <View style={um.previewBox}>
                {pending.type === 'image'
                  ? <Image source={{ uri: pending.uri }} style={um.previewImg}/>
                  : <View style={um.previewFile}>
                      <DocIcon type={pending.type} size={28}/>
                      <Text style={um.previewName} numberOfLines={2}>{pending.originalName}</Text>
                    </View>}
                <TouchableOpacity style={um.clearPreview} onPress={()=>setPending(null)}>
                  <X color="#fff" size={14}/>
                </TouchableOpacity>
              </View>
            )}

            <Text style={um.label}>NOMBRE DEL DOCUMENTO</Text>
            <TextInput style={um.input} value={name} onChangeText={setName} placeholder="Ej: Examen de sangre Mayo 2026" placeholderTextColor="#3f484c"/>

            <Text style={um.label}>DESCRIPCIÓN (OPCIONAL)</Text>
            <TextInput style={[um.input,{height:80,textAlignVertical:'top'}]} value={desc} onChangeText={setDesc} placeholder="Notas adicionales..." placeholderTextColor="#3f484c" multiline/>

            <Text style={um.label}>ETIQUETAS (SEPARADAS POR COMAS)</Text>
            <TextInput style={um.input} value={tags} onChangeText={setTags} placeholder="Ej: análisis, glucosa, 2026" placeholderTextColor="#3f484c"/>

            <TouchableOpacity
              style={[um.saveBtn, (!pending || uploading) && { opacity: 0.4 }]}
              onPress={handleUpload}
              disabled={!pending || uploading}
            >
              {uploading
                ? <ActivityIndicator color="#fff"/>
                : <><CloudUpload color="#fff" size={18}/><Text style={um.saveBtnText}>Guardar en Repositorio</Text></>}
            </TouchableOpacity>
            <View style={{ height: 30 }}/>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const um = StyleSheet.create({
  overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.65)', justifyContent:'flex-end' },
  sheet:       { backgroundColor:'#171d1e', borderTopLeftRadius:32, borderTopRightRadius:32, padding:20, maxHeight:'92%' },
  handle:      { width:36, height:4, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:2, alignSelf:'center', marginBottom:18 },
  sheetHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  title:       { color:'#ecf2f3', fontSize:20, fontWeight:'700' },
  closeBtn:    { padding:8, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:100 },
  pickerRow:   { flexDirection:'row', gap:12, marginBottom:16 },
  pickBtn:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#1d2426', borderRadius:16, paddingVertical:14, borderWidth:1, borderColor:'rgba(255,255,255,0.05)' },
  pickBtnText: { color:'#ecf2f3', fontSize:13, fontWeight:'700' },
  previewBox:  { position:'relative', backgroundColor:'#1d2426', borderRadius:16, overflow:'hidden', marginBottom:14, minHeight:80 },
  previewImg:  { width:'100%', height:140, resizeMode:'cover' },
  previewFile: { flexDirection:'row', alignItems:'center', gap:12, padding:16 },
  previewName: { color:'#ecf2f3', fontSize:13, fontWeight:'600', flex:1 },
  clearPreview:{ position:'absolute', top:8, right:8, backgroundColor:'rgba(0,0,0,0.5)', borderRadius:100, padding:4 },
  label:       { color:'#6f787d', fontSize:9, fontWeight:'800', letterSpacing:1, marginBottom:6, marginTop:2 },
  input:       { backgroundColor:'#1d2426', borderRadius:14, padding:14, color:'#fff', marginBottom:12, fontSize:14 },
  saveBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor:'#006782', padding:18, borderRadius:100, marginTop:8 },
  saveBtnText: { color:'#fff', fontWeight:'800', fontSize:15 },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function RepositoryScreen() {
  const router = useRouter();

  const [documents,  setDocuments]  = useState<RepoDocument[]>([]);
  const [userId,     setUserId]     = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [syncing,    setSyncing]    = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [showCal,    setShowCal]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [calYear,    setCalYear]    = useState(new Date().getFullYear());
  const [calMonth,   setCalMonth]   = useState(new Date().getMonth());
  const [selCalDay,  setSelCalDay]  = useState<number | null>(null);
  const [filterType, setFilterType] = useState<RepoDocument['type'] | 'all'>('all');

  // ── 1. Obtener userId y cargar documentos del usuario ─────────────────────
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Obtener el userId del usuario autenticado
      const uid = await getSupabaseUserId();
      setUserId(uid);

      if (uid) {
        // ── FUENTE PRIMARIA: Supabase (filtra por user_id via RLS) ──────────
        const { data, error } = await supabase
          .from('repository_documents')
          .select('id, name, type, uri, size_bytes, tags, description, uploaded_at')
          .eq('user_id', uid)                   // ← FILTRO EXPLÍCITO por usuario
          .order('uploaded_at', { ascending: false });

        if (!error && data) {
          const parsed: RepoDocument[] = data.map((r: any) => ({
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
          setLoading(false);
          return;
        }
      }

      // ── FALLBACK OFFLINE: SQLite local (caché) ───────────────────────────
      // Solo se usa si no hay conexión o no hay userId
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

    } catch (e) {
      console.warn('[Repository] Error cargando:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── 2. Subir documento — guarda con user_id en Supabase ───────────────────
  const handleUpload = useCallback(async (data: Omit<RepoDocument,'id'>) => {
    if (!userId) {
      Alert.alert('Sin sesión', 'Debes iniciar sesión para guardar documentos.');
      return;
    }

    setUploading(true);
    const id = generateUUID();

    try {
      // 2a. Supabase primero (fuente de verdad, con user_id)
      const ok = await upsertDocument({
        id,
        userId,                    // ← SIEMPRE se guarda con el userId del usuario autenticado
        name:        data.name,
        type:        data.type,
        uri:         data.uri,
        sizeBytes:   data.sizeBytes,
        tags:        data.tags,
        description: data.description,
        uploadedAt:  data.uploadedAt,
      });

      if (!ok) {
        console.warn('[Repository] Supabase upload falló, guardando localmente.');
      }

      // 2b. SQLite local como caché offline
      try {
        db_saveDocument({
          id,
          name:        data.name,
          type:        data.type,
          uri:         data.uri,
          base64:      undefined,
          sizeBytes:   data.sizeBytes,
          tags:        data.tags,
          description: data.description,
          uploadedAt:  data.uploadedAt,
        });
      } catch { /* no bloquear si SQLite falla */ }

      // 2c. Actualizar estado local
      const full: RepoDocument = { ...data, id };
      setDocuments(prev => [full, ...prev]);

    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar el documento.');
    } finally {
      setUploading(false);
    }
  }, [userId]);

  // ── 3. Eliminar — borra en Supabase (RLS garantiza solo los propios) ──────
  const handleDelete = useCallback((id: string) => {
    Alert.alert('Eliminar documento', '¿Seguro que deseas eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          // Optimistic update
          setDocuments(prev => prev.filter(d => d.id !== id));

          // Eliminar en Supabase (RLS impide borrar documentos de otros usuarios)
          if (userId) {
            const { error } = await supabase
              .from('repository_documents')
              .delete()
              .eq('id', id)
              .eq('user_id', userId);   // ← doble seguridad además del RLS

            if (error) console.warn('[Repository] Error eliminando en Supabase:', error.message);
          }

          // Eliminar en SQLite local
          try { db_deleteDocument(id); } catch { /* offline */ }
        },
      },
    ]);
  }, [userId]);

  // ── 4. Sincronizar manualmente ────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    await loadDocuments();
    setSyncing(false);
  };

  const handleOpen = useCallback(async (doc: RepoDocument) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(doc.uri, {
        mimeType: doc.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
      });
    } else {
      Alert.alert('Archivo', `${doc.name}\n${formatBytes(doc.sizeBytes)}`);
    }
  }, []);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const markedDays = useMemo(() => {
    const days = new Set<number>();
    documents.forEach(d => {
      if (d.uploadedAt.getFullYear() === calYear && d.uploadedAt.getMonth() === calMonth) {
        days.add(d.uploadedAt.getDate());
      }
    });
    return days;
  }, [documents, calYear, calMonth]);

  const filtered = useMemo(() => {
    let list = [...documents];
    if (filterType !== 'all') list = list.filter(d => d.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.toLowerCase().includes(q)
      );
    }
    if (selCalDay !== null) {
      list = list.filter(d =>
        d.uploadedAt.getFullYear() === calYear &&
        d.uploadedAt.getMonth()    === calMonth &&
        d.uploadedAt.getDate()     === selCalDay
      );
    }
    return list.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }, [documents, filterType, search, selCalDay, calYear, calMonth]);

  const FILTER_TABS = [
    { id: 'all',         label: 'Todo'  },
    { id: 'pdf',         label: 'PDFs'  },
    { id: 'image',       label: 'Fotos' },
    { id: 'spreadsheet', label: 'Hojas' },
    { id: 'other',       label: 'Otros' },
  ] as const;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <Stack.Screen options={{ headerShown: false }}/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.backBtn}>
          <ArrowLeft color="#ecf2f3" size={22}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Repositorio Médico</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={handleSync} style={s.iconBtn} disabled={syncing}>
            {syncing
              ? <ActivityIndicator color="#86d0ef" size="small"/>
              : <RefreshCw color="#86d0ef" size={18}/>}
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setShowCal(v=>!v)} style={s.iconBtn}>
            <Calendar color={showCal ? '#baeaff' : '#86d0ef'} size={18}/>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sin sesión */}
      {!userId && !loading && (
        <View style={s.noSessionBanner}>
          <Text style={s.noSessionText}>
            ⚠️ Sin sesión activa — los documentos se guardan solo localmente.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Calendario */}
        {showCal && (
          <MiniCalendar
            year={calYear} month={calMonth} markedDays={markedDays}
            selectedDay={selCalDay} onSelectDay={setSelCalDay}
            onPrevMonth={()=>{ if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }}
            onNextMonth={()=>{ if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }}
          />
        )}

        {/* Búsqueda */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Search color="#6f787d" size={16}/>
            <TextInput style={s.searchInput} placeholder="Buscar documentos..."
              placeholderTextColor="#3f484c" value={search} onChangeText={setSearch}/>
            {!!search && <TouchableOpacity onPress={()=>setSearch('')}><X color="#6f787d" size={14}/></TouchableOpacity>}
          </View>
        </View>

        {/* Filtros por tipo */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity key={tab.id} style={[s.filterChip, filterType===tab.id && s.filterChipActive]}
              onPress={()=>setFilterType(tab.id as any)}>
              <Text style={[s.filterChipText, filterType===tab.id && s.filterChipTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats */}
        <View style={s.statsRow}>
          <Text style={s.statsText}>
            {filtered.length} documento{filtered.length !== 1 ? 's' : ''}
            {filterType !== 'all' ? ` · ${FILTER_TABS.find(t=>t.id===filterType)?.label}` : ''}
            {selCalDay ? ` · ${selCalDay} ${MONTH_NAMES[calMonth]}` : ''}
          </Text>
          {selCalDay && (
            <TouchableOpacity onPress={()=>setSelCalDay(null)}>
              <Text style={s.clearFilter}>Limpiar filtro ×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista */}
        {loading ? (
          <View style={s.emptyWrap}>
            <ActivityIndicator color="#86d0ef" size="large"/>
            <Text style={s.emptyText}>Cargando documentos...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>📂</Text>
            <Text style={s.emptyTitle}>
              {search ? 'Sin resultados' : 'Sin documentos aún'}
            </Text>
            <Text style={s.emptyBody}>
              {search
                ? 'Intenta con otro término de búsqueda.'
                : 'Toca el botón + para agregar tu primer documento médico.'}
            </Text>
          </View>
        ) : (
          filtered.map(doc => (
            <DocCard key={doc.id} doc={doc}
              onOpen={() => handleOpen(doc)}
              onDelete={() => handleDelete(doc.id)}/>
          ))
        )}

        <View style={{ height: 100 }}/>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={()=>setShowModal(true)} activeOpacity={0.85}>
        <Plus color="#fff" size={26}/>
      </TouchableOpacity>

      {/* Modal de subida */}
      <UploadModal
        visible={showModal}
        onClose={()=>setShowModal(false)}
        onUpload={handleUpload}
        uploading={uploading}
      />
    </SafeAreaView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:        { flex:1, backgroundColor:'#0f1315' },
  header:           { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:16, paddingBottom:12, gap:12 },
  backBtn:          { width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,0.05)', justifyContent:'center', alignItems:'center' },
  headerTitle:      { flex:1, color:'#ecf2f3', fontSize:20, fontWeight:'800' },
  headerRight:      { flexDirection:'row', gap:8 },
  iconBtn:          { width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,0.05)', justifyContent:'center', alignItems:'center' },
  noSessionBanner:  { marginHorizontal:16, marginBottom:8, backgroundColor:'rgba(245,158,11,0.1)', borderRadius:12, padding:10, borderWidth:1, borderColor:'rgba(245,158,11,0.25)' },
  noSessionText:    { color:'#f59e0b', fontSize:12, textAlign:'center' },
  scroll:           { paddingHorizontal:16, paddingTop:8 },
  searchRow:        { marginBottom:12 },
  searchBox:        { flexDirection:'row', alignItems:'center', backgroundColor:'#1a1a1a', borderRadius:14, paddingHorizontal:14, height:44, gap:10 },
  searchInput:      { flex:1, color:'#ecf2f3', fontSize:14 },
  filterScroll:     { marginBottom:12 },
  filterRow:        { flexDirection:'row', gap:8, paddingRight:8 },
  filterChip:       { paddingHorizontal:14, paddingVertical:7, borderRadius:100, backgroundColor:'#1a1a1a', borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  filterChipActive: { backgroundColor:'#004e63', borderColor:'#006782' },
  filterChipText:   { color:'#6f787d', fontSize:12, fontWeight:'700' },
  filterChipTextActive: { color:'#baeaff' },
  statsRow:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  statsText:        { color:'#42655d', fontSize:12, fontWeight:'600' },
  clearFilter:      { color:'#86d0ef', fontSize:12, fontWeight:'700' },
  emptyWrap:        { alignItems:'center', paddingTop:60, gap:12 },
  emptyEmoji:       { fontSize:48 },
  emptyTitle:       { color:'#ecf2f3', fontSize:18, fontWeight:'800' },
  emptyBody:        { color:'#6f787d', fontSize:13, textAlign:'center', lineHeight:20, paddingHorizontal:24 },
  emptyText:        { color:'#6f787d', fontSize:14, textAlign:'center', marginTop:8 },
  fab:              { position:'absolute', bottom:30, right:20, width:58, height:58, borderRadius:29, backgroundColor:'#004e63', justifyContent:'center', alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.4, shadowRadius:8, elevation:8 },
});