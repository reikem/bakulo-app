/**
 * app/login.tsx — v4 CORREGIDO
 *
 * Fixes:
 *  ✅ Eliminado router.push('/VerifyEmail') → no existe esa ruta
 *  ✅ result.user.user_metadata → result.user.displayName (tipo correcto de supabaseClient v5)
 *  ✅ result.user (Apple/Google) usa la interfaz { id, email, displayName } correcta
 *  ✅ clearUserData / loadUserData / setCurrentUser del AppStore
 *  ✅ Email not confirmed → muestra banner en pantalla, no navega a ruta inexistente
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  supaSignIn,
  supaSignInWithGoogle,
  supaSignInWithApple,
  getSession,
  supaSignOut,
} from '@/service/supabaseClient';
import { db_setCurrentUser, db_logSecurityEvent } from '@/service/database';
import { useAppStore } from '@/store/AppStore';

const { width } = Dimensions.get('window');

const C = {
  bg:           '#0d1316',
  primary:      '#006782',
  primaryLight: '#baeaff',
  surface:      'rgba(29,36,38,0.85)',
  secondaryDim: '#a9cec4',
  error:        '#ef4444',
  warning:      '#f59e0b',
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function SerenityLogo() {
  return (
    <View style={logo.wrap}>
      <View style={logo.ring}>
        <View style={logo.drop} />
      </View>
    </View>
  );
}
const logo = StyleSheet.create({
  wrap: { width:72, height:72, alignItems:'center', justifyContent:'center' },
  ring: { width:72, height:72, borderRadius:36, borderWidth:2, borderColor:'rgba(196,235,224,0.3)', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,103,130,0.15)' },
  drop: { width:28, height:34, borderRadius:14, backgroundColor:'#006782', borderBottomLeftRadius:14, borderBottomRightRadius:14, borderTopLeftRadius:14, borderTopRightRadius:3 },
});

// ─── SOCIAL BUTTON ────────────────────────────────────────────────────────────
function SocialButton({ label, icon, onPress, loading, disabled }: {
  label:string; icon:React.ReactNode; onPress:()=>void; loading?:boolean; disabled?:boolean;
}) {
  return (
    <TouchableOpacity
      style={[sb.btn, disabled && sb.btnDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small"/>
        : <>{icon}<Text style={sb.label}>{label}</Text></>}
    </TouchableOpacity>
  );
}
const sb = StyleSheet.create({
  btn:        { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'rgba(255,255,255,0.06)', height:50, borderRadius:14, borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  btnDisabled:{ opacity:0.4 },
  label:      { color:'#ecf2f3', fontSize:14, fontWeight:'600' },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();

  // AppStore: solo usar lo que realmente existe
  const store = useAppStore();
  const setCurrentUser = (store as any).setCurrentUser ?? (() => {});
  const clearUserData  = (store as any).clearUserData  ?? (() => {});
  const loadUserData   = (store as any).loadUserData   ?? (() => {});

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [loadGoogle,   setLoadGoogle]   = useState(false);
  const [loadApple,    setLoadApple]    = useState(false);
  const [emailErr,     setEmailErr]     = useState('');
  const [passErr,      setPassErr]      = useState('');
  const [unverifiedBanner, setUnverifiedBanner] = useState(false);

  // Si ya hay sesión activa → ir directo a tabs
  useEffect(() => {
    getSession().then(session => {
      if (session?.user) router.replace('/(tabs)');
    }).catch(() => {});
  }, []);

  const validate = () => {
    let ok = true;
    if (!email.trim() || !email.includes('@')) {
      setEmailErr('Ingresa un email válido'); ok = false;
    } else setEmailErr('');
    if (!password || password.length < 6) {
      setPassErr('Mínimo 6 caracteres'); ok = false;
    } else setPassErr('');
    return ok;
  };

  // ── Login email/password ──────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setUnverifiedBanner(false);
    try {
      const data = await supaSignIn(email.trim().toLowerCase(), password);
      const user = data?.user;
      if (!user) throw new Error('Sin usuario en respuesta');

      const appUser = {
        id:          user.id,
        username:    user.email ?? '',
        displayName: (user.user_metadata as any)?.display_name
                     ?? (user.user_metadata as any)?.full_name
                     ?? user.email
                     ?? 'Usuario',
        email:       user.email ?? '',
        avatarUrl:   (user.user_metadata as any)?.avatar_url,
        activated:   !!user.email_confirmed_at,
      };

      try { clearUserData(); } catch {}
      try { db_setCurrentUser(appUser); } catch {}
      try { db_logSecurityEvent('login'); } catch {}
      try { setCurrentUser(appUser); } catch {}
      try { loadUserData(); } catch {}

      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Invalid login') || msg.includes('credentials') || msg.includes('invalid_credentials')) {
        setPassErr('Email o contraseña incorrectos');
      } else if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
        // Mostrar banner en pantalla en vez de navegar a ruta inexistente
        setUnverifiedBanner(true);
      } else {
        Alert.alert('Error al ingresar', msg || 'Intenta de nuevo');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoadGoogle(true);
    try {
      const result = await supaSignInWithGoogle();

      // _OAUTH_REDIRECT_ = se abrió el navegador, la sesión llega por deep link
      if (result.redirected || result.error === '_OAUTH_REDIRECT_') return;

      if (!result.success) {
        if (result.error && result.error !== 'Cancelado') {
          Alert.alert('Google', result.error);
        }
        return;
      }

      // result.user es { id, email?, displayName } según supabaseClient v5
      if (result.user) {
        const appUser = {
          id:          result.user.id,
          username:    result.user.email ?? result.user.id,
          displayName: result.user.displayName,
          email:       result.user.email ?? '',
          activated:   true,
        };
        try { clearUserData(); } catch {}
        try { db_setCurrentUser(appUser); } catch {}
        try { setCurrentUser(appUser); } catch {}
        try { loadUserData(); } catch {}
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Google', e?.message ?? 'Error al conectar con Google');
    } finally {
      setLoadGoogle(false);
    }
  };

  // ── Apple Sign In ─────────────────────────────────────────────────────────
  const handleApple = async () => {
    setLoadApple(true);
    try {
      const result = await supaSignInWithApple();

      if (!result.success) {
        // No mostrar alerta si el usuario solo canceló
        const isCanceled = result.error?.includes('Cancelado') || result.error?.includes('canceled');
        if (!isCanceled && result.error) {
          Alert.alert('Apple Sign In', result.error);
        }
        return;
      }

      // result.user es { id, email?, displayName } según supabaseClient v5
      if (result.user) {
        const appUser = {
          id:          result.user.id,
          username:    result.user.email ?? result.user.id,
          displayName: result.user.displayName,
          email:       result.user.email ?? '',
          activated:   true,
        };
        try { clearUserData(); } catch {}
        try { db_setCurrentUser(appUser); } catch {}
        try { setCurrentUser(appUser); } catch {}
        try { loadUserData(); } catch {}
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Apple', e?.message ?? 'Error al conectar con Apple');
    } finally {
      setLoadApple(false);
    }
  };

  const isLoading = loading || loadGoogle || loadApple;

  return (
    <SafeAreaView style={s.container}>
      <View style={[s.glow, { top:-120, left:-80,  backgroundColor:'#004e63' }]}/>
      <View style={[s.glow, { bottom:-100, right:-80, backgroundColor:'#005229' }]}/>

      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{ flex:1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={s.header}>
            <SerenityLogo/>
            <Text style={s.title}>Serenity</Text>
            <Text style={s.subtitle}>Tu compañero de salud diario</Text>
          </View>

          {/* Banner email no verificado */}
          {unverifiedBanner && (
            <View style={s.unverifiedBanner}>
              <AlertCircle color={C.warning} size={18}/>
              <View style={{ flex:1 }}>
                <Text style={s.unverifiedTitle}>Verifica tu correo electrónico</Text>
                <Text style={s.unverifiedBody}>
                  Revisa tu bandeja de entrada y haz clic en el enlace de activación.
                  Si no lo ves, revisa la carpeta de spam.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setUnverifiedBanner(false)}>
                <X color={C.warning} size={16}/>
              </TouchableOpacity>
            </View>
          )}

          {/* Formulario */}
          <View style={s.card}>
            {/* Email */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <View style={[s.inputWrap, !!emailErr && s.inputErrBorder]}>
                <Mail color={C.secondaryDim} size={18}/>
                <TextInput
                  style={s.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="rgba(169,206,196,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={t => { setEmail(t); setEmailErr(''); setUnverifiedBanner(false); }}
                  editable={!isLoading}
                />
              </View>
              {!!emailErr && <Text style={s.errTxt}>{emailErr}</Text>}
            </View>

            {/* Contraseña */}
            <View style={s.fieldGroup}>
              <View style={s.fieldLabelRow}>
                <Text style={s.fieldLabel}>CONTRASEÑA</Text>
                <TouchableOpacity onPress={() => router.push('/ForgotPassword')}>
                  <Text style={s.forgotTxt}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
              <View style={[s.inputWrap, !!passErr && s.inputErrBorder]}>
                <Lock color={C.secondaryDim} size={18}/>
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(169,206,196,0.3)"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={t => { setPassword(t); setPassErr(''); }}
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                  {showPass
                    ? <EyeOff color={C.secondaryDim} size={18}/>
                    : <Eye    color={C.secondaryDim} size={18}/>}
                </TouchableOpacity>
              </View>
              {!!passErr && <Text style={s.errTxt}>{passErr}</Text>}
            </View>

            {/* Botón ingresar */}
            <TouchableOpacity
              style={[s.loginBtn, isLoading && s.loginBtnOff]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff"/>
                : <Text style={s.loginBtnTxt}>Ingresar</Text>}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={s.divider}>
              <View style={s.divLine}/>
              <Text style={s.divTxt}>O CONTINÚA CON</Text>
              <View style={s.divLine}/>
            </View>

            {/* OAuth */}
            <View style={s.socialRow}>
              <SocialButton
                label="Google"
                loading={loadGoogle}
                disabled={isLoading && !loadGoogle}
                onPress={handleGoogle}
                icon={
                  <Image
                    source={{ uri:'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.png' }}
                    style={{ width:18, height:18 }}
                  />
                }
              />
              {Platform.OS === 'ios' && (
                <SocialButton
                  label="Apple"
                  loading={loadApple}
                  disabled={isLoading && !loadApple}
                  onPress={handleApple}
                  icon={
                    <View style={{ width:18, height:18, alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ color:'#fff', fontSize:16, fontWeight:'700' }}>⌘</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerTxt}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/Register')}>
              <Text style={s.footerLink}>Regístrate gratis</Text>
            </TouchableOpacity>
          </View>

          {/* Promo */}
          <TouchableOpacity activeOpacity={0.9} style={s.promoBanner}>
            <LinearGradient
              colors={['#004e63','#005229']}
              start={{ x:0, y:0 }} end={{ x:1, y:1 }}
              style={s.promoGrad}
            >
              <Text style={s.promoTxt}>
                Únete a 20,000+ personas que gestionan su diabetes con Serenity 💙
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:        { flex:1, backgroundColor:C.bg },
  scroll:           { paddingHorizontal:24, paddingTop:56, paddingBottom:40 },
  glow:             { position:'absolute', width:width*0.7, height:width*0.7, borderRadius:width*0.35, opacity:0.12 },
  header:           { alignItems:'center', marginBottom:28, gap:10 },
  title:            { fontSize:34, fontWeight:'800', color:'#baeaff', letterSpacing:-0.5 },
  subtitle:         { fontSize:14, color:C.secondaryDim, opacity:0.75 },
  unverifiedBanner: { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'rgba(245,158,11,0.1)', borderRadius:16, padding:14, marginBottom:16, borderWidth:1, borderColor:'rgba(245,158,11,0.3)' },
  unverifiedTitle:  { color:C.warning, fontWeight:'700', fontSize:13, marginBottom:4 },
  unverifiedBody:   { color:'#bfc8cd', fontSize:12, lineHeight:18 },
  card:             { backgroundColor:C.surface, borderRadius:28, padding:22, gap:16, borderWidth:1, borderColor:'rgba(255,255,255,0.06)', marginBottom:20 },
  fieldGroup:       { gap:6 },
  fieldLabel:       { color:C.secondaryDim, fontSize:10, fontWeight:'700', letterSpacing:1.5 },
  fieldLabelRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  forgotTxt:        { color:'#baeaff', fontSize:11, fontWeight:'700' },
  inputWrap:        { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:14, paddingHorizontal:14, height:52, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  inputErrBorder:   { borderColor:'rgba(239,68,68,0.4)' },
  input:            { flex:1, color:'#fff', fontSize:15 },
  errTxt:           { color:C.error, fontSize:11, marginLeft:2 },
  loginBtn:         { backgroundColor:C.primary, height:52, borderRadius:26, alignItems:'center', justifyContent:'center', marginTop:4 },
  loginBtnOff:      { opacity:0.55 },
  loginBtnTxt:      { color:'#fff', fontSize:16, fontWeight:'700' },
  divider:          { flexDirection:'row', alignItems:'center', gap:8 },
  divLine:          { flex:1, height:StyleSheet.hairlineWidth, backgroundColor:'rgba(255,255,255,0.1)' },
  divTxt:           { color:'rgba(169,206,196,0.5)', fontSize:9, fontWeight:'700', letterSpacing:1 },
  socialRow:        { flexDirection:'row', gap:10 },
  footer:           { flexDirection:'row', justifyContent:'center', alignItems:'center', marginBottom:24 },
  footerTxt:        { color:C.secondaryDim, fontSize:14 },
  footerLink:       { color:'#baeaff', fontSize:14, fontWeight:'700' },
  promoBanner:      { borderRadius:20, overflow:'hidden' },
  promoGrad:        { padding:18 },
  promoTxt:         { color:'#fff', fontSize:14, fontWeight:'600', textAlign:'center', lineHeight:20 },
});