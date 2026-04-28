/**
 * login.tsx — v2
 * Autenticación real contra SQLite local.
 * Usuario de prueba: jaime / 1234567
 */
import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, Image, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, Scale, Apple, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { db_validateUser, db_setCurrentUser, db_logSecurityEvent } from '@/service/database';

const { width } = Dimensions.get('window');

const C = {
  bg:             '#171d1e',
  primary:        '#004e63',
  primaryFixed:   '#baeaff',
  onPrimary:      '#ffffff',
  secondaryDim:   '#a9cec4',
  surface:        'rgba(43,49,50,0.3)',
  primaryContainer:'#006782',
  onPrimaryContainer:'#9fe2ff',
};

export default function LoginScreen() {
  const router = useRouter();
  const [username,   setUsername]   = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [usernameErr,setUsernameErr]= useState('');
  const [passwordErr,setPasswordErr]= useState('');

  const validate = (): boolean => {
    let ok = true;
    if (!username.trim()) {
      setUsernameErr('El usuario es requerido');
      ok = false;
    } else { setUsernameErr(''); }

    if (!password) {
      setPasswordErr('La contraseña es requerida');
      ok = false;
    } else if (password.length < 6) {
      setPasswordErr('Mínimo 6 caracteres');
      ok = false;
    } else { setPasswordErr(''); }

    return ok;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Pequeño delay para simular llamada async
      await new Promise(r => setTimeout(r, 600));
      const user = db_validateUser(username.trim().toLowerCase(), password);
      if (!user) {
        setPasswordErr('Usuario o contraseña incorrectos');
        setLoading(false);
        return;
      }
      db_setCurrentUser(user);
      db_logSecurityEvent('login');
      // Navegar al dashboard
      router.replace('/(tabs)/DashboardScreen');
    } catch (e) {
      Alert.alert('Error', 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={[s.blurCircle, { top: -50,   left:  -50, backgroundColor: C.primary  }]} />
      <View style={[s.blurCircle, { bottom: -50, right: -50, backgroundColor: '#005229' }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={s.header}>
            <View style={s.logo}>
              <Scale color={C.onPrimaryContainer} size={32} />
            </View>
            <Text style={s.title}>Serenity</Text>
            <Text style={s.subtitle}>Gestión empática de tu salud.</Text>
          </View>

          {/* ── Demo hint ── */}
          <View style={s.demoHint}>
            <Text style={s.demoText}>
              Usuario demo: <Text style={s.demoCode}>jaime</Text> · Contraseña: <Text style={s.demoCode}>1234567</Text>
            </Text>
          </View>

          {/* ── Formulario ── */}
          <View style={s.form}>

            {/* Username */}
            <View style={s.inputGroup}>
              <Text style={s.label}>USUARIO</Text>
              <View style={[s.inputWrap, !!usernameErr && s.inputError]}>
                <User color={C.secondaryDim} size={20} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="tu usuario"
                  placeholderTextColor="rgba(169,206,196,0.3)"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={t => { setUsername(t); setUsernameErr(''); }}
                  editable={!loading}
                />
              </View>
              {!!usernameErr && <Text style={s.errText}>{usernameErr}</Text>}
            </View>

            {/* Password */}
            <View style={s.inputGroup}>
              <View style={s.labelRow}>
                <Text style={s.label}>CONTRASEÑA</Text>
                <TouchableOpacity><Text style={s.forgot}>¿OLVIDASTE TU CONTRASEÑA?</Text></TouchableOpacity>
              </View>
              <View style={[s.inputWrap, !!passwordErr && s.inputError]}>
                <Lock color={C.secondaryDim} size={20} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(169,206,196,0.3)"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={t => { setPassword(t); setPasswordErr(''); }}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                  {showPass
                    ? <EyeOff color={C.secondaryDim} size={20} />
                    : <Eye    color={C.secondaryDim} size={20} />}
                </TouchableOpacity>
              </View>
              {!!passwordErr && <Text style={s.errText}>{passwordErr}</Text>}
            </View>

            {/* Botón Login */}
            <TouchableOpacity
              style={[s.loginBtn, loading && s.loginBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.loginBtnText}>Ingresar</Text>}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>O CONTINÚA CON</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Social */}
            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn}>
                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.png' }} style={s.socialIcon} />
                <Text style={s.socialText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn}>
                <Apple color="#fff" size={20} />
                <Text style={s.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              ¿No tienes cuenta? <Text style={s.signUp}>Regístrate</Text>
            </Text>
          </View>

          {/* Promo banner */}
          <TouchableOpacity activeOpacity={0.9} style={s.promoBanner}>
            <LinearGradient colors={[C.primary, '#00210d']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={s.promoGrad}>
              <View style={s.promoContent}>
                <Text style={s.promoTitle}>Únete a 20,000+ personas que gestionan su salud.</Text>
                <View style={s.avatarGroup}>
                  <View style={[s.avatar, { backgroundColor: '#444' }]} />
                  <View style={[s.avatar, { backgroundColor: '#666', marginLeft: -12 }]} />
                  <View style={[s.avatarBadge, { marginLeft: -12 }]}>
                    <Text style={s.avatarBadgeText}>+12k</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  scroll:          { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  blurCircle:      { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: (width * 0.8) / 2, opacity: 0.15 },

  header:          { alignItems: 'center', marginBottom: 28 },
  logo:            { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  title:           { fontSize: 32, fontWeight: '800', color: C.primaryFixed, letterSpacing: -0.5 },
  subtitle:        { fontSize: 14, color: C.secondaryDim, textAlign: 'center', marginTop: 8, opacity: 0.8 },

  demoHint:        { backgroundColor: 'rgba(0,103,130,0.12)', borderWidth: 1, borderColor: 'rgba(0,103,130,0.3)', borderRadius: 12, padding: 12, marginBottom: 24 },
  demoText:        { color: '#86d0ef', fontSize: 13, textAlign: 'center' },
  demoCode:        { fontWeight: '800', color: '#baeaff' },

  form:            { gap: 20 },
  inputGroup:      { gap: 6 },
  labelRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  label:           { fontSize: 10, fontWeight: '700', color: C.secondaryDim, letterSpacing: 1.5 },
  forgot:          { fontSize: 10, fontWeight: '700', color: C.primaryFixed, letterSpacing: 1 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'transparent' },
  inputError:      { borderColor: 'rgba(239,68,68,0.5)' },
  inputIcon:       { marginRight: 12, opacity: 0.6 },
  input:           { flex: 1, color: '#fff', fontSize: 16 },
  errText:         { color: '#ef4444', fontSize: 11, marginLeft: 4 },

  loginBtn:        { backgroundColor: C.primary, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  loginBtnDisabled:{ opacity: 0.6 },
  loginBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider:         { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText:     { marginHorizontal: 10, color: C.secondaryDim, fontSize: 10, letterSpacing: 1 },

  socialRow:       { flexDirection: 'row', gap: 12 },
  socialBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, height: 48, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 8 },
  socialIcon:      { width: 20, height: 20 },
  socialText:      { color: '#fff', fontSize: 14, fontWeight: '500' },

  footer:          { marginTop: 32, alignItems: 'center' },
  footerText:      { color: C.secondaryDim, opacity: 0.8 },
  signUp:          { color: C.primaryFixed, fontWeight: '700' },

  promoBanner:     { marginTop: 40, borderRadius: 24, overflow: 'hidden', height: 100 },
  promoGrad:       { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  promoContent:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promoTitle:      { color: '#fff', fontSize: 14, fontWeight: '700', maxWidth: '60%', lineHeight: 18 },
  avatarGroup:     { flexDirection: 'row' },
  avatar:          { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: C.primary },
  avatarBadge:     { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryContainer, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.primary },
  avatarBadgeText: { color: C.onPrimaryContainer, fontSize: 8, fontWeight: 'bold' },
});