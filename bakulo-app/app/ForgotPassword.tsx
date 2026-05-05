/**
 * app/ForgotPassword.tsx  ← F mayúscula = ruta /ForgotPassword
 */
import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions,
} from 'react-native';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { authResetPassword } from '@/service/authService';

const { width } = Dimensions.get('window');
const C = {
  bg:'#0d1517', primary:'#00647e', primaryFixed:'#baeaff',
  primaryContainer:'#004e63', secondaryDim:'#a9cec4',
  surface:'rgba(43,56,58,0.45)', error:'#ef4444', success:'#4ade80',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [errMsg,  setErrMsg]  = useState('');

  const isValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValid(trimmed)) { setErrMsg('Ingresa un email válido'); return; }
    setErrMsg(''); setLoading(true);
    try { await authResetPassword(trimmed); setSent(true); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <SafeAreaView style={s.container}>
      <View style={s.successWrap}>
        <View style={s.successIcon}><CheckCircle color={C.success} size={44} strokeWidth={1.8}/></View>
        <Text style={s.successTitle}>Revisa tu correo</Text>
        <Text style={s.successBody}>
          Si <Text style={{color:C.primaryFixed,fontWeight:'700'}}>{email.trim()}</Text> está
          registrado, recibirás instrucciones.{'\n\n'}
          El enlace es válido por <Text style={{color:C.primaryFixed}}>2 horas</Text>.
        </Text>
        <View style={s.tipsBox}>
          <Text style={s.tipsTitle}>¿No ves el correo?</Text>
          <Text style={s.tipsText}>• Revisa la carpeta de spam.</Text>
          <Text style={s.tipsText}>• Asegúrate de haber escrito bien el email.</Text>
          <Text style={s.tipsText}>• Espera unos minutos e intenta de nuevo.</Text>
        </View>
        <TouchableOpacity style={s.primaryBtn} onPress={()=>router.replace('/login')}>
          <Text style={s.primaryBtnText}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={()=>{setSent(false);setEmail('');}}>
          <Text style={s.ghostBtnText}>Intentar con otro email</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={[s.circle,{top:-50,right:-50,backgroundColor:C.primary}]}/>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <View style={s.inner}>
          <TouchableOpacity style={s.backBtn} onPress={()=>router.back()}>
            <ArrowLeft color={C.secondaryDim} size={22}/>
          </TouchableOpacity>
          <View style={s.iconWrap}><Mail color={C.primaryFixed} size={30} strokeWidth={1.8}/></View>
          <Text style={s.title}>¿Olvidaste tu{'\n'}contraseña?</Text>
          <Text style={s.subtitle}>Ingresa tu correo y te enviaremos un enlace para restablecerla.</Text>
          <View style={s.inputGroup}>
            <Text style={s.label}>CORREO ELECTRÓNICO</Text>
            <View style={[s.inputWrap, !!errMsg && s.inputError]}>
              <Mail color={C.secondaryDim} size={18} style={{marginRight:10,opacity:0.7}}/>
              <TextInput style={s.input} placeholder="tu@correo.com"
                placeholderTextColor="rgba(169,206,196,0.3)" value={email}
                onChangeText={t=>{setEmail(t);setErrMsg('');}}
                keyboardType="email-address" autoCapitalize="none" editable={!loading}/>
            </View>
            {!!errMsg && <Text style={s.errText}>{errMsg}</Text>}
          </View>
          <TouchableOpacity style={[s.sendBtn,loading&&{opacity:0.6}]} onPress={handleSend} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff"/>
              : <><Send color="#fff" size={18}/><Text style={s.sendBtnText}>Enviar instrucciones</Text></>}
          </TouchableOpacity>
          <TouchableOpacity style={s.footer} onPress={()=>router.back()}>
            <Text style={s.footerText}>Recordé mi contraseña — <Text style={s.footerLink}>Ingresar</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg},
  inner:{flex:1,paddingHorizontal:28,paddingTop:20,justifyContent:'center'},
  circle:{position:'absolute',width:width*0.65,height:width*0.65,borderRadius:(width*0.65)/2,opacity:0.12},
  backBtn:{position:'absolute',top:20,left:28,width:40,height:40,borderRadius:20,backgroundColor:'rgba(255,255,255,0.06)',justifyContent:'center',alignItems:'center'},
  iconWrap:{width:72,height:72,borderRadius:36,backgroundColor:C.primaryContainer,justifyContent:'center',alignItems:'center',marginBottom:24,alignSelf:'center'},
  title:{fontSize:28,fontWeight:'800',color:'#fff',textAlign:'center',lineHeight:36,marginBottom:12},
  subtitle:{fontSize:14,color:C.secondaryDim,textAlign:'center',lineHeight:21,marginBottom:32,opacity:0.8},
  inputGroup:{marginBottom:20},
  label:{fontSize:10,fontWeight:'700',color:C.secondaryDim,letterSpacing:1.4,marginBottom:6,paddingLeft:4},
  inputWrap:{flexDirection:'row',alignItems:'center',backgroundColor:C.surface,borderRadius:14,paddingHorizontal:14,height:52,borderWidth:1,borderColor:'transparent'},
  inputError:{borderColor:'rgba(239,68,68,0.5)'},
  input:{flex:1,color:'#fff',fontSize:15},
  errText:{color:C.error,fontSize:11,marginLeft:4,marginTop:4},
  sendBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,backgroundColor:C.primary,height:54,borderRadius:27},
  sendBtnText:{color:'#fff',fontSize:16,fontWeight:'700'},
  footer:{marginTop:24,alignItems:'center'},
  footerText:{color:C.secondaryDim,opacity:0.8,fontSize:14},
  footerLink:{color:C.primaryFixed,fontWeight:'700'},
  successWrap:{flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:28},
  successIcon:{width:88,height:88,borderRadius:44,backgroundColor:'rgba(74,222,128,0.1)',borderWidth:2,borderColor:'rgba(74,222,128,0.25)',justifyContent:'center',alignItems:'center',marginBottom:24},
  successTitle:{fontSize:26,fontWeight:'800',color:'#fff',marginBottom:14},
  successBody:{fontSize:14,color:C.secondaryDim,textAlign:'center',lineHeight:22,marginBottom:24},
  tipsBox:{backgroundColor:'rgba(0,100,126,0.12)',borderRadius:14,padding:16,width:'100%',borderWidth:1,borderColor:'rgba(0,100,126,0.2)',marginBottom:28},
  tipsTitle:{color:C.primaryFixed,fontWeight:'700',fontSize:13,marginBottom:8},
  tipsText:{color:C.secondaryDim,fontSize:12,lineHeight:20,opacity:0.85},
  primaryBtn:{backgroundColor:C.primary,height:52,borderRadius:26,justifyContent:'center',alignItems:'center',width:'100%',marginBottom:12},
  primaryBtnText:{color:'#fff',fontSize:15,fontWeight:'700'},
  ghostBtn:{height:46,borderRadius:23,justifyContent:'center',alignItems:'center',width:'100%',borderWidth:1,borderColor:'rgba(255,255,255,0.1)'},
  ghostBtnText:{color:C.secondaryDim,fontSize:14,fontWeight:'500'},
});