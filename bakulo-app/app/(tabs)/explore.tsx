/**
 * explore.tsx — Diario de Salud + Feed Social
 *
 * ✅ Diario personal: crear entradas con texto + etiquetas de salud
 * ✅ Feed de posts: glucosa, ejercicio, comida, logros
 * ✅ Compartir en redes sociales (Instagram, X/Twitter, WhatsApp, Copiar)
 * ✅ Moderación de contenido: bloquea texto ofensivo antes de publicar
 * ✅ Likes y comentarios locales
 * ✅ Up Next + Insights del día
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Dimensions, Modal, Alert,
  Share, Linking, Platform, KeyboardAvoidingView,
  Image,
} from 'react-native';
import {
  Search, Lightbulb, ChevronRight, Utensils, Droplets,
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Plus, X, Lock, Globe, Tag, Smile, AlertTriangle,
  CheckCircle2, Edit3, Trash2, Clock,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ─── MODERACIÓN DE CONTENIDO ──────────────────────────────────────────────────
// Lista de términos prohibidos. La detección es básica (client-side),
// complementar con moderación server-side antes de producción.

const BLOCKED_TERMS = [
  // Racismo / discriminación
  'negro de mierda','raza inferior','matar negros','odio a los',
  'judíos controlan','gitanos ladrones','indios sucios',
  // Violencia / amenazas
  'te voy a matar','voy a violarte','muerte a','atentado',
  'bomba en','terrorismo','masacre',
  // Contenido sexual explícito
  'pornografía','contenido xxx','foto desnuda','sexo explícito',
  // Acoso
  'suicídate','mátate','eres un basura','eres un inútil',
];

function moderateContent(text: string): { ok: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return {
        ok: false,
        reason: 'Tu publicación contiene contenido que va contra las normas de la comunidad.',
      };
    }
  }
  if (text.trim().length < 3) return { ok: false, reason: 'El texto es demasiado corto.' };
  if (text.length > 1000)     return { ok: false, reason: 'Máximo 1000 caracteres.' };
  return { ok: true };
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type PostTag = 'glucosa' | 'ejercicio' | 'comida' | 'logro' | 'reflexión' | 'medicación';
type PostVisibility = 'private' | 'public';

interface DiaryPost {
  id: string;
  author: string;
  avatar?: string;
  initials?: string;
  avatarColor?: string;
  date: Date;
  content: string;
  tag: PostTag;
  visibility: PostVisibility;
  likes: number;
  likedByMe: boolean;
  comments: number;
  saved: boolean;
  glucoseValue?: number;
}

// ─── DATOS INICIALES ──────────────────────────────────────────────────────────

const TAG_CONFIG: Record<PostTag, { label: string; color: string; bg: string }> = {
  glucosa:    { label: 'Glucosa',    color: '#86d0ef', bg: 'rgba(134,208,239,0.12)' },
  ejercicio:  { label: 'Ejercicio',  color: '#a4f4b7', bg: 'rgba(164,244,183,0.12)' },
  comida:     { label: 'Comida',     color: '#f9c74f', bg: 'rgba(249,199,79,0.12)'  },
  logro:      { label: 'Logro 🏆',   color: '#c4b5fd', bg: 'rgba(196,181,253,0.12)' },
  reflexión:  { label: 'Reflexión',  color: '#fda4af', bg: 'rgba(253,164,175,0.12)' },
  medicación: { label: 'Medicación', color: '#86d0ef', bg: 'rgba(134,208,239,0.10)' },
};

const INITIAL_POSTS: DiaryPost[] = [
  {
    id: 'p1',
    author: 'Tú',
    initials: 'YO',
    avatarColor: '#006782',
    date: new Date(Date.now() - 1000 * 60 * 30),
    content: '7 días consecutivos con glucosa en rango. La constancia con la dieta mediterránea y caminata matutina está dando resultados increíbles. ¡Nunca me había sentido tan bien!',
    tag: 'logro',
    visibility: 'public',
    likes: 124,
    likedByMe: true,
    comments: 18,
    saved: false,
    glucoseValue: 108,
  },
  {
    id: 'p2',
    author: 'María G.',
    initials: 'MG',
    avatarColor: '#1a6c3c',
    date: new Date(Date.now() - 1000 * 60 * 60 * 3),
    content: 'Hoy practiqué respiración consciente 10 minutos antes del desayuno. Mi lectura posprandial bajó 20 puntos vs la semana pasada. El estrés sí afecta la glucosa, no es mito.',
    tag: 'reflexión',
    visibility: 'public',
    likes: 86,
    likedByMe: false,
    comments: 4,
    saved: true,
  },
  {
    id: 'p3',
    author: 'Carlos R.',
    initials: 'CR',
    avatarColor: '#004e63',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    content: '10,000 pasos + 30 min de fuerza. La app me tiene muy bien encaminado. Ver el historial semanal me motiva a no fallar.',
    tag: 'ejercicio',
    visibility: 'public',
    likes: 312,
    likedByMe: false,
    comments: 45,
    saved: false,
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function timeAgo(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)    return 'Ahora';
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

// ─── SHARE MODAL ─────────────────────────────────────────────────────────────

function ShareModal({
  visible, post, onClose,
}: { visible: boolean; post: DiaryPost | null; onClose: () => void }) {
  if (!post) return null;

  const shareText = `🩺 Mi diario de salud — Serenity\n\n"${post.content}"\n\n#Diabetes #SaludDigital #Serenity`;

  const openInstagram = async () => {
    // Instagram no permite pre-fill texto, redirige a la app
    const url = 'instagram://';
    const ok  = await Linking.canOpenURL(url).catch(() => false);
    if (ok) {
      await Share.share({ message: shareText });
      Linking.openURL(url);
    } else {
      Alert.alert('Instagram no está instalado', 'Puedes copiar el texto y pegarlo manualmente.');
    }
    onClose();
  };

  const openTwitter = async () => {
    const text = encodeURIComponent(shareText.slice(0, 280));
    const url  = `twitter://post?message=${text}`;
    const web  = `https://twitter.com/intent/tweet?text=${text}`;
    const ok   = await Linking.canOpenURL(url).catch(() => false);
    await Linking.openURL(ok ? url : web).catch(() => {});
    onClose();
  };

  const openWhatsApp = async () => {
    const msg = encodeURIComponent(shareText);
    const url = `whatsapp://send?text=${msg}`;
    const ok  = await Linking.canOpenURL(url).catch(() => false);
    if (ok) { Linking.openURL(url); }
    else    { Alert.alert('WhatsApp no está instalado'); }
    onClose();
  };

  const copyText = async () => {
    await Share.share({ message: shareText });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={onClose}>
        <View style={sh.sheet}>
          <View style={sh.handle} />
          <Text style={sh.title}>Compartir publicación</Text>
          <Text style={sh.preview} numberOfLines={3}>{post.content}</Text>

          <View style={sh.grid}>
            <TouchableOpacity style={sh.option} onPress={openInstagram}>
              <View style={[sh.optIcon, { backgroundColor: '#E1306C20' }]}>
                <Text style={sh.optEmoji}>📷</Text>
              </View>
              <Text style={sh.optLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity style={sh.option} onPress={openTwitter}>
              <View style={[sh.optIcon, { backgroundColor: '#1DA1F220' }]}>
                <Text style={sh.optEmoji}>𝕏</Text>
              </View>
              <Text style={sh.optLabel}>X / Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={sh.option} onPress={openWhatsApp}>
              <View style={[sh.optIcon, { backgroundColor: '#25D36620' }]}>
                <Text style={sh.optEmoji}>💬</Text>
              </View>
              <Text style={sh.optLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={sh.option} onPress={copyText}>
              <View style={[sh.optIcon, { backgroundColor: 'rgba(134,208,239,0.12)' }]}>
                <Send color="#86d0ef" size={22} />
              </View>
              <Text style={sh.optLabel}>Más opciones</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={sh.cancelBtn} onPress={onClose}>
            <Text style={sh.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const sh = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#1a1a1a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  handle:     { width: 40, height: 4, backgroundColor: '#333b3d', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:      { color: '#ecf2f3', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  preview:    { color: '#6f787d', fontSize: 13, lineHeight: 20, marginBottom: 24, backgroundColor: '#252525', padding: 12, borderRadius: 12 },
  grid:       { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  option:     { alignItems: 'center', gap: 8 },
  optIcon:    { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  optEmoji:   { fontSize: 24 },
  optLabel:   { color: '#bfc8cd', fontSize: 11, fontWeight: '600' },
  cancelBtn:  { backgroundColor: '#252525', padding: 16, borderRadius: 16, alignItems: 'center' },
  cancelText: { color: '#6f787d', fontWeight: '700', fontSize: 15 },
});

// ─── NEW POST MODAL ───────────────────────────────────────────────────────────

const ALL_TAGS: PostTag[] = ['glucosa','ejercicio','comida','logro','reflexión','medicación'];

function NewPostModal({
  visible, onClose, onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (post: Omit<DiaryPost, 'id' | 'likes' | 'likedByMe' | 'comments' | 'saved'>) => void;
}) {
  const [text,       setText]       = useState('');
  const [tag,        setTag]        = useState<PostTag>('reflexión');
  const [visibility, setVisibility] = useState<PostVisibility>('private');
  const [error,      setError]      = useState('');

  const handlePublish = () => {
    const mod = moderateContent(text);
    if (!mod.ok) { setError(mod.reason ?? 'Contenido no permitido.'); return; }
    setError('');
    onSubmit({
      author: 'Tú',
      initials: 'YO',
      avatarColor: '#006782',
      date: new Date(),
      content: text.trim(),
      tag,
      visibility,
    });
    setText(''); setTag('reflexión'); setVisibility('private');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={np.container}>
          <View style={np.header}>
            <TouchableOpacity onPress={onClose} style={np.closeBtn}>
              <X color="#6f787d" size={20} />
            </TouchableOpacity>
            <Text style={np.headerTitle}>Nueva entrada</Text>
            <TouchableOpacity style={np.publishBtn} onPress={handlePublish}>
              <Text style={np.publishText}>Publicar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={np.body} keyboardShouldPersistTaps="handled">
            {/* Author row */}
            <View style={np.authorRow}>
              <View style={[np.avatar, { backgroundColor: '#006782' }]}>
                <Text style={np.avatarText}>YO</Text>
              </View>
              <View>
                <Text style={np.authorName}>Tú</Text>
                {/* Visibilidad */}
                <TouchableOpacity
                  style={np.visRow}
                  onPress={() => setVisibility(v => v === 'private' ? 'public' : 'private')}
                >
                  {visibility === 'private'
                    ? <Lock color="#6f787d" size={12} />
                    : <Globe color="#86d0ef" size={12} />}
                  <Text style={[np.visText, visibility === 'public' && { color: '#86d0ef' }]}>
                    {visibility === 'private' ? 'Solo yo' : 'Comunidad'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Text input */}
            <TextInput
              style={np.textInput}
              placeholder="¿Cómo va tu día con la diabetes? Escribe tu reflexión, logro o dato de salud..."
              placeholderTextColor="#3f484c"
              multiline
              value={text}
              onChangeText={t => { setText(t); setError(''); }}
              maxLength={1000}
              autoFocus
            />

            <Text style={np.charCount}>{text.length}/1000</Text>

            {/* Error */}
            {error !== '' && (
              <View style={np.errorBox}>
                <AlertTriangle color="#f59e0b" size={14} />
                <Text style={np.errorText}>{error}</Text>
              </View>
            )}

            {/* Moderación notice */}
            <View style={np.noticeBox}>
              <CheckCircle2 color="#22c55e" size={13} />
              <Text style={np.noticeText}>
                Comunidad segura · No se permite contenido ofensivo, racista, sexual explícito ni que atente contra personas o grupos.
              </Text>
            </View>

            {/* Tags */}
            <Text style={np.sectionLabel}>ETIQUETA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={np.tagRow}>
              {ALL_TAGS.map(t => {
                const cfg = TAG_CONFIG[t];
                return (
                  <TouchableOpacity
                    key={t}
                    style={[np.tagBtn, tag === t && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                    onPress={() => setTag(t)}
                  >
                    <Text style={[np.tagText, tag === t && { color: cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const np = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#171d1e' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  closeBtn:    { padding: 8, backgroundColor: '#1d2426', borderRadius: 10 },
  headerTitle: { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  publishBtn:  { backgroundColor: '#006782', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 100 },
  publishText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  body:        { padding: 20, paddingBottom: 60 },
  authorRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar:      { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText:  { color: '#fff', fontWeight: '800', fontSize: 13 },
  authorName:  { color: '#ecf2f3', fontWeight: '700', fontSize: 15 },
  visRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  visText:     { color: '#6f787d', fontSize: 11, fontWeight: '600' },
  textInput:   { color: '#ecf2f3', fontSize: 16, lineHeight: 24, minHeight: 120, textAlignVertical: 'top', marginBottom: 4 },
  charCount:   { color: '#3f484c', fontSize: 11, textAlign: 'right', marginBottom: 12 },
  errorBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText:   { color: '#f59e0b', fontSize: 13, flex: 1, lineHeight: 18 },
  noticeBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: 12, padding: 12, marginBottom: 20 },
  noticeText:  { color: '#6f787d', fontSize: 11, flex: 1, lineHeight: 16 },
  sectionLabel:{ color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  tagRow:      { gap: 8, paddingBottom: 4 },
  tagBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  tagText:     { color: '#6f787d', fontSize: 12, fontWeight: '700' },
});

// ─── POST CARD ────────────────────────────────────────────────────────────────

function PostCard({
  post, onLike, onSave, onShare, onDelete,
}: {
  post: DiaryPost;
  onLike:   () => void;
  onSave:   () => void;
  onShare:  () => void;
  onDelete: () => void;
}) {
  const tagCfg = TAG_CONFIG[post.tag];
  const isOwn  = post.author === 'Tú';

  return (
    <View style={pc.card}>
      {/* Header */}
      <View style={pc.header}>
        <View style={pc.authorRow}>
          {post.avatar ? (
            <Image source={{ uri: post.avatar }} style={pc.avatar} />
          ) : (
            <View style={[pc.avatar, { backgroundColor: post.avatarColor ?? '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={pc.initials}>{post.initials}</Text>
            </View>
          )}
          <View>
            <Text style={pc.authorName}>{post.author}</Text>
            <View style={pc.metaRow}>
              <Clock color="#3f484c" size={10} />
              <Text style={pc.metaText}>{timeAgo(post.date)}</Text>
              {post.visibility === 'private'
                ? <><Lock color="#3f484c" size={10} /><Text style={pc.metaText}>Solo yo</Text></>
                : <><Globe color="#3f484c" size={10} /><Text style={pc.metaText}>Comunidad</Text></>}
            </View>
          </View>
        </View>
        <View style={pc.headerRight}>
          <View style={[pc.tag, { backgroundColor: tagCfg.bg }]}>
            <Text style={[pc.tagText, { color: tagCfg.color }]}>{tagCfg.label}</Text>
          </View>
          {isOwn && (
            <TouchableOpacity onPress={() =>
              Alert.alert('Eliminar', '¿Borrar esta entrada?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: onDelete },
              ])
            } style={pc.moreBtn}>
              <Trash2 color="#3f484c" size={15} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Glucosa badge si existe */}
      {post.glucoseValue !== undefined && (
        <View style={pc.glucoseBadge}>
          <Droplets color="#86d0ef" size={14} fill="#86d0ef" />
          <Text style={pc.glucoseVal}>{post.glucoseValue} mg/dL</Text>
        </View>
      )}

      {/* Content */}
      <Text style={pc.content}>{post.content}</Text>

      {/* Actions */}
      <View style={pc.actions}>
        <View style={pc.actionsLeft}>
          <TouchableOpacity style={pc.actionBtn} onPress={onLike}>
            <Heart
              color={post.likedByMe ? '#fda4af' : '#6f787d'}
              size={18}
              fill={post.likedByMe ? '#fda4af' : 'transparent'}
            />
            <Text style={[pc.actionCount, post.likedByMe && { color: '#fda4af' }]}>
              {post.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={pc.actionBtn}>
            <MessageCircle color="#6f787d" size={18} />
            <Text style={pc.actionCount}>{post.comments}</Text>
          </TouchableOpacity>
        </View>

        <View style={pc.actionsRight}>
          <TouchableOpacity style={pc.actionBtn} onPress={onShare}>
            <Send color="#6f787d" size={17} />
          </TouchableOpacity>
          <TouchableOpacity style={pc.actionBtn} onPress={onSave}>
            <Bookmark
              color={post.saved ? '#86d0ef' : '#6f787d'}
              size={17}
              fill={post.saved ? '#86d0ef' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const pc = StyleSheet.create({
  card:        { backgroundColor: '#1a1a1a', borderRadius: 24, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 10 },
  authorRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:      { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  initials:    { color: '#fff', fontWeight: '800', fontSize: 13 },
  authorName:  { color: '#ecf2f3', fontWeight: '700', fontSize: 14 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText:    { color: '#3f484c', fontSize: 10, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  tagText:     { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  moreBtn:     { padding: 4 },
  glucoseBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(134,208,239,0.08)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  glucoseVal:  { color: '#86d0ef', fontSize: 12, fontWeight: '800' },
  content:     { color: '#d4dde0', fontSize: 15, lineHeight: 23, paddingHorizontal: 16, paddingBottom: 14 },
  actions:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 10 },
  actionsLeft: { flexDirection: 'row', gap: 16 },
  actionsRight:{ flexDirection: 'row', gap: 14 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: '#6f787d', fontSize: 13, fontWeight: '600' },
});

// ─── TIMELINE ITEM ────────────────────────────────────────────────────────────

const TimelineItem = ({ icon, bg, title, time }: any) => (
  <TouchableOpacity style={s.timelineItem}>
    <View style={[s.tlIconBox, { backgroundColor: bg }]}>{icon}</View>
    <View style={s.tlInfo}>
      <Text style={s.tlLabel}>{title}</Text>
      <Text style={s.tlTime}>{time}</Text>
    </View>
    <ChevronRight color="#4a5153" size={18} />
  </TouchableOpacity>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────

type MainTab = 'feed' | 'diario';

export default function ExploreScreen() {
  const [mainTab,    setMainTab]    = useState<MainTab>('feed');
  const [search,     setSearch]     = useState('');
  const [posts,      setPosts]      = useState<DiaryPost[]>(INITIAL_POSTS);
  const [newPost,    setNewPost]    = useState(false);
  const [sharePost,  setSharePost]  = useState<DiaryPost | null>(null);

  const handleLike = useCallback((id: string) => {
    setPosts(prev => prev.map(p =>
      p.id !== id ? p : {
        ...p,
        likedByMe: !p.likedByMe,
        likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
      }
    ));
  }, []);

  const handleSave = useCallback((id: string) => {
    setPosts(prev => prev.map(p => p.id !== id ? p : { ...p, saved: !p.saved }));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleNewPost = useCallback((data: Omit<DiaryPost, 'id' | 'likes' | 'likedByMe' | 'comments' | 'saved'>) => {
    const post: DiaryPost = {
      ...data,
      id: `p-${Date.now()}`,
      likes: 0,
      likedByMe: false,
      comments: 0,
      saved: false,
    };
    setPosts(prev => [post, ...prev]);
  }, []);

  const myDiary = posts.filter(p => p.author === 'Tú');
  const publicFeed = posts.filter(p =>
    p.visibility === 'public' &&
    (search === '' || p.content.toLowerCase().includes(search.toLowerCase()) ||
     TAG_CONFIG[p.tag].label.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.topBar}>
        <View>
          <Text style={s.screenTitle}>Explorar</Text>
          <Text style={s.screenSub}>Diario & comunidad</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={() => setNewPost(true)} activeOpacity={0.85}>
          <Plus color="#003746" size={20} />
          <Text style={s.newBtnText}>Nueva entrada</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main tabs ── */}
      <View style={s.mainTabRow}>
        <TouchableOpacity
          style={[s.mainTab, mainTab === 'feed' && s.mainTabActive]}
          onPress={() => setMainTab('feed')}
        >
          <Globe color={mainTab === 'feed' ? '#fff' : '#6f787d'} size={14} />
          <Text style={[s.mainTabText, mainTab === 'feed' && s.mainTabTextActive]}>Comunidad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mainTab, mainTab === 'diario' && s.mainTabActive]}
          onPress={() => setMainTab('diario')}
        >
          <Edit3 color={mainTab === 'diario' ? '#fff' : '#6f787d'} size={14} />
          <Text style={[s.mainTabText, mainTab === 'diario' && s.mainTabTextActive]}>Mi diario</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══ TAB: COMUNIDAD ══ */}
        {mainTab === 'feed' && (
          <>
            {/* Up Next */}
            <Text style={s.sectionTitle}>Próximo</Text>
            <View style={s.timeline}>
              <TimelineItem icon={<Utensils color="#9beaae" size={20} />} bg="#005229" title="Almuerzo" time="12:30 PM" />
              <TimelineItem icon={<Droplets color="#baeaff" size={20} />} bg="#004d62" title="Control de Glucosa" time="14:00 PM" />
            </View>

            {/* Insight */}
            <TouchableOpacity style={s.insightCard} activeOpacity={0.8}>
              <View style={s.insightHeader}>
                <Lightbulb color="#86d0ef" size={16} />
                <Text style={s.insightBadge}>ANÁLISIS SEMANAL</Text>
              </View>
              <Text style={s.insightText}>
                Tu glucosa fue 15% más estable esta semana. La caminata matutina está marcando la diferencia.
              </Text>
            </TouchableOpacity>

            <View style={s.divider} />

            {/* Buscador */}
            <View style={s.searchBar}>
              <Search color="#6f787d" size={18} />
              <TextInput
                placeholder="Buscar en la comunidad..."
                placeholderTextColor="#6f787d"
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
              />
              {search !== '' && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X color="#6f787d" size={16} />
                </TouchableOpacity>
              )}
            </View>

            {/* Feed */}
            {publicFeed.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>No hay publicaciones que coincidan.</Text>
              </View>
            ) : (
              publicFeed.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id)}
                  onSave={() => handleSave(post.id)}
                  onShare={() => setSharePost(post)}
                  onDelete={() => handleDelete(post.id)}
                />
              ))
            )}
          </>
        )}

        {/* ══ TAB: MI DIARIO ══ */}
        {mainTab === 'diario' && (
          <>
            <View style={s.diaryHeader}>
              <Text style={s.diaryTitle}>Mi diario de salud</Text>
              <Text style={s.diarySub}>
                Un espacio privado para registrar cómo llevas tu condición. Solo tú puedes ver las entradas privadas.
              </Text>
            </View>

            {/* CTA nueva entrada */}
            <TouchableOpacity style={s.newEntryCard} onPress={() => setNewPost(true)} activeOpacity={0.85}>
              <View style={s.newEntryAvatar}>
                <Text style={s.newEntryAvatarText}>YO</Text>
              </View>
              <Text style={s.newEntryPlaceholder}>¿Cómo fue tu día con la diabetes?</Text>
              <Edit3 color="#3f484c" size={18} />
            </TouchableOpacity>

            {myDiary.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyTitle}>Tu diario está vacío</Text>
                <Text style={s.emptyText}>Escribe tu primera reflexión o logro de hoy.</Text>
              </View>
            ) : (
              myDiary.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id)}
                  onSave={() => handleSave(post.id)}
                  onShare={() => setSharePost(post)}
                  onDelete={() => handleDelete(post.id)}
                />
              ))
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modales */}
      <NewPostModal
        visible={newPost}
        onClose={() => setNewPost(false)}
        onSubmit={handleNewPost}
      />
      <ShareModal
        visible={sharePost !== null}
        post={sharePost}
        onClose={() => setSharePost(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#121212' },

  topBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 12 },
  screenTitle:     { color: '#ecf2f3', fontSize: 26, fontWeight: '800' },
  screenSub:       { color: '#6f787d', fontSize: 13, marginTop: 2 },
  newBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#c4ebe0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  newBtnText:      { color: '#003746', fontWeight: '800', fontSize: 13 },

  mainTabRow:      { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 4, gap: 4 },
  mainTab:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  mainTabActive:   { backgroundColor: '#006782' },
  mainTabText:     { color: '#6f787d', fontSize: 13, fontWeight: '700' },
  mainTabTextActive:{ color: '#fff' },

  scroll:          { flex: 1 },
  scrollContent:   { padding: 20 },

  sectionTitle:    { color: '#86d0ef', fontSize: 20, fontWeight: '800', marginBottom: 12 },

  timeline:        { gap: 8, marginBottom: 24 },
  timelineItem:    { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 14, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tlIconBox:       { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  tlInfo:          { flex: 1, marginLeft: 12 },
  tlLabel:         { color: '#6f787d', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tlTime:          { color: '#f5fafb', fontSize: 15, fontWeight: '700' },

  insightCard:     { backgroundColor: 'rgba(134,208,239,0.05)', padding: 18, borderRadius: 20, borderLeftWidth: 3, borderLeftColor: '#86d0ef', marginBottom: 24 },
  insightHeader:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  insightBadge:    { color: '#86d0ef', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  insightText:     { color: '#bfc8ca', fontSize: 13, lineHeight: 20 },

  divider:         { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },

  searchBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 14, borderRadius: 14, height: 46, marginBottom: 18, gap: 10 },
  searchInput:     { flex: 1, fontSize: 14, color: '#f5fafb' },

  emptyBox:        { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle:      { color: '#ecf2f3', fontSize: 15, fontWeight: '700' },
  emptyText:       { color: '#6f787d', fontSize: 13 },

  diaryHeader:     { marginBottom: 20 },
  diaryTitle:      { color: '#baeaff', fontSize: 26, fontWeight: '800' },
  diarySub:        { color: '#6f787d', fontSize: 13, marginTop: 6, lineHeight: 20 },

  newEntryCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1a1a', borderRadius: 18, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  newEntryAvatar:  { width: 38, height: 38, borderRadius: 19, backgroundColor: '#006782', justifyContent: 'center', alignItems: 'center' },
  newEntryAvatarText:{ color: '#fff', fontWeight: '800', fontSize: 11 },
  newEntryPlaceholder:{ flex: 1, color: '#3f484c', fontSize: 14 },
});