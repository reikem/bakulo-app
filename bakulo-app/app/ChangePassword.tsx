/**
 * app/ChangePassword.tsx — v3 SEGURO
 *
 * ✅ Usa authUpdatePassword() con validación fuerte
 * ✅ Indicador de fortaleza en tiempo real
 * ✅ Detecta contraseña igual a la actual
 * ✅ Requiere sesión válida (valida JWT antes de cambiar)
 * ✅ Funciona desde deep link (fromReset=true) y desde SecurityScreen
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react-native';
import { authUpdatePassword } from '@/service/authService';
import { validatePasswordStrength } from '@/service/securityService';
import { supabase } from '@/service/supabaseClient';
import { TextInput } from 'react-native';

const C = {
  bg:'#0d1517', primary:'#00647e', primaryFixed:'#baeaff',
  primaryContainer:'#004e63', secondaryDim:'#a9cec4',
  surface:'rgba(43,56,58,0.45)', error:'#ef4444', success:'#4ade80',
};

function strengthColor(score: number) {
  return ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'][score] ?? '#ef4444';
}
function strengthLabel(score: number) {
  return ['Muy débil','Débil','Regular','Fuerte','Muy fuerte'][score] ?? 'Muy débil';
}

function PwdField({ label, value, onChange, show, onToggle, error, editable }: any) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputWrap, !!error && s.inputError]}>
        <Lock color={C.secondaryDim} size={18} style={{ marginRight:10, opacity:0.7 }}/>
        <TextInput
          style={s.input}
          placeholder="••••••••"
          placeholderTextColor="rgba(169,206,196,0.3)"
          secureTextEntry={!show}
          value={value}
          onChangeText={onChange}
          editable={editable}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle}>
          {show ? <Eye color={C.secondaryDim} size={18}/> : <EyeOff color={C.secondaryDim} size={18}/>}
        </TouchableOpacity>
      </View>
      {!!error && <Text style={s.errText}>{error}</Text>}
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { fromReset } = useLocalSearchParams<{ fromReset?: string }>();
  const isFromReset   = fromReset === 'true';

  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show,    setShow]    = useState({ current:false, newPass:false, confirm:false });
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [errors,  setErrors]  = useState<Record<string,string>>({});

  // Fortaleza en tiempo real
  const strength = newPass.length > 0 ? validatePasswordStrength(newPass) : null;

  const validate = (): boolean => {
    const errs: Record<string,string> = {};
    if (!isFromReset && !current)      errs.current = 'Ingresa tu contraseña actual.';
    if (!newPass)                      errs.newPass = 'Ingresa la nueva contraseña.';
    else if (newPass.length < 8)       errs.newPass = 'Mínimo 8 caracteres.';
    else if (!isFromReset && newPass === current) errs.newPass = 'Debe ser diferente a la actual.';
    if (confirm !== newPass)           errs.confirm = 'Las contraseñas no coinciden.';
    if (strength && !strength.isStrong) errs.newPass = `Contraseña insegura: ${strength.issues[0]}`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let result: { success: boolean; error?: string };

      if (isFromReset) {
        // Viene del deep link — Supabase ya tiene sesión del token de reset
        const { error } = await supabase.auth.updateUser({ password: newPass });
        result = error ? { success:false, error:error.message } : { success:true };
      } else {
        result = await authUpdatePassword({
          currentPassword: current,
          newPassword:     newPass,
        });
      }

      if (!result.success) {
        setErrors({ current: result.error ?? 'Error al cambiar contraseña.' });
        return;
      }
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.successWrap}>
          <View style={s.successIcon}>
            <CheckCircle color={C.success} size={44} strokeWidth={1.8}/>
          </View>
          <Text style={s.successTitle}>¡Contraseña actualizada!</Text>
          <Text style={s.successBody}>
            Tu contraseña se cambió correctamente.{'\n'}
            {isFromReset ? 'Ahora puedes iniciar sesión.' : 'Tu sesión sigue activa.'}
          </Text>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => router.replace(isFromReset ? '/login' : '/(tabs)')}
          >
            <Text style={s.primaryBtnText}>
              {isFromReset ? 'Iniciar sesión' : 'Volver'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS==='ios'?'padding':'height'}
        style={{ flex:1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            {!isFromReset && (
              <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <ArrowLeft color={C.secondaryDim} size={22}/>
              </TouchableOpacity>
            )}
            <View style={s.iconWrap}>
              <ShieldCheck color={C.primaryFixed} size={28} strokeWidth={1.8}/>
            </View>
            <Text style={s.title}>
              {isFromReset ? 'Nueva contraseña' : 'Cambiar contraseña'}
            </Text>
            <Text style={s.subtitle}>
              Elige una contraseña segura que no uses en otros sitios.
            </Text>
          </View>

          {/* Contraseña actual (solo si no es reset) */}
          {!isFromReset && (
            <PwdField
              label="CONTRASEÑA ACTUAL"
              value={current}
              onChange={(t:string) => { setCurrent(t); setErrors(e=>({...e,current:''})); }}
              show={show.current}
              onToggle={() => setShow(v=>({...v,current:!v.current}))}
              error={errors.current}
              editable={!loading}
            />
          )}

          {/* Nueva contraseña */}
          <PwdField
            label="NUEVA CONTRASEÑA"
            value={newPass}
            onChange={(t:string) => { setNewPass(t); setErrors(e=>({...e,newPass:''})); }}
            show={show.newPass}
            onToggle={() => setShow(v=>({...v,newPass:!v.newPass}))}
            error={errors.newPass}
            editable={!loading}
          />

          {/* Indicador de fortaleza */}
          {strength && (
            <View style={s.strengthWrap}>
              <View style={s.strengthBar}>
                {[0,1,2,3].map(i => (
                  <View key={i} style={[
                    s.strengthSeg,
                    { backgroundColor: i < strength.score
                        ? strengthColor(strength.score)
                        : 'rgba(255,255,255,0.08)' },
                  ]}/>
                ))}
              </View>
              <Text style={[s.strengthLabel, { color: strengthColor(strength.score) }]}>
                {strengthLabel(strength.score)}
              </Text>
              {strength.issues.length > 0 && (
                <View style={s.issuesWrap}>
                  {strength.issues.map(issue => (
                    <Text key={issue} style={s.issueText}>· {issue}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Confirmar contraseña */}
          <PwdField
            label="CONFIRMAR CONTRASEÑA"
            value={confirm}
            onChange={(t:string) => { setConfirm(t); setErrors(e=>({...e,confirm:''})); }}
            show={show.confirm}
            onToggle={() => setShow(v=>({...v,confirm:!v.confirm}))}
            error={errors.confirm}
            editable={!loading}
          />

          {/* Requisitos */}
          <View style={s.tipsBox}>
            <Text style={s.tipsTitle}>Contraseña segura requiere:</Text>
            {[
              ['Al menos 8 caracteres',     newPass.length >= 8],
              ['Una letra mayúscula',        /[A-Z]/.test(newPass)],
              ['Un número',                  /[0-9]/.test(newPass)],
              ['Un símbolo (!@#$...)',        /[^A-Za-z0-9]/.test(newPass)],
            ].map(([tip, ok]) => (
              <Text key={tip as string} style={[
                s.tipItem,
                { color: ok ? '#22c55e' : '#6f787d' },
              ]}>
                {ok ? '✓' : '·'} {tip}
              </Text>
            ))}
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[s.saveBtn, loading && { opacity:0.6 }]}
            onPress={handleChange}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={s.saveBtnText}>Guardar nueva contraseña</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:C.bg },
  scroll:       { paddingHorizontal:24, paddingTop:20, paddingBottom:48 },

  header:       { alignItems:'center', marginBottom:28 },
  backBtn:      { alignSelf:'flex-start', width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.06)', justifyContent:'center', alignItems:'center', marginBottom:16 },
  iconWrap:     { width:68, height:68, borderRadius:34, backgroundColor:C.primaryContainer, justifyContent:'center', alignItems:'center', marginBottom:16 },
  title:        { fontSize:24, fontWeight:'800', color:'#fff', marginBottom:8 },
  subtitle:     { fontSize:13, color:C.secondaryDim, textAlign:'center', opacity:0.75, lineHeight:19 },

  inputGroup:   { marginBottom:16 },
  label:        { fontSize:10, fontWeight:'700', color:C.secondaryDim, letterSpacing:1.4, marginBottom:6, paddingLeft:4 },
  inputWrap:    { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:14, paddingHorizontal:14, height:52, borderWidth:1, borderColor:'transparent' },
  inputError:   { borderColor:'rgba(239,68,68,0.5)' },
  input:        { flex:1, color:'#fff', fontSize:15 },
  errText:      { color:C.error, fontSize:11, marginLeft:4, marginTop:4 },

  strengthWrap: { marginBottom:16, marginTop:-8 },
  strengthBar:  { flexDirection:'row', gap:4, marginBottom:6 },
  strengthSeg:  { flex:1, height:4, borderRadius:2 },
  strengthLabel:{ fontSize:11, fontWeight:'700', marginBottom:4 },
  issuesWrap:   { gap:2 },
  issueText:    { color:'#6f787d', fontSize:11 },

  tipsBox:      { backgroundColor:'rgba(0,100,126,0.08)', borderRadius:12, padding:14, marginBottom:20, borderWidth:1, borderColor:'rgba(0,100,126,0.18)' },
  tipsTitle:    { color:C.primaryFixed, fontWeight:'700', fontSize:12, marginBottom:8 },
  tipItem:      { fontSize:12, lineHeight:22, fontWeight:'600' },

  saveBtn:      { backgroundColor:C.primary, height:54, borderRadius:27, justifyContent:'center', alignItems:'center', shadowColor:C.primary, shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:10 },
  saveBtnText:  { color:'#fff', fontSize:16, fontWeight:'700' },

  successWrap:  { flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:32 },
  successIcon:  { width:88, height:88, borderRadius:44, backgroundColor:'rgba(74,222,128,0.1)', borderWidth:2, borderColor:'rgba(74,222,128,0.25)', justifyContent:'center', alignItems:'center', marginBottom:24 },
  successTitle: { fontSize:26, fontWeight:'800', color:'#fff', marginBottom:12 },
  successBody:  { fontSize:14, color:C.secondaryDim, textAlign:'center', lineHeight:22, marginBottom:32 },
  primaryBtn:   { backgroundColor:C.primary, height:52, borderRadius:26, justifyContent:'center', alignItems:'center', width:'100%' },
  primaryBtnText:{ color:'#fff', fontSize:15, fontWeight:'700' },
});