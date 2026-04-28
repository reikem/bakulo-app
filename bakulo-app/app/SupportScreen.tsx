/**
 * SupportScreen.tsx — v2
 *
 * ✅ Email operativo → abre app de correo con esjimmymeneses11@gmail.com
 * ✅ Live Chat → abre WhatsApp o correo como fallback
 * ✅ Reportar Bug en GitHub → abre issues del repo
 * ✅ Tutorial interactivo de uso de la app (modal paso a paso)
 * ✅ Credenciales leídas desde variables de entorno (.env)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, Linking, Alert,
  Modal, Platform, StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  Search, Rocket, Smartphone, Bug, MessageCircle,
  Mail, ArrowLeft, X, ChevronRight, ChevronLeft,
  BookOpen, GitBranch, Link2, CheckCircle2,
  Droplets, Dumbbell, FolderOpen, Bell,
} from 'lucide-react-native';

// ─── ENV VARS ─────────────────────────────────────────────────────────────────
// Expo expone las variables con prefijo EXPO_PUBLIC_ al bundle
const SUPPORT_EMAIL   = process.env.EXPO_PUBLIC_SUPPORT_EMAIL   ?? 'esjimmymeneses11@gmail.com';
const GITHUB_ISSUES   = process.env.EXPO_PUBLIC_GITHUB_ISSUES_URL ?? 'https://github.com/tu-usuario/bakulo-app/issues/new';
const GITHUB_REPO     = process.env.EXPO_PUBLIC_GITHUB_REPO_URL   ?? 'https://github.com/tu-usuario/bakulo-app';
const APP_VERSION     = process.env.EXPO_PUBLIC_APP_VERSION        ?? '1.0.0';

// ─── TUTORIAL STEPS ───────────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    icon: <Droplets color="#86d0ef" size={40} strokeWidth={2} />,
    title: 'Registra tu Glucosa',
    desc: 'En el Dashboard toca "Registrar Glucosa". Puedes conectar un dispositivo Bluetooth o NFC (en móvil) o ingresar el valor manualmente. El sistema detecta automáticamente si estás en rango normal (70–140 mg/dL).',
    tip: '💡 Si no tienes dispositivo, usa el modo Manual desde la pantalla de registro.',
  },
  {
    icon: <Dumbbell color="#a4f4b7" size={40} strokeWidth={2} />,
    title: 'Registra tu Ejercicio',
    desc: 'Desde el Dashboard toca "Registrar Ejercicio". Elige tu actividad (Gym, Correr, Yoga...), ajusta la duración con los botones + y –, y agrega notas opcionales.',
    tip: '💡 El ejercicio afecta tu glucosa. Registrarlo te ayuda a ver patrones en tus gráficos.',
  },
  {
    icon: <FolderOpen color="#f9c74f" size={40} strokeWidth={2} />,
    title: 'Sube Documentos Médicos',
    desc: 'Desde el Dashboard toca "Mi Repositorio". Sube PDFs de exámenes, recetas o fotos. El calendario marca los días en que subiste archivos y puedes filtrar por fecha.',
    tip: '💡 En Historial → pestaña Documentos puedes ver y previsualizar todo lo subido.',
  },
  {
    icon: <Bell color="#c4b5fd" size={40} strokeWidth={2} />,
    title: 'Configura tus Alertas',
    desc: 'Ve a Notificaciones y abre la pestaña "Configurar". Activa alertas de glucosa alta/baja y recordatorios de comidas y medicación. El sistema te avisará cuando tus valores salgan del rango.',
    tip: '💡 Activa los permisos del sistema para recibir notificaciones incluso con la app cerrada.',
  },
  {
    icon: <Rocket color="#86d0ef" size={40} strokeWidth={2} />,
    title: '¡Listo para comenzar!',
    desc: 'Ya conoces las funciones principales de Serenity. Registra tu primera medición de glucosa y comienza a ver tu progreso en el gráfico del Dashboard.',
    tip: '💡 Los datos se guardan localmente en tu dispositivo con SQLite y se sincronizan cuando hay conexión.',
  },
];

// ─── TUTORIAL MODAL ───────────────────────────────────────────────────────────

function TutorialModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const isLast  = step === TUTORIAL_STEPS.length - 1;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={tut.container}>
        <View style={tut.header}>
          <View style={tut.stepIndicator}>
            {TUTORIAL_STEPS.map((_, i) => (
              <View key={i} style={[tut.dot, i === step && tut.dotActive]} />
            ))}
          </View>
          <TouchableOpacity onPress={onClose} style={tut.closeBtn}>
            <X color="#6f787d" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={tut.body} showsVerticalScrollIndicator={false}>
          <View style={tut.iconWrap}>{current.icon}</View>

          <Text style={tut.stepLabel}>PASO {step + 1} DE {TUTORIAL_STEPS.length}</Text>
          <Text style={tut.stepTitle}>{current.title}</Text>
          <Text style={tut.stepDesc}>{current.desc}</Text>

          <View style={tut.tipBox}>
            <Text style={tut.tipText}>{current.tip}</Text>
          </View>
        </ScrollView>

        <View style={tut.footer}>
          <TouchableOpacity
            style={[tut.navBtn, step === 0 && tut.navBtnDisabled]}
            onPress={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft color={step === 0 ? '#3f484c' : '#86d0ef'} size={20} />
            <Text style={[tut.navBtnText, step === 0 && { color: '#3f484c' }]}>Anterior</Text>
          </TouchableOpacity>

          {isLast ? (
            <TouchableOpacity style={tut.finishBtn} onPress={() => { setStep(0); onClose(); }}>
              <CheckCircle2 color="#003746" size={18} />
              <Text style={tut.finishBtnText}>¡Comenzar!</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={tut.nextBtn} onPress={() => setStep(s => s + 1)}>
              <Text style={tut.nextBtnText}>Siguiente</Text>
              <ChevronRight color="#003746" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const tut = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#171d1e' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
  stepIndicator:{ flexDirection: 'row', gap: 6 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1d2426' },
  dotActive:    { backgroundColor: '#006782', width: 24 },
  closeBtn:     { padding: 8, backgroundColor: '#1d2426', borderRadius: 12 },
  body:         { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 20, alignItems: 'center' },
  iconWrap:     { width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(134,208,239,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(134,208,239,0.12)' },
  stepLabel:    { color: '#6f787d', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  stepTitle:    { color: '#baeaff', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 16, lineHeight: 32 },
  stepDesc:     { color: '#bfc8cd', fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 24 },
  tipBox:       { backgroundColor: 'rgba(0,103,130,0.1)', borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: 'rgba(0,103,130,0.2)' },
  tipText:      { color: '#86d0ef', fontSize: 13, lineHeight: 20 },
  footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  navBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
  navBtnDisabled:{ opacity: 0.4 },
  navBtnText:   { color: '#86d0ef', fontWeight: '700', fontSize: 14 },
  nextBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#c4ebe0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  nextBtnText:  { color: '#003746', fontWeight: '800', fontSize: 14 },
  finishBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#c4ebe0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  finishBtnText:{ color: '#003746', fontWeight: '800', fontSize: 14 },
});

// ─── BUG REPORT MODAL ────────────────────────────────────────────────────────

function BugReportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title,   setTitle]   = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    if (!title.trim()) { Alert.alert('Falta el título del problema'); return; }
    setSending(true);
    const subject = encodeURIComponent(`[Bug] ${title.trim()}`);
    const body    = encodeURIComponent(
      `Versión: ${APP_VERSION}\nPlataforma: ${Platform.OS} ${Platform.Version}\n\nDescripción:\n${details.trim() || '(sin detalles)'}`
    );
    const mailto  = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(mailto).catch(() => false);
    if (canOpen) {
      await Linking.openURL(mailto);
    } else {
      Alert.alert('No se pudo abrir el correo', `Envía tu reporte a:\n${SUPPORT_EMAIL}`);
    }
    setSending(false);
    setTitle(''); setDetails('');
    onClose();
  };

  const handleOpenGitHub = async () => {
    const titleParam   = encodeURIComponent(title.trim() || 'Bug report');
    const bodyParam    = encodeURIComponent(
      `**Versión:** ${APP_VERSION}\n**Plataforma:** ${Platform.OS} ${Platform.Version}\n\n**Descripción:**\n${details.trim() || 'Por favor describe el problema.'}`
    );
    const url = `${GITHUB_ISSUES}?title=${titleParam}&body=${bodyParam}&labels=bug`;
    const ok  = await Linking.canOpenURL(url).catch(() => false);
    if (ok) { await Linking.openURL(url); onClose(); }
    else    { Alert.alert('No se pudo abrir GitHub', GITHUB_ISSUES); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={bug.container}>
        <View style={bug.header}>
          <Text style={bug.title}>Reportar Problema</Text>
          <TouchableOpacity onPress={onClose} style={bug.closeBtn}>
            <X color="#6f787d" size={20} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={bug.body} keyboardShouldPersistTaps="handled">
          <Text style={bug.label}>TÍTULO DEL PROBLEMA *</Text>
          <TextInput
            style={bug.input}
            placeholder="Ej: La pantalla de glucosa no guarda..."
            placeholderTextColor="#3f484c"
            value={title}
            onChangeText={setTitle}
          />
          <Text style={bug.label}>DETALLES (opcional)</Text>
          <TextInput
            style={[bug.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Pasos para reproducir, capturas, etc."
            placeholderTextColor="#3f484c"
            value={details}
            onChangeText={setDetails}
            multiline
          />
          <Text style={bug.infoText}>
            Versión {APP_VERSION} · {Platform.OS} {Platform.Version}
          </Text>

          <TouchableOpacity style={bug.btnEmail} onPress={handleSendEmail} disabled={sending}>
            <Mail color="#003746" size={18} />
            <Text style={bug.btnEmailText}>Enviar por Correo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={bug.btnGithub} onPress={handleOpenGitHub}>
            <GitBranch color="#fff" size={18} />
            <Text style={bug.btnGithubText}>Abrir Issue en GitHub</Text>
            <Link2 color="#6f787d" size={14} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const bug = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  title:     { color: '#baeaff', fontSize: 20, fontWeight: '800' },
  closeBtn:  { padding: 8, backgroundColor: '#1d2426', borderRadius: 12 },
  body:      { padding: 24 },
  label:     { color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6, marginTop: 4 },
  input:     { backgroundColor: '#1d2426', borderRadius: 14, padding: 14, color: '#fff', marginBottom: 16, fontSize: 14 },
  infoText:  { color: '#3f484c', fontSize: 11, marginBottom: 20 },
  btnEmail:  { backgroundColor: '#c4ebe0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 100, marginBottom: 12 },
  btnEmailText:  { color: '#003746', fontWeight: '800', fontSize: 15 },
  btnGithub: { backgroundColor: '#1d2426', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnGithubText: { color: '#ecf2f3', fontWeight: '700', fontSize: 15, flex: 1, textAlign: 'center' },
});

// ─── FAQ items ────────────────────────────────────────────────────────────────

const FAQ = [
  { q: '¿Cómo conecto mi glucómetro Bluetooth?', a: 'Ve a Registrar Glucosa → pestaña Bluetooth → toca "Sincronizar". Asegúrate de que el dispositivo esté encendido y en modo pairing.' },
  { q: '¿Los datos se guardan sin internet?', a: 'Sí. Todo se guarda localmente en SQLite. La sincronización remota ocurre automáticamente cuando hay conexión.' },
  { q: '¿Cómo cambio los umbrales de alerta?', a: 'Ve a Notificaciones → pestaña "Configurar" → ajusta los valores de glucosa alta y baja.' },
  { q: '¿Puedo exportar mis datos?', a: 'Sí, desde el menú de Reportes puedes exportar tu historial como PDF o CSV.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={faq.item} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
      <View style={faq.row}>
        <Text style={faq.q}>{q}</Text>
        <ChevronRight color="#6f787d" size={16} style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }} />
      </View>
      {open && <Text style={faq.a}>{a}</Text>}
    </TouchableOpacity>
  );
}
const faq = StyleSheet.create({
  item: { backgroundColor: '#1d2426', borderRadius: 16, padding: 16, marginBottom: 8 },
  row:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  q:    { color: '#ecf2f3', fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  a:    { color: '#bfc8cd', fontSize: 13, lineHeight: 20, marginTop: 10 },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const router = useRouter();
  const [search,       setSearch]       = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBugReport,setShowBugReport]= useState(false);

  const openEmail = async () => {
    const subject = encodeURIComponent('Consulta — Serenity App');
    const body    = encodeURIComponent(`Versión: ${APP_VERSION}\nPlataforma: ${Platform.OS}\n\nHola, necesito ayuda con...`);
    const url     = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    const ok = await Linking.canOpenURL(url).catch(() => false);
    if (ok) Linking.openURL(url);
    else    Alert.alert('Correo de soporte', SUPPORT_EMAIL, [{ text: 'OK' }]);
  };

  const openLiveChat = async () => {
    // Intenta WhatsApp, si no cae a correo
    const wa = 'https://wa.me/?text=Hola%2C%20necesito%20ayuda%20con%20Serenity%20App';
    const ok = await Linking.canOpenURL(wa).catch(() => false);
    if (ok) Linking.openURL(wa);
    else    openEmail();
  };

  const openGitHub = async () => {
    const ok = await Linking.canOpenURL(GITHUB_REPO).catch(() => false);
    if (ok) Linking.openURL(GITHUB_REPO);
    else    Alert.alert('GitHub', GITHUB_REPO);
  };

  const filteredFaq = FAQ.filter(f =>
    !search.trim() ||
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={s.safeHeader}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <View style={s.iconCircle}>
              <ArrowLeft color="#c4ebe0" size={22} />
            </View>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Soporte</Text>
          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={s.title}>¿Cómo podemos{'\n'}ayudarte?</Text>

        {/* Búsqueda */}
        <View style={s.searchContainer}>
          <Search color="#006782" size={20} />
          <TextInput
            placeholder="Buscar en ayuda..."
            placeholderTextColor="#40484a"
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

        {/* Cards principales */}
        <View style={s.grid}>
          {/* Tutorial */}
          <TouchableOpacity style={[s.card, s.cardLarge]} onPress={() => setShowTutorial(true)} activeOpacity={0.85}>
            <View style={s.iconBox}><Rocket color="#c4ebe0" size={22} /></View>
            <Text style={s.cardTitle}>Tutorial de Inicio</Text>
            <Text style={s.cardSub}>Aprende a usar Serenity paso a paso en 5 minutos.</Text>
            <View style={s.cardAction}>
              <BookOpen color="#86d0ef" size={14} />
              <Text style={s.cardActionText}>Ver tutorial interactivo →</Text>
            </View>
          </TouchableOpacity>

          {/* Dispositivos */}
          <TouchableOpacity style={[s.card, s.cardHighlight]} activeOpacity={0.85}>
            <View style={s.iconBoxDark}><Smartphone color="#004e63" size={22} /></View>
            <Text style={[s.cardTitle, { color: '#00201a' }]}>Dispositivos</Text>
            <Text style={{ color: '#004d62', fontSize: 12, marginTop: 4 }}>
              Conexión de glucómetros y wearables.
            </Text>
          </TouchableOpacity>

          {/* Reportar Bug */}
          <TouchableOpacity style={s.card} onPress={() => setShowBugReport(true)} activeOpacity={0.85}>
            <View style={s.iconBox}><Bug color="#c4ebe0" size={22} /></View>
            <Text style={s.cardTitle}>Reportar Bug</Text>
            <Text style={s.cardSub}>Envía por correo o GitHub Issues.</Text>
          </TouchableOpacity>

          {/* GitHub */}
          <TouchableOpacity style={[s.card, { backgroundColor: '#0d1117' }]} onPress={openGitHub} activeOpacity={0.85}>
            <View style={[s.iconBox, { backgroundColor: '#21262d' }]}>
              <GitBranch color="#f0f6fc" size={22} />
            </View>
            <Text style={s.cardTitle}>GitHub</Text>
            <Text style={s.cardSub}>Código fuente y changelog.</Text>
            <Link2 color="#6f787d" size={12} style={{ marginTop: 6 }} />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        {!search.trim() && (
          <Text style={s.sectionTitle}>PREGUNTAS FRECUENTES</Text>
        )}
        {filteredFaq.length > 0 ? (
          filteredFaq.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)
        ) : (
          search.trim() ? (
            <View style={s.noResults}>
              <Text style={s.noResultsText}>Sin resultados para "{search}&quot;</Text>
            </View>
          ) : null
        )}

        {/* CTA */}
        <View style={s.ctaCard}>
          <Text style={s.ctaTitle}>¿Aún necesitas ayuda?</Text>
          <Text style={s.ctaSub}>Nuestro equipo responde en menos de 24 horas.</Text>
          <View style={s.ctaButtons}>
            <TouchableOpacity style={s.btnPrimary} onPress={openLiveChat} activeOpacity={0.85}>
              <MessageCircle color="#00201a" size={18} />
              <Text style={s.btnPrimaryText}>Chat en vivo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={openEmail} activeOpacity={0.85}>
              <Mail color="#fff" size={18} />
              <Text style={s.btnSecondaryText}>Correo</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.emailHint}>{SUPPORT_EMAIL}</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <TutorialModal visible={showTutorial} onClose={() => setShowTutorial(false)} />
      <BugReportModal visible={showBugReport} onClose={() => setShowBugReport(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#171d1e' },
  safeHeader:    { backgroundColor: '#171d1e' },
  header:        { paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:   { color: '#c4ebe0', fontSize: 16, fontWeight: '700' },
  backBtn:       { marginLeft: -4 },
  iconCircle:    { backgroundColor: 'rgba(0,103,130,0.2)', padding: 10, borderRadius: 14 },

  content:       { padding: 24, paddingBottom: 40 },
  title:         { color: '#c4ebe0', fontSize: 30, fontWeight: '800', lineHeight: 36, marginBottom: 20, marginTop: 10 },

  searchContainer:{ backgroundColor: '#1d2426', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 20, height: 56, marginBottom: 24, gap: 10 },
  searchInput:   { flex: 1, color: '#fff', fontSize: 15 },

  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  card:          { backgroundColor: '#1d2426', borderRadius: 28, padding: 18, width: '47%', justifyContent: 'flex-start', gap: 4 },
  cardLarge:     { width: '100%', minHeight: 140 },
  cardHighlight: { backgroundColor: '#c4ebe0' },
  iconBox:       { width: 44, height: 44, backgroundColor: '#004e63', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconBoxDark:   { width: 44, height: 44, backgroundColor: 'rgba(0,78,99,0.1)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardTitle:     { color: '#c4ebe0', fontSize: 16, fontWeight: '700' },
  cardSub:       { color: '#bfc8ca', fontSize: 12, opacity: 0.8 },
  cardAction:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  cardActionText:{ color: '#86d0ef', fontSize: 13, fontWeight: '600' },

  sectionTitle:  { color: '#6f787d', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  noResults:     { padding: 24, alignItems: 'center' },
  noResultsText: { color: '#6f787d', fontSize: 13 },

  ctaCard:       { backgroundColor: '#004e63', borderRadius: 36, padding: 28, marginTop: 28, alignItems: 'center' },
  ctaTitle:      { color: '#fff', fontSize: 22, fontWeight: '800' },
  ctaSub:        { color: '#9fe2ff', fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  ctaButtons:    { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnPrimary:    { backgroundColor: '#c4ebe0', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, gap: 8, alignItems: 'center' },
  btnPrimaryText:{ color: '#00201a', fontWeight: '700' },
  btnSecondary:  { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, gap: 8, alignItems: 'center' },
  btnSecondaryText:{ color: '#fff', fontWeight: '700' },
  emailHint:     { color: 'rgba(159,226,255,0.6)', fontSize: 11 },
});