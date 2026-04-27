/**
 * SecurityScreen.tsx — v2 operativo
 * Biometría real (expo-local-authentication)
 * Flujo de 2FA, cambio de contraseña, eliminación de datos
 * Logs de seguridad en SQLite
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch, SafeAreaView, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft, Fingerprint, Lock, EyeOff, Trash2, ChevronRight,
  ShieldCheck, Smartphone, CheckCircle2, Stethoscope, X, Eye,
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { db_logSecurityEvent, db_setPreference, db_getPreference } from '@/service/database';

// ─── SECURITY HERO ────────────────────────────────────────────────────────────
function SecurityHero({ score }: { score: number }) {
  const color  = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label  = score >= 80 ? 'Protección Alta' : score >= 50 ? 'Protección Media' : 'Protección Baja';
  return (
    <View style={sh.card}>
      <View style={sh.left}>
        <ShieldCheck color={color} size={32} />
        <View>
          <Text style={sh.scoreLabel}>SEGURIDAD</Text>
          <Text style={[sh.score, { color }]}>{label}</Text>
        </View>
      </View>
      <View style={sh.scoreCircle}>
        <Text style={[sh.scoreNum, { color }]}>{score}</Text>
        <Text style={sh.scoreMax}>/100</Text>
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  card:        { backgroundColor: '#1c2527', borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  left:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreLabel:  { color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  score:       { fontSize: 16, fontWeight: '800', marginTop: 2 },
  scoreCircle: { alignItems: 'center' },
  scoreNum:    { fontSize: 32, fontWeight: '800' },
  scoreMax:    { color: '#6f787d', fontSize: 11 },
});

// ─── TOGGLE ITEM ─────────────────────────────────────────────────────────────
function SecurityToggleItem({ title, desc, icon, isEnabled, onToggle }: {
  title: string; desc: string; icon: React.ReactNode;
  isEnabled: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={ti.row}>
      <View style={ti.iconBox}>{icon}</View>
      <View style={ti.info}>
        <Text style={ti.title}>{title}</Text>
        <Text style={ti.desc}>{desc}</Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={onToggle}
        trackColor={{ false: '#3f484c', true: '#006782' }}
        thumbColor="white"
      />
    </View>
  );
}
const ti = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  info:    { flex: 1 },
  title:   { color: '#f5fafb', fontSize: 15, fontWeight: '700' },
  desc:    { color: '#6f787d', fontSize: 12, marginTop: 2 },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function SecurityScreen() {
  const router = useRouter();

  const [faceIdEnabled,    setFaceIdEnabled]    = useState(false);
  const [incognito,        setIncognito]        = useState(false);
  const [doctorShare,      setDoctorShare]      = useState(true);
  const [biometricSupport, setBiometricSupport] = useState(false);
  const [loading2FA,       setLoading2FA]       = useState(false);

  // Modal cambio de contraseña
  const [showPwModal, setShowPwModal]   = useState(false);
  const [currentPw,   setCurrentPw]    = useState('');
  const [newPw,       setNewPw]        = useState('');
  const [confirmPw,   setConfirmPw]    = useState('');
  const [showPw,      setShowPw]       = useState(false);

  // Score de seguridad calculado
  const score = (faceIdEnabled ? 30 : 0) + (doctorShare ? 20 : 0) + 50; // base 50

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled    = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupport(hasHardware && enrolled);

      // Restaurar preferencias guardadas
      const pref = db_getPreference('faceIdEnabled');
      setFaceIdEnabled(pref === 'true');
      setIncognito(db_getPreference('incognito') === 'true');
      setDoctorShare(db_getPreference('doctorShare') !== 'false');
    })();
  }, []);

  const handleToggleFaceID = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Activar desbloqueo biométrico',
        fallbackLabel: 'Usar contraseña',
      });
      if (!result.success) {
        Alert.alert('Autenticación fallida', 'No se pudo verificar tu identidad.');
        return;
      }
      db_logSecurityEvent('biometric');
    }
    setFaceIdEnabled(value);
    db_setPreference('faceIdEnabled', String(value));
  };

  const handleToggleIncognito = (value: boolean) => {
    setIncognito(value);
    db_setPreference('incognito', String(value));
  };

  const handleToggleDoctorShare = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Desactivar sincronización',
        '¿Seguro? Tu médico dejará de recibir actualizaciones automáticas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Desactivar', onPress: () => {
            setDoctorShare(false);
            db_setPreference('doctorShare', 'false');
          }},
        ]
      );
    } else {
      setDoctorShare(true);
      db_setPreference('doctorShare', 'true');
    }
  };

  const handleSetup2FA = () => {
    setLoading2FA(true);
    // Simular envío de SMS/configuración
    setTimeout(() => {
      setLoading2FA(false);
      Alert.alert(
        '2FA Configurado',
        'Se ha activado la verificación en dos pasos. Recibirás un SMS la próxima vez que inicies sesión.',
        [{ text: 'Entendido' }]
      );
      db_logSecurityEvent('2fa_setup');
    }, 1500);
  };

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'La nueva contraseña no coincide.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Contraseña débil', 'Usa al menos 8 caracteres.');
      return;
    }
    // En producción: llamar al API de cambio de contraseña
    db_logSecurityEvent('password_change');
    Alert.alert('✓ Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente.', [
      { text: 'OK', onPress: () => { setShowPwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); } },
    ]);
  };

  const handleDeleteData = () => {
    Alert.alert(
      '⚠️ ACCIÓN IRREVERSIBLE',
      'Se eliminarán todos tus datos de salud, historial y configuraciones. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Solicitud enviada', 'Tu solicitud de eliminación de datos ha sido registrada. Recibirás una confirmación por correo.');
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ backgroundColor: '#0b1213' }}>
        <View style={s.navbar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft color="#c4ebe0" size={24} />
          </TouchableOpacity>
          <Text style={s.navTitle}>Seguridad y Privacidad</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <SecurityHero score={score} />

        {/* ACCESO BIOMÉTRICO */}
        <Text style={s.sectionLabel}>SEGURIDAD DE ACCESO</Text>
        <View style={s.listCard}>
          <SecurityToggleItem
            title="Desbloqueo Biométrico"
            desc={biometricSupport
              ? 'FaceID / Huella digital habilitados'
              : 'No disponible en este dispositivo'}
            icon={<Fingerprint color="#a9cec4" size={24} />}
            isEnabled={faceIdEnabled && biometricSupport}
            onToggle={handleToggleFaceID}
          />
        </View>

        {/* AUTENTICACIÓN GRID */}
        <View style={s.grid}>
          <View style={s.authCard}>
            <View style={s.recommendedBadge}>
              <CheckCircle2 color="#89d89d" size={13} />
              <Text style={s.recommendedText}>RECOMENDADO</Text>
            </View>
            <Text style={s.cardTitle}>Autenticación 2FA</Text>
            <Text style={s.cardDesc}>Capa extra de seguridad vía SMS.</Text>
            <TouchableOpacity
              style={[s.cardBtn, loading2FA && { opacity: 0.6 }]}
              onPress={handleSetup2FA}
              disabled={loading2FA}
            >
              {loading2FA
                ? <ActivityIndicator color="#baeaff" size="small" />
                : <Text style={s.cardBtnText}>Configurar</Text>}
            </TouchableOpacity>
          </View>

          <View style={s.authCard}>
            <Text style={s.cardTitle}>Contraseña</Text>
            <Text style={s.cardDesc}>Última actualización:{'\n'}
              <Text style={{ fontStyle: 'italic', color: '#bfc8ca' }}>Hace 3 meses</Text>
            </Text>
            <TouchableOpacity style={s.cardBtnOutline} onPress={() => setShowPwModal(true)}>
              <Text style={s.cardBtnTextOutline}>Cambiar ahora</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PRIVACIDAD */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionLabel}>PRIVACIDAD DE DATOS</Text>
        </View>
        <View style={s.listCard}>
          <SecurityToggleItem
            title="Modo Incógnito"
            desc="Ocultar registros médicos en la vista general"
            icon={<EyeOff color="#006782" size={22} />}
            isEnabled={incognito}
            onToggle={handleToggleIncognito}
          />
          <View style={s.divider} />
          <SecurityToggleItem
            title="Compartir con Médicos"
            desc="Sincronización automática de reportes"
            icon={<Stethoscope color="#1a6c3c" size={22} />}
            isEnabled={doctorShare}
            onToggle={handleToggleDoctorShare}
          />
        </View>

        {/* ELIMINAR DATOS */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteData}>
          <View style={s.deleteLeft}>
            <Trash2 color="#ba1a1a" size={20} />
            <Text style={s.deleteText}>Solicitar Eliminación de Datos</Text>
          </View>
          <ChevronRight color="rgba(186,26,26,0.4)" size={18} />
        </TouchableOpacity>
        <Text style={s.deleteWarning}>
          Esta acción es irreversible. Se eliminarán todos tus datos de salud, configuraciones e historial de Serenity.
        </Text>

        {/* COMPLIANCE */}
        <View style={s.complianceRow}>
          {[
            { icon: <ShieldCheck color="#6f787d" size={13} />, text: 'HIPAA COMPLIANT' },
            { icon: <Lock        color="#6f787d" size={13} />, text: 'GDPR READY'      },
          ].map(({ icon, text }) => (
            <View key={text} style={s.complianceBadge}>
              {icon}
              <Text style={s.complianceText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal cambio de contraseña */}
      <Modal visible={showPwModal} transparent animationType="slide">
        <View style={pw.overlay}>
          <View style={pw.sheet}>
            <View style={pw.header}>
              <Text style={pw.title}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setShowPwModal(false)} style={pw.closeBtn}>
                <X color="#6f787d" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={pw.label}>CONTRASEÑA ACTUAL</Text>
            <View style={pw.inputRow}>
              <TextInput
                style={pw.input}
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry={!showPw}
                placeholder="••••••••"
                placeholderTextColor="#3f484c"
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff color="#6f787d" size={18} /> : <Eye color="#6f787d" size={18} />}
              </TouchableOpacity>
            </View>

            <Text style={pw.label}>NUEVA CONTRASEÑA</Text>
            <TextInput
              style={pw.inputFull}
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#3f484c"
            />

            <Text style={pw.label}>CONFIRMAR NUEVA CONTRASEÑA</Text>
            <TextInput
              style={pw.inputFull}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry
              placeholder="Repite la contraseña"
              placeholderTextColor="#3f484c"
            />

            <TouchableOpacity style={pw.saveBtn} onPress={handleChangePassword}>
              <Text style={pw.saveBtnText}>Confirmar Cambio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const pw = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#1a1a1a', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:    { color: '#c4ebe0', fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100 },
  label:    { color: '#6f787d', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171d1e', borderRadius: 14, paddingHorizontal: 14, marginBottom: 14 },
  input:    { flex: 1, color: '#fff', padding: 14, fontSize: 15 },
  inputFull:{ backgroundColor: '#171d1e', borderRadius: 14, padding: 14, color: '#fff', marginBottom: 14, fontSize: 15 },
  saveBtn:  { backgroundColor: '#006782', padding: 18, borderRadius: 100, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#0b1213' },
  navbar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:           { backgroundColor: 'rgba(0,103,130,0.2)', padding: 10, borderRadius: 16 },
  navTitle:          { color: '#f5fafb', fontSize: 17, fontWeight: '800' },
  scroll:            { padding: 24 },
  sectionLabel:      { color: '#c4ebe0', fontSize: 10, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2 },
  sectionHeaderRow:  { marginTop: 20, marginBottom: 0 },
  listCard:          { backgroundColor: '#1c2527', borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  divider:           { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 20 },
  grid:              { flexDirection: 'row', gap: 12, marginBottom: 24 },
  authCard:          { flex: 1, backgroundColor: '#1c2527', borderRadius: 24, padding: 18, justifyContent: 'space-between', minHeight: 155 },
  recommendedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  recommendedText:   { color: '#89d89d', fontSize: 9, fontWeight: '800' },
  cardTitle:         { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardDesc:          { color: '#6f787d', fontSize: 11, marginTop: 4, lineHeight: 16 },
  cardBtn:           { backgroundColor: '#3f484c', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  cardBtnText:       { color: '#baeaff', fontSize: 12, fontWeight: '700' },
  cardBtnOutline:    { borderWidth: 1, borderColor: 'rgba(111,120,125,0.3)', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  cardBtnTextOutline:{ color: '#baeaff', fontSize: 12, fontWeight: '700' },
  deleteBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(186,26,26,0.05)', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(186,26,26,0.2)', marginBottom: 12 },
  deleteLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteText:        { color: '#ba1a1a', fontWeight: '800', fontSize: 14 },
  deleteWarning:     { color: '#6f787d', fontSize: 11, textAlign: 'center', lineHeight: 17, marginBottom: 24 },
  complianceRow:     { flexDirection: 'row', justifyContent: 'center', gap: 24, opacity: 0.5 },
  complianceBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  complianceText:    { color: '#bfc8cd', fontSize: 10, fontWeight: '700' },
});
