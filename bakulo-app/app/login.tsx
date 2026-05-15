/**
 * app/login.tsx — v5.1 (Mantenimiento de Servidores)
 * * ✅ Google/Apple deshabilitados temporalmente por costos de infraestructura.
 * ✅ Leyenda informativa sobre escalabilidad de servidores.
 * ✅ Login email/contraseña operativo con fallback SQLite.
 * ✅ Manejo de email no verificado con banner.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react-native';

import { getSession } from '@/service/supabaseClient';
import { authLogin, authResendVerification, authGetCurrentUser } from '@/service/authService';
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
  disabled:     '#1a1a1a',
  disabledTxt:  '#6f787d',
};

export default function LoginScreen() {
  const router = useRouter();
  const { setCurrentUser, loadUserData } = useAppStore();

  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [showPass,         setShowPass]         = useState(false);
  const [loadingEmail,     setLoadingEmail]     = useState(false);
  const [emailErr,         setEmailErr]         = useState('');
  const [passErr,          setPassErr]          = useState('');
  const [unverifiedBanner, setUnverifiedBanner] = useState(false);

  // Verificar sesión existente al montar
  useEffect(() => {
    getSession()
      .then(session => {
        if (session?.user) {
          router.replace('/(tabs)' as any);
        }
      })
      .catch(() => {});
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

  const handleEmailLogin = async () => {
    if (!validate()) return;
    setLoadingEmail(true);
    setUnverifiedBanner(false);
    try {
      const result = await authLogin(email.trim().toLowerCase(), password);
      if (!result.success) {
        if (result.needsVerification) {
          setUnverifiedBanner(true);
          setEmailErr('');
        } else {
          setPassErr(result.error ?? 'Email o contraseña incorrectos');
        }
        return;
      }
      if (result.user) {
        setCurrentUser(result.user);
        await loadUserData().catch(() => {});
        router.replace('/(tabs)' as any);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Intenta de nuevo');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) { setEmailErr('Ingresa tu email primero'); return; }
    const r = await authResendVerification(email.trim().toLowerCase());
    Alert.alert(
      r.success ? '✅ Enviado' : '❌ Error',
      r.success ? 'Revisa tu bandeja de entrada.' : r.error ?? 'No se pudo enviar'
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={[s.glow, { top:-120, left:-80, backgroundColor:'#004e63' }]}/>
      <View style={[s.glow, { bottom:-100, right:-80, backgroundColor:'#005229' }]}/>

      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={s.header}>
            <View style={s.logoWrap}><View style={s.logoDrop}/></View>
            <Text style={s.title}>Serenity</Text>
            <Text style={s.subtitle}>Tu asistente inteligente para la diabetes</Text>
          </View>

          {unverifiedBanner && (
            <View style={s.verifyBanner}>
              <AlertCircle color={C.warning} size={18}/>
              <View style={{ flex:1 }}>
                <Text style={s.verifyTitle}>Verifica tu correo</Text>
                <Text style={s.verifyBody}>Revisa tu bandeja de entrada y activa tu cuenta.</Text>
                <TouchableOpacity onPress={handleResendVerification} style={s.resendBtn}>
                  <Text style={s.resendBtnText}>Reenviar correo →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setUnverifiedBanner(false)}><X color={C.warning} size={16}/></TouchableOpacity>
            </View>
          )}

          <View style={s.card}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <View style={[s.inputWrap, !!emailErr && s.inputErr]}>
                <Mail color={C.secondaryDim} size={18}/>
                <TextInput
                  style={s.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="rgba(169,206,196,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={t => { setEmail(t); setEmailErr(''); setUnverifiedBanner(false); }}
                  editable={!loadingEmail}
                />
              </View>
              {!!emailErr && <Text style={s.errTxt}>{emailErr}</Text>}
            </View>

            <View style={s.fieldGroup}>
              <View style={s.fieldLabelRow}>
                <Text style={s.fieldLabel}>CONTRASEÑA</Text>
                <TouchableOpacity onPress={() => router.push('/ForgotPassword' as any)}>
                  <Text style={s.forgotTxt}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
              <View style={[s.inputWrap, !!passErr && s.inputErr]}>
                <Lock color={C.secondaryDim} size={18}/>
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(169,206,196,0.3)"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={t => { setPassword(t); setPassErr(''); }}
                  editable={!loadingEmail}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff color={C.secondaryDim} size={18}/> : <Eye color={C.secondaryDim} size={18}/>}
                </TouchableOpacity>
              </View>
              {!!passErr && <Text style={s.errTxt}>{passErr}</Text>}
            </View>

            <TouchableOpacity style={[s.loginBtn, loadingEmail && s.loginBtnOff]} onPress={handleEmailLogin} disabled={loadingEmail}>
              {loadingEmail ? <ActivityIndicator color="#fff"/> : <Text style={s.loginBtnTxt}>Ingresar</Text>}
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.divLine}/><Text style={s.divTxt}>O CONTINÚA CON</Text><View style={s.divLine}/>
            </View>

            {/* BOTÓN GOOGLE DESHABILITADO */}
            <TouchableOpacity style={s.socialBtnDisabled} disabled={true}>
              <Image 
                source={{ uri:'https://img.icons8.com/color/48/000000/google-logo.png' }} 
                style={[s.googleIcon, { opacity: 0.4 }]} 
              />
              <Text style={s.socialBtnTxtDisabled}>Ingresar con Google</Text>
            </TouchableOpacity>

            {/* BOTÓN APPLE DESHABILITADO (Solo iOS) */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={s.socialBtnDisabled} disabled={true}>
                <Text style={[s.appleLogo, { color: C.disabledTxt }]}></Text>
                <Text style={s.socialBtnTxtDisabled}>Ingresar con Apple</Text>
              </TouchableOpacity>
            )}

            {/* LEYENDA DE APOYO / INFRAESTRUCTURA */}
            <View style={s.supportNotice}>
              <AlertCircle color={C.primaryLight} size={14} />
              <Text style={s.supportNoticeTxt}>
                Cuando esto tenga apoyo se podrá contratar servidores más grandes y los servicios de Google y Apple que se solicita.
              </Text>
            </View>
          </View>

          <View style={s.footer}>
            <Text style={s.footerTxt}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/Register' as any)}>
              <Text style={s.footerLink}>Regístrate gratis</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:C.bg },
  scroll:         { paddingHorizontal:24, paddingTop:40, paddingBottom:40 },
  glow:           { position:'absolute', width:width*0.7, height:width*0.7, borderRadius:width*0.35, opacity:0.12 },
  header:         { alignItems:'center', marginBottom:28, gap:10 },
  logoWrap:       { width:72, height:72, borderRadius:36, borderWidth:2, borderColor:'rgba(196,235,224,0.3)', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,103,130,0.15)' },
  logoDrop:       { width:28, height:34, borderRadius:14, backgroundColor:'#006782', borderTopRightRadius:3 },
  title:          { fontSize:34, fontWeight:'800', color:'#baeaff', letterSpacing:-0.5 },
  subtitle:       { fontSize:14, color:C.secondaryDim, opacity:0.75, textAlign:'center' },
  card:           { backgroundColor:C.surface, borderRadius:28, padding:22, gap:16, borderWidth:1, borderColor:'rgba(255,255,255,0.06)', marginBottom:20 },
  fieldGroup:     { gap:6 },
  fieldLabel:     { color:C.secondaryDim, fontSize:10, fontWeight:'700', letterSpacing:1.5 },
  fieldLabelRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  forgotTxt:      { color:'#baeaff', fontSize:11, fontWeight:'700' },
  inputWrap:      { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:14, paddingHorizontal:14, height:52, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  inputErr:       { borderColor:'rgba(239,68,68,0.4)' },
  input:          { flex:1, color:'#fff', fontSize:15 },
  errTxt:         { color:C.error, fontSize:11, marginLeft:2 },
  loginBtn:       { backgroundColor:C.primary, height:52, borderRadius:26, alignItems:'center', justifyContent:'center' },
  loginBtnOff:    { opacity:0.45 },
  loginBtnTxt:    { color:'#fff', fontSize:16, fontWeight:'700' },
  divider:        { flexDirection:'row', alignItems:'center', gap:8 },
  divLine:        { flex:1, height:StyleSheet.hairlineWidth, backgroundColor:'rgba(255,255,255,0.1)' },
  divTxt:         { color:'rgba(169,206,196,0.4)', fontSize:9, fontWeight:'700', letterSpacing:1 },
  // Estilos Deshabilitados
  socialBtnDisabled: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, 
    backgroundColor: C.disabled, height:52, borderRadius:26, opacity: 0.6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  socialBtnTxtDisabled: { color: C.disabledTxt, fontSize:15, fontWeight:'700' },
  googleIcon:     { width:22, height:22 },
  appleLogo:      { fontSize:22 },
  // Leyenda de Soporte
  supportNotice: {
    flexDirection:'row', alignItems:'center', gap:8, 
    backgroundColor:'rgba(186,234,255,0.05)', padding:12, borderRadius:16,
    borderWidth:1, borderColor:'rgba(186,234,255,0.1)'
  },
  supportNoticeTxt: { color: C.primaryLight, fontSize:10.5, flex:1, lineHeight:15, fontStyle:'italic' },
  // Footer
  footer:         { flexDirection:'row', justifyContent:'center', alignItems:'center', marginBottom:24 },
  footerTxt:      { color:C.secondaryDim, fontSize:14 },
  footerLink:     { color:'#baeaff', fontSize:14, fontWeight:'700' },
  verifyBanner:   { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'rgba(245,158,11,0.1)', borderRadius:16, padding:14, marginBottom:16, borderWidth:1, borderColor:'rgba(245,158,11,0.3)' },
  verifyTitle:    { color:C.warning, fontWeight:'700', fontSize:13, marginBottom:3 },
  verifyBody:     { color:'#bfc8cd', fontSize:12, lineHeight:18 },
  resendBtn:      { marginTop:8, alignSelf:'flex-start', backgroundColor:'rgba(245,158,11,0.15)', paddingHorizontal:10, paddingVertical:5, borderRadius:100 },
  resendBtnText:  { color:C.warning, fontSize:11, fontWeight:'700' },
});